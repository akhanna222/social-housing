import OpenAI from 'openai';
import { config } from '../config/index.js';
import type {
  DocumentCategory,
  ExtractionResult,
  ExtractedField,
  ExtractionIssue,
} from '../types/index.js';

// Schema definitions for each document type
const EXTRACTION_SCHEMAS: Record<DocumentCategory, object> = {
  identity: {
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

  income: {
    type: 'object',
    properties: {
      documentSubtype: {
        type: 'string',
        enum: ['payslip', 'p60', 'employment_letter', 'self_employment', 'other'],
      },
      employerName: { type: 'string', description: 'Name of employer' },
      employeeName: { type: 'string', description: 'Name of employee' },
      employeeAddress: { type: 'string', description: 'Employee address if shown' },
      niNumber: { type: 'string', description: 'National Insurance number' },
      payPeriod: { type: 'string', description: 'Pay period (e.g., "Monthly", "01/01/2024 - 31/01/2024")' },
      payDate: { type: 'string', description: 'Payment date in YYYY-MM-DD format' },
      grossPay: { type: 'number', description: 'Gross pay amount in GBP' },
      netPay: { type: 'number', description: 'Net pay amount in GBP' },
      taxDeducted: { type: 'number', description: 'Tax deducted in GBP' },
      niContributions: { type: 'number', description: 'NI contributions in GBP' },
      pensionContributions: { type: 'number', description: 'Pension contributions if shown' },
      taxCode: { type: 'string', description: 'Tax code if shown' },
    },
    required: ['documentSubtype', 'employerName', 'employeeName', 'grossPay', 'netPay'],
  },

  bank_statement: {
    type: 'object',
    properties: {
      bankName: { type: 'string', description: 'Name of bank' },
      accountHolder: { type: 'string', description: 'Account holder name' },
      accountNumber: { type: 'string', description: 'Account number (may be partially masked)' },
      sortCode: { type: 'string', description: 'Sort code' },
      statementPeriodStart: { type: 'string', description: 'Statement start date YYYY-MM-DD' },
      statementPeriodEnd: { type: 'string', description: 'Statement end date YYYY-MM-DD' },
      openingBalance: { type: 'number', description: 'Opening balance in GBP' },
      closingBalance: { type: 'number', description: 'Closing balance in GBP' },
      totalCredits: { type: 'number', description: 'Total money in' },
      totalDebits: { type: 'number', description: 'Total money out' },
      accountType: { type: 'string', description: 'Type of account if shown' },
    },
    required: ['bankName', 'accountHolder', 'statementPeriodStart', 'statementPeriodEnd'],
  },

  welfare_benefit: {
    type: 'object',
    properties: {
      benefitType: {
        type: 'string',
        description: 'Type of benefit (Universal Credit, Housing Benefit, PIP, ESA, etc.)',
      },
      recipientName: { type: 'string', description: 'Name of benefit recipient' },
      recipientAddress: { type: 'string', description: 'Address of recipient' },
      niNumber: { type: 'string', description: 'National Insurance number' },
      claimReference: { type: 'string', description: 'Claim reference number' },
      awardAmount: { type: 'number', description: 'Award amount in GBP' },
      paymentFrequency: { type: 'string', description: 'How often payment is made' },
      awardPeriodStart: { type: 'string', description: 'Award start date YYYY-MM-DD' },
      awardPeriodEnd: { type: 'string', description: 'Award end date if applicable' },
      letterDate: { type: 'string', description: 'Date of letter YYYY-MM-DD' },
      issuingBody: { type: 'string', description: 'DWP, Council, etc.' },
      housingElement: { type: 'number', description: 'Housing element amount if UC' },
    },
    required: ['benefitType', 'recipientName', 'awardAmount', 'letterDate'],
  },

  medical: {
    type: 'object',
    properties: {
      documentSubtype: {
        type: 'string',
        enum: ['gp_letter', 'hospital_letter', 'assessment', 'prescription', 'other'],
      },
      issuerName: { type: 'string', description: 'Name of GP/Hospital/Clinic' },
      issuerAddress: { type: 'string', description: 'Address of issuer' },
      patientName: { type: 'string', description: 'Patient name' },
      patientDOB: { type: 'string', description: 'Patient date of birth if shown' },
      nhsNumber: { type: 'string', description: 'NHS number if shown' },
      letterDate: { type: 'string', description: 'Date of letter YYYY-MM-DD' },
      medicalConditions: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of medical conditions mentioned',
      },
      supportRequirements: { type: 'string', description: 'Support needs mentioned' },
      mobilityIssues: { type: 'boolean', description: 'Mobility issues mentioned' },
      groundFloorRequired: { type: 'boolean', description: 'Ground floor accommodation recommended' },
    },
    required: ['issuerName', 'patientName', 'letterDate'],
  },

  tenancy: {
    type: 'object',
    properties: {
      documentSubtype: {
        type: 'string',
        enum: ['tenancy_agreement', 'landlord_reference', 'eviction_notice', 'rent_statement', 'other'],
      },
      landlordName: { type: 'string', description: 'Name of landlord/agency' },
      landlordAddress: { type: 'string', description: 'Landlord address' },
      tenantName: { type: 'string', description: 'Tenant name' },
      propertyAddress: { type: 'string', description: 'Address of rented property' },
      tenancyStartDate: { type: 'string', description: 'Tenancy start date YYYY-MM-DD' },
      tenancyEndDate: { type: 'string', description: 'Tenancy end date if applicable' },
      rentAmount: { type: 'number', description: 'Rent amount in GBP' },
      rentFrequency: { type: 'string', description: 'Weekly, Monthly, etc.' },
      depositAmount: { type: 'number', description: 'Deposit amount if shown' },
      tenancyType: { type: 'string', description: 'AST, Periodic, etc.' },
    },
    required: ['tenantName', 'propertyAddress'],
  },

  proof_of_address: {
    type: 'object',
    properties: {
      documentSubtype: {
        type: 'string',
        enum: ['utility_bill', 'council_tax', 'official_letter', 'bank_letter', 'other'],
      },
      recipientName: { type: 'string', description: 'Name on document' },
      address: { type: 'string', description: 'Full address shown' },
      documentDate: { type: 'string', description: 'Date of document YYYY-MM-DD' },
      issuer: { type: 'string', description: 'Who issued the document' },
      accountNumber: { type: 'string', description: 'Account/reference number if applicable' },
    },
    required: ['recipientName', 'address', 'documentDate'],
  },

  other: {
    type: 'object',
    properties: {
      documentDescription: { type: 'string', description: 'Brief description of document' },
      relevantText: { type: 'string', description: 'Any relevant text extracted' },
      dateOnDocument: { type: 'string', description: 'Any date shown YYYY-MM-DD' },
      namesOnDocument: {
        type: 'array',
        items: { type: 'string' },
        description: 'Names appearing on document',
      },
    },
    required: ['documentDescription'],
  },

  unknown: {
    type: 'object',
    properties: {
      possibleType: { type: 'string', description: 'Best guess at document type' },
      visibleText: { type: 'string', description: 'Any readable text' },
      qualityIssues: {
        type: 'array',
        items: { type: 'string' },
        description: 'Issues preventing identification',
      },
    },
    required: ['qualityIssues'],
  },
};

