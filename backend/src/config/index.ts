import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // AWS S3
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'eu-west-2',
    s3BucketName: process.env.S3_BUCKET_NAME || 'careify-documents',
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10),
  },

  // Database
  database: {
    path: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'careify.db'),
  },

  // Document Processing
  documents: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
    classificationThreshold: 0.7, // Minimum confidence for auto-classification
    extractionThreshold: 0.6, // Minimum confidence for extracted fields
  },
};

export function validateConfig(): void {
  const required = [
    ['OPENAI_API_KEY', config.openai.apiKey],
  ];

  const missing = required.filter(([, value]) => !value);

  if (missing.length > 0 && config.nodeEnv === 'production') {
    throw new Error(
      `Missing required environment variables: ${missing.map(([name]) => name).join(', ')}`
    );
  }
}

export default config;
