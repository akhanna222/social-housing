/**
 * Schema Versioning Service
 *
 * Manages versioned extraction schemas for document types.
 * Tracks schema changes over time and enables migration of extracted data.
 */

import type { DocumentCategory } from '../types/index.js';

export interface SchemaVersion {
  version: string;
  createdAt: string;
  description: string;
  schema: object;
  requiredFields: string[];
  changelog?: string[];
}

export interface SchemaRegistry {
  currentVersion: string;
  versions: SchemaVersion[];
}

// Schema version registry for each document category
const SCHEMA_REGISTRIES: Record<DocumentCategory, SchemaRegistry> = {
  identity: {
    currentVersion: '2.0.0',
    versions: [
      {
        version: '1.0.0',
        createdAt: '2024-01-01',
        description: 'Initial identity document schema',
        schema: {
          type: 'object',
          properties: {
            fullName: { type: 'string' },
            dateOfBirth: { type: 'string' },
            documentNumber: { type: 'string' },
          },
        },
        requiredFields: ['fullName', 'dateOfBirth'],
      },
      {
        version: '2.0.0',
        createdAt: '2024-06-01',
        description: 'Enhanced identity schema with document subtypes',
        changelog: [
          'Added documentSubtype field',
          'Added expiryDate as required field',
          'Added nationality, issueDate, issuingAuthority fields',
          'Added gender and placeOfBirth fields',
        ],
        schema: {
          type: 'object',
          properties: {
            documentSubtype: {
              type: 'string',
              enum: ['passport', 'driving_licence', 'national_id', 'birth_certificate', 'other'],
              description: 'Type of identity document',
            },
            fullName: { type: 'string', description: 'Full name as shown on document' },
            dateOfBirth: { type: 'string', description: 'Date of birth in YYYY-MM-DD format' },
            documentNumber: { type: 'string', description: 'Document number/ID' },
            expiryDate: { type: 'string', description: 'Expiry date in YYYY-MM-DD format' },
            nationality: { type: 'string', description: 'Nationality if shown' },
            issueDate: { type: 'string', description: 'Issue date if shown' },
            issuingAuthority: { type: 'string', description: 'Issuing authority/country' },
            gender: { type: 'string', description: 'Gender if shown' },
            placeOfBirth: { type: 'string', description: 'Place of birth if shown' },
          },
          required: ['documentSubtype', 'fullName', 'dateOfBirth', 'documentNumber'],
        },
        requiredFields: ['fullName', 'dateOfBirth', 'documentNumber', 'expiryDate'],
      },
    ],
  },

  income: {
    currentVersion: '2.0.0',
    versions: [
      {
        version: '1.0.0',
        createdAt: '2024-01-01',
        description: 'Initial income document schema',
        schema: {
          type: 'object',
          properties: {
            employerName: { type: 'string' },
            grossPay: { type: 'number' },
            netPay: { type: 'number' },
          },
        },
        requiredFields: ['employerName', 'grossPay', 'netPay'],
      },
      {
        version: '2.0.0',
        createdAt: '2024-06-01',
        description: 'Enhanced income schema with tax details',
        changelog: [
          'Added documentSubtype for income source classification',
          'Added employeeName, employeeAddress fields',
          'Added niNumber, payPeriod, payDate fields',
          'Added tax deduction fields: taxDeducted, niContributions, pensionContributions',
          'Added taxCode field',
        ],
        schema: {
          type: 'object',
          properties: {
            documentSubtype: {
              type: 'string',
              enum: ['payslip', 'p60', 'employment_letter', 'self_employment', 'other'],
            },
            employerName: { type: 'string' },
            employeeName: { type: 'string' },
            employeeAddress: { type: 'string' },
            niNumber: { type: 'string' },
            payPeriod: { type: 'string' },
            payDate: { type: 'string' },
            grossPay: { type: 'number' },
            netPay: { type: 'number' },
            taxDeducted: { type: 'number' },
            niContributions: { type: 'number' },
            pensionContributions: { type: 'number' },
            taxCode: { type: 'string' },
          },
          required: ['documentSubtype', 'employerName', 'employeeName', 'grossPay', 'netPay'],
        },
        requiredFields: ['employerName', 'employeeName', 'grossPay', 'netPay', 'payDate'],
      },
    ],
  },

  bank_statement: {
    currentVersion: '1.1.0',
    versions: [
      {
        version: '1.0.0',
        createdAt: '2024-01-01',
        description: 'Initial bank statement schema',
        schema: {
          type: 'object',
          properties: {
            bankName: { type: 'string' },
            accountHolder: { type: 'string' },
            statementPeriodStart: { type: 'string' },
            statementPeriodEnd: { type: 'string' },
            closingBalance: { type: 'number' },
          },
        },
        requiredFields: ['bankName', 'accountHolder', 'statementPeriodStart', 'closingBalance'],
      },
      {
        version: '1.1.0',
        createdAt: '2024-06-01',
        description: 'Added account details and transaction summary',
        changelog: [
          'Added accountNumber and sortCode fields',
          'Added openingBalance field',
          'Added totalCredits and totalDebits fields',
          'Added accountType field',
        ],
        schema: {
          type: 'object',
          properties: {
            bankName: { type: 'string' },
            accountHolder: { type: 'string' },
            accountNumber: { type: 'string' },
            sortCode: { type: 'string' },
            statementPeriodStart: { type: 'string' },
            statementPeriodEnd: { type: 'string' },
            openingBalance: { type: 'number' },
            closingBalance: { type: 'number' },
            totalCredits: { type: 'number' },
            totalDebits: { type: 'number' },
            accountType: { type: 'string' },
          },
          required: ['bankName', 'accountHolder', 'statementPeriodStart', 'statementPeriodEnd'],
        },
        requiredFields: ['bankName', 'accountHolder', 'statementPeriodStart', 'closingBalance'],
      },
    ],
  },

  welfare_benefit: {
    currentVersion: '1.1.0',
    versions: [
      {
        version: '1.0.0',
        createdAt: '2024-01-01',
        description: 'Initial welfare benefit schema',
        schema: {
          type: 'object',
          properties: {
            benefitType: { type: 'string' },
            recipientName: { type: 'string' },
            awardAmount: { type: 'number' },
            letterDate: { type: 'string' },
          },
        },
        requiredFields: ['benefitType', 'recipientName', 'awardAmount', 'letterDate'],
      },
      {
        version: '1.1.0',
        createdAt: '2024-06-01',
        description: 'Enhanced welfare schema with UC housing element',
        changelog: [
          'Added recipientAddress and niNumber fields',
          'Added claimReference field',
          'Added paymentFrequency and award period fields',
          'Added issuingBody field',
          'Added housingElement for Universal Credit claims',
        ],
        schema: {
          type: 'object',
          properties: {
            benefitType: { type: 'string' },
            recipientName: { type: 'string' },
            recipientAddress: { type: 'string' },
            niNumber: { type: 'string' },
            claimReference: { type: 'string' },
            awardAmount: { type: 'number' },
            paymentFrequency: { type: 'string' },
            awardPeriodStart: { type: 'string' },
            awardPeriodEnd: { type: 'string' },
            letterDate: { type: 'string' },
            issuingBody: { type: 'string' },
            housingElement: { type: 'number' },
          },
          required: ['benefitType', 'recipientName', 'awardAmount', 'letterDate'],
        },
        requiredFields: ['benefitType', 'recipientName', 'awardAmount', 'letterDate', 'issuingBody'],
      },
    ],
  },

  medical: {
    currentVersion: '1.0.0',
    versions: [
      {
        version: '1.0.0',
        createdAt: '2024-01-01',
        description: 'Medical document schema',
        schema: {
          type: 'object',
          properties: {
            documentSubtype: { type: 'string', enum: ['gp_letter', 'hospital_letter', 'assessment', 'prescription', 'other'] },
            issuerName: { type: 'string' },
            issuerAddress: { type: 'string' },
            patientName: { type: 'string' },
            patientDOB: { type: 'string' },
            nhsNumber: { type: 'string' },
            letterDate: { type: 'string' },
            medicalConditions: { type: 'array', items: { type: 'string' } },
            supportRequirements: { type: 'string' },
            mobilityIssues: { type: 'boolean' },
            groundFloorRequired: { type: 'boolean' },
          },
          required: ['issuerName', 'patientName', 'letterDate'],
        },
        requiredFields: ['issuerName', 'patientName', 'letterDate'],
      },
    ],
  },

  tenancy: {
    currentVersion: '1.0.0',
    versions: [
      {
        version: '1.0.0',
        createdAt: '2024-01-01',
        description: 'Tenancy document schema',
        schema: {
          type: 'object',
          properties: {
            documentSubtype: { type: 'string', enum: ['tenancy_agreement', 'landlord_reference', 'eviction_notice', 'rent_statement', 'other'] },
            landlordName: { type: 'string' },
            landlordAddress: { type: 'string' },
            tenantName: { type: 'string' },
            propertyAddress: { type: 'string' },
            tenancyStartDate: { type: 'string' },
            tenancyEndDate: { type: 'string' },
            rentAmount: { type: 'number' },
            rentFrequency: { type: 'string' },
            depositAmount: { type: 'number' },
            tenancyType: { type: 'string' },
          },
          required: ['tenantName', 'propertyAddress'],
        },
        requiredFields: ['tenantName', 'propertyAddress', 'landlordName'],
      },
    ],
  },

  proof_of_address: {
    currentVersion: '1.0.0',
    versions: [
      {
        version: '1.0.0',
        createdAt: '2024-01-01',
        description: 'Proof of address schema',
        schema: {
          type: 'object',
          properties: {
            documentSubtype: { type: 'string', enum: ['utility_bill', 'council_tax', 'official_letter', 'bank_letter', 'other'] },
            recipientName: { type: 'string' },
            address: { type: 'string' },
            documentDate: { type: 'string' },
            issuer: { type: 'string' },
            accountNumber: { type: 'string' },
          },
          required: ['recipientName', 'address', 'documentDate'],
        },
        requiredFields: ['recipientName', 'address', 'documentDate', 'issuer'],
      },
    ],
  },

  other: {
    currentVersion: '1.0.0',
    versions: [
      {
        version: '1.0.0',
        createdAt: '2024-01-01',
        description: 'Generic other document schema',
        schema: {
          type: 'object',
          properties: {
            documentDescription: { type: 'string' },
            relevantText: { type: 'string' },
            dateOnDocument: { type: 'string' },
            namesOnDocument: { type: 'array', items: { type: 'string' } },
          },
          required: ['documentDescription'],
        },
        requiredFields: ['documentDescription'],
      },
    ],
  },

  unknown: {
    currentVersion: '1.0.0',
    versions: [
      {
        version: '1.0.0',
        createdAt: '2024-01-01',
        description: 'Unknown document schema',
        schema: {
          type: 'object',
          properties: {
            possibleType: { type: 'string' },
            visibleText: { type: 'string' },
            qualityIssues: { type: 'array', items: { type: 'string' } },
          },
          required: ['qualityIssues'],
        },
        requiredFields: ['qualityIssues'],
      },
    ],
  },
};