// Required fields per document type for completeness checking
const REQUIRED_FIELDS: Record<DocumentCategory, string[]> = {
  identity: ['fullName', 'dateOfBirth', 'documentNumber', 'expiryDate'],
  income: ['employerName', 'employeeName', 'grossPay', 'netPay', 'payDate'],
  bank_statement: ['bankName', 'accountHolder', 'statementPeriodStart', 'closingBalance'],
  welfare_benefit: ['benefitType', 'recipientName', 'awardAmount', 'letterDate', 'issuingBody'],
  medical: ['issuerName', 'patientName', 'letterDate'],
  tenancy: ['tenantName', 'propertyAddress', 'landlordName'],
  proof_of_address: ['recipientName', 'address', 'documentDate', 'issuer'],
  other: ['documentDescription'],
  unknown: ['qualityIssues'],
};

export class ExtractionService {
  private openai: OpenAI;
  private model: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.model = config.openai.model;
  }

  /**
   * Extract data from a document based on its category
   */
  async extractDocument(
    imageBase64: string,
    mimeType: string,
    category: DocumentCategory
  ): Promise<ExtractionResult> {
    const schema = EXTRACTION_SCHEMAS[category];
    const requiredFields = REQUIRED_FIELDS[category];

    const prompt = this.buildExtractionPrompt(category, schema);

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        max_tokens: config.openai.maxTokens,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: `Extract all relevant information from this ${this.getCategoryDisplayName(category)} document. Be precise with dates (use YYYY-MM-DD format) and monetary values. If a field is not visible or unclear, set its value to null.`,
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from extraction model');
      }

      const rawExtraction = JSON.parse(content);

      // Process and validate extraction
      const fields = this.processExtractedFields(rawExtraction, category);
      const { completenessScore, issues } = this.checkCompleteness(fields, requiredFields, category);

      return {
        success: true,
        documentType: category,
        fields,
        completenessScore,
        issues,
      };
    } catch (error) {
      console.error('Extraction error:', error);

      return {
        success: false,
        documentType: category,
        fields: {},
        completenessScore: 0,
        issues: [
          {
            field: '_general',
            severity: 'error',
            message: `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }

  /**
   * Build extraction prompt based on document category
   */
  private buildExtractionPrompt(category: DocumentCategory, schema: object): string {
    return `You are an expert document data extractor for UK social housing applications.

Your task is to extract structured data from a ${this.getCategoryDisplayName(category)} document.

IMPORTANT GUIDELINES:
1. Extract ALL visible information that matches the schema
2. Use YYYY-MM-DD format for all dates
3. Use numeric values for monetary amounts (no currency symbols)
4. If a field is partially visible, extract what you can and note confidence
5. If a field is completely missing or illegible, set value to null
6. For each field, provide a confidence score (0-1)

RESPONSE FORMAT:
Return a JSON object where each field has this structure:
{
  "fieldName": {
    "value": <extracted value or null>,
    "confidence": <0.0-1.0>,
    "source": "<optional: where in document this was found>",
    "issues": ["<optional: any issues with extraction>"]
  }
}

SCHEMA TO FOLLOW:
${JSON.stringify(schema, null, 2)}

Be thorough but accurate. It's better to mark something as null with a note than to guess incorrectly.`;
  }

  /**
   * Process raw extracted fields into standardized format
   */
  private processExtractedFields(
    rawExtraction: Record<string, unknown>,
    category: DocumentCategory
  ): Record<string, ExtractedField> {
    const fields: Record<string, ExtractedField> = {};

    for (const [key, value] of Object.entries(rawExtraction)) {
      if (value === null || value === undefined) {
        fields[key] = {
          value: null,
          confidence: 0,
        };
      } else if (typeof value === 'object' && 'value' in (value as object)) {
        // Already in correct format
        const fieldData = value as ExtractedField;
        fields[key] = {
          value: fieldData.value,
          confidence: Math.max(0, Math.min(1, fieldData.confidence || 0.5)),
          source: fieldData.source,
          issues: fieldData.issues,
        };
      } else {
        // Simple value, assume medium confidence
        fields[key] = {
          value: value as string | number | boolean,
          confidence: 0.7,
        };
      }
    }

    return fields;
  }

  /**
   * Check completeness of extraction
   */
  private checkCompleteness(
    fields: Record<string, ExtractedField>,
    requiredFields: string[],
    category: DocumentCategory
  ): { completenessScore: number; issues: ExtractionIssue[] } {
    const issues: ExtractionIssue[] = [];
    let filledRequired = 0;
    let totalRequired = requiredFields.length;

    // Check required fields
    for (const fieldName of requiredFields) {
      const field = fields[fieldName];

      if (!field || field.value === null || field.value === '') {
        issues.push({
          field: fieldName,
          severity: 'error',
          message: `Required field "${this.formatFieldName(fieldName)}" is missing`,
          suggestion: this.getFieldSuggestion(fieldName, category),
        });
      } else if (field.confidence < config.documents.extractionThreshold) {
        issues.push({
          field: fieldName,
          severity: 'warning',
          message: `Field "${this.formatFieldName(fieldName)}" has low confidence (${Math.round(field.confidence * 100)}%)`,
          suggestion: 'Please verify this value manually',
        });
        filledRequired += 0.5; // Partial credit
      } else {
        filledRequired += 1;
      }
    }

    // Check for fields with issues
    for (const [fieldName, field] of Object.entries(fields)) {
      if (field.issues && field.issues.length > 0) {
        for (const issue of field.issues) {
          issues.push({
            field: fieldName,
            severity: 'warning',
            message: issue,
          });
        }
      }
    }

    // Calculate completeness score
    const completenessScore = totalRequired > 0
      ? Math.round((filledRequired / totalRequired) * 100)
      : 100;

    return { completenessScore, issues };
  }

  /**
   * Get display name for category
   */
  private getCategoryDisplayName(category: DocumentCategory): string {
    const names: Record<DocumentCategory, string> = {
      identity: 'Identity Document',
      income: 'Income/Employment Document',
      bank_statement: 'Bank Statement',
      welfare_benefit: 'Welfare/Benefits Letter',
      medical: 'Medical Document',
      tenancy: 'Tenancy Document',
      proof_of_address: 'Proof of Address',
      other: 'Document',
      unknown: 'Unknown Document',
    };
    return names[category] || category;
  }

  /**
   * Format field name for display
   */
  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Get suggestion for missing field
   */
  private getFieldSuggestion(fieldName: string, category: DocumentCategory): string {
    const suggestions: Record<string, Record<string, string>> = {
      identity: {
        fullName: 'Check the main page of the identity document',
        dateOfBirth: 'Usually found near the photo',
        documentNumber: 'Located at the top or bottom of the document',
        expiryDate: 'Check the document validity section',
      },
      income: {
        employerName: 'Should be at the top of the payslip',
        grossPay: 'Look for "Gross Pay" or "Total Earnings"',
        netPay: 'Look for "Net Pay" or "Take Home Pay"',
      },
      bank_statement: {
        bankName: 'Usually in the header/logo area',
        closingBalance: 'Found at the end of the statement',
      },
      welfare_benefit: {
        awardAmount: 'Look for the payment amount section',
        benefitType: 'Usually stated at the top of the letter',
      },
    };

    return suggestions[category]?.[fieldName] || 'Please upload a clearer image of this section';
  }
}

export const extractionService = new ExtractionService();
