import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import type { ExtractedDocumentData } from '../types/index.js';

export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
    this.bucketName = config.aws.s3BucketName;
  }

  /**
   * Generate S3 key for a document
   * Structure: cluid/application_id/documents/version_X/filename
   */
  generateDocumentKey(
    cluid: string,
    applicationId: string,
    fileName: string,
    version: number = 1
  ): string {
    const sanitizedFileName = this.sanitizeFileName(fileName);
    return `${cluid}/${applicationId}/documents/v${version}/${sanitizedFileName}`;
  }

  /**
   * Generate S3 key for extracted JSON
   * Structure: cluid/application_id/extractions/document_id/version_X.json
   */
  generateExtractionKey(
    cluid: string,
    applicationId: string,
    documentId: string,
    version: number = 1
  ): string {
    return `${cluid}/${applicationId}/extractions/${documentId}/v${version}.json`;
  }

  /**
   * Upload a document to S3
   */
  async uploadDocument(
    cluid: string,
    applicationId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    version: number = 1
  ): Promise<{ s3Key: string; versionId?: string }> {
    const s3Key = this.generateDocumentKey(cluid, applicationId, fileName, version);

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: {
          'cluid': cluid,
          'application-id': applicationId,
          'original-filename': fileName,
          'version': version.toString(),
          'uploaded-at': new Date().toISOString(),
        },
      },
    });

    const result = await upload.done();

    return {
      s3Key,
      versionId: result.VersionId,
    };
  }

  /**
   * Upload extracted data JSON to S3
   */
  async uploadExtraction(
    cluid: string,
    applicationId: string,
    documentId: string,
    extractedData: ExtractedDocumentData,
    version: number = 1
  ): Promise<{ s3Key: string }> {
    const s3Key = this.generateExtractionKey(cluid, applicationId, documentId, version);

    const jsonContent = JSON.stringify(
      {
        ...extractedData,
        _metadata: {
          version,
          documentId,
          applicationId,
          cluid,
          savedAt: new Date().toISOString(),
        },
      },
      null,
      2
    );

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: jsonContent,
        ContentType: 'application/json',
        Metadata: {
          'cluid': cluid,
          'application-id': applicationId,
          'document-id': documentId,
          'version': version.toString(),
        },
      })
    );

    return { s3Key };
  }

  /**
   * Get a document from S3
   */
  async getDocument(s3Key: string): Promise<{ body: Buffer; contentType: string }> {
    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      })
    );

    const body = await this.streamToBuffer(response.Body as Readable);

    return {
      body,
      contentType: response.ContentType || 'application/octet-stream',
    };
  }

  /**
   * Get extracted data JSON from S3
   */
  async getExtraction(s3Key: string): Promise<ExtractedDocumentData | null> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
        })
      );

      const body = await this.streamToBuffer(response.Body as Readable);
      return JSON.parse(body.toString('utf-8'));
    } catch (error) {
      if ((error as { name: string }).name === 'NoSuchKey') {
        return null;
      }
      throw error;
    }
  }

  /**
   * List all document versions for an application
   */
  async listDocumentVersions(
    cluid: string,
    applicationId: string
  ): Promise<{ key: string; version: number; lastModified: Date }[]> {
    const prefix = `${cluid}/${applicationId}/documents/`;

    const response = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      })
    );

    const versions: { key: string; version: number; lastModified: Date }[] = [];

    for (const obj of response.Contents || []) {
      const versionMatch = obj.Key?.match(/\/v(\d+)\//);
      if (versionMatch && obj.Key) {
        versions.push({
          key: obj.Key,
          version: parseInt(versionMatch[1], 10),
          lastModified: obj.LastModified || new Date(),
        });
      }
    }

    return versions.sort((a, b) => b.version - a.version);
  }

  /**
   * List all extraction versions for a document
   */
  async listExtractionVersions(
    cluid: string,
    applicationId: string,
    documentId: string
  ): Promise<{ key: string; version: number; lastModified: Date }[]> {
    const prefix = `${cluid}/${applicationId}/extractions/${documentId}/`;

    const response = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      })
    );

    const versions: { key: string; version: number; lastModified: Date }[] = [];

    for (const obj of response.Contents || []) {
      const versionMatch = obj.Key?.match(/v(\d+)\.json$/);
      if (versionMatch && obj.Key) {
        versions.push({
          key: obj.Key,
          version: parseInt(versionMatch[1], 10),
          lastModified: obj.LastModified || new Date(),
        });
      }
    }

    return versions.sort((a, b) => b.version - a.version);
  }

  /**
   * Create a new version of a document by copying
   */
  async createDocumentVersion(
    cluid: string,
    applicationId: string,
    sourceKey: string,
    newVersion: number
  ): Promise<{ s3Key: string }> {
    // Extract filename from source key
    const fileName = sourceKey.split('/').pop() || 'document';
    const newKey = this.generateDocumentKey(cluid, applicationId, fileName, newVersion);

    await this.s3Client.send(
      new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: newKey,
        Metadata: {
          'cluid': cluid,
          'application-id': applicationId,
          'version': newVersion.toString(),
          'copied-from': sourceKey,
          'copied-at': new Date().toISOString(),
        },
        MetadataDirective: 'REPLACE',
      })
    );

    return { s3Key: newKey };
  }

  /**
   * Delete a document from S3
   */
  async deleteDocument(s3Key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      })
    );
  }

  /**
   * Check if a key exists in S3
   */
  async exists(s3Key: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get document as base64 for Vision API
   */
  async getDocumentAsBase64(s3Key: string): Promise<{ base64: string; mimeType: string }> {
    const { body, contentType } = await this.getDocument(s3Key);
    return {
      base64: body.toString('base64'),
      mimeType: contentType,
    };
  }

  /**
   * Helper: Convert stream to buffer
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  /**
   * Helper: Sanitize filename for S3
   */
  private sanitizeFileName(fileName: string): string {
    // Replace spaces and special characters, keep extension
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }
}

export const storageService = new StorageService();