export class SchemaVersioningService {
  /**
   * Get the current schema version for a document category
   */
  getCurrentVersion(category: DocumentCategory): string {
    return SCHEMA_REGISTRIES[category]?.currentVersion || '1.0.0';
  }

  /**
   * Get the current schema for a document category
   */
  getCurrentSchema(category: DocumentCategory): SchemaVersion | null {
    const registry = SCHEMA_REGISTRIES[category];
    if (!registry) return null;

    return registry.versions.find((v) => v.version === registry.currentVersion) || null;
  }

  /**
   * Get a specific schema version
   */
  getSchemaVersion(category: DocumentCategory, version: string): SchemaVersion | null {
    const registry = SCHEMA_REGISTRIES[category];
    if (!registry) return null;

    return registry.versions.find((v) => v.version === version) || null;
  }

  /**
   * Get all schema versions for a category
   */
  getAllVersions(category: DocumentCategory): SchemaVersion[] {
    return SCHEMA_REGISTRIES[category]?.versions || [];
  }

  /**
   * Get schema registry for a category
   */
  getRegistry(category: DocumentCategory): SchemaRegistry | null {
    return SCHEMA_REGISTRIES[category] || null;
  }

  /**
   * Compare two schema versions
   */
  compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1 = v1Parts[i] || 0;
      const v2 = v2Parts[i] || 0;
      if (v1 > v2) return 1;
      if (v1 < v2) return -1;
    }
    return 0;
  }

  /**
   * Check if extraction needs migration to current schema
   */
  needsMigration(category: DocumentCategory, extractedVersion: string): boolean {
    const currentVersion = this.getCurrentVersion(category);
    return this.compareVersions(extractedVersion, currentVersion) < 0;
  }

  /**
   * Get migration path from one version to another
   */
  getMigrationPath(
    category: DocumentCategory,
    fromVersion: string,
    toVersion: string
  ): SchemaVersion[] {
    const registry = SCHEMA_REGISTRIES[category];
    if (!registry) return [];

    const fromIdx = registry.versions.findIndex((v) => v.version === fromVersion);
    const toIdx = registry.versions.findIndex((v) => v.version === toVersion);

    if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return [];

    return registry.versions.slice(fromIdx + 1, toIdx + 1);
  }

  /**
   * Get changelog between two versions
   */
  getChangelog(
    category: DocumentCategory,
    fromVersion: string,
    toVersion: string
  ): string[] {
    const migrationPath = this.getMigrationPath(category, fromVersion, toVersion);
    const changelog: string[] = [];

    for (const version of migrationPath) {
      if (version.changelog) {
        changelog.push(`v${version.version}: ${version.description}`);
        changelog.push(...version.changelog.map((c) => `  - ${c}`));
      }
    }

    return changelog;
  }

  /**
   * Validate extraction data against a specific schema version
   */
  validateAgainstSchema(
    category: DocumentCategory,
    version: string,
    data: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const schemaVersion = this.getSchemaVersion(category, version);
    if (!schemaVersion) {
      return { valid: false, errors: [`Schema version ${version} not found for ${category}`] };
    }

    const errors: string[] = [];
    const schema = schemaVersion.schema as { properties?: Record<string, unknown>; required?: string[] };

    // Check required fields
    const requiredFields = schema.required || [];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get all registered categories
   */
  getCategories(): DocumentCategory[] {
    return Object.keys(SCHEMA_REGISTRIES) as DocumentCategory[];
  }

  /**
   * Export schema metadata for API
   */
  exportSchemaMetadata(): Record<DocumentCategory, { currentVersion: string; versions: string[] }> {
    const metadata: Record<string, { currentVersion: string; versions: string[] }> = {};

    for (const [category, registry] of Object.entries(SCHEMA_REGISTRIES)) {
      metadata[category] = {
        currentVersion: registry.currentVersion,
        versions: registry.versions.map((v) => v.version),
      };
    }

    return metadata as Record<DocumentCategory, { currentVersion: string; versions: string[] }>;
  }
}

export const schemaVersioningService = new SchemaVersioningService();
