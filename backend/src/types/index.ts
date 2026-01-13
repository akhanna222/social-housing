// Careify Backend Types

export interface Application {
  id: string;
  cluid: string; // Client Unique ID
  referenceNumber: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  applicantData: ApplicantData;
  documentChecklistStatus: DocumentChecklistStatus;
}

export type ApplicationStatus =
  | 'draft'
  | 'documents_pending'
  | 'documents_processing'
  | 'documents_review'
  | 'eligibility_check'
  | 'approved'
  | 'declined';

export interface ApplicantData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationalInsuranceNumber?: string;
  address: Address;
  householdSize: number;
  householdMembers: HouseholdMember[];
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
}

export interface HouseholdMember {
  firstName: string;
  lastName: string;
  relationship: string;
  dateOfBirth: string;
  requiresSupport?: boolean;
}

// Document Types
export type DocumentCategory =
  | 'identity'
  | 'income'
  | 'bank_statement'
  | 'welfare_benefit'
  | 'medical'
  | 'tenancy'
  | 'proof_of_address'
  | 'other'
  | 'unknown';

export interface Document {
  id: string;
  applicationId: string;
  cluid: string;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  s3Key: string;
  version: number;
  category: DocumentCategory;
  classificationConfidence: number;
  processingStatus: DocumentProcessingStatus;
  extractedData?: ExtractedDocumentData;
  extractionVersion: number;
  completenessScore: number;
  completenessIssues: string[];
  createdAt: string;
  updatedAt: string;
}

export type DocumentProcessingStatus =
  | 'uploaded'
  | 'classifying'
  | 'classified'
  | 'extracting'
  | 'extracted'
  | 'validation_failed'
  | 'completed'
  | 'error';

// Extracted Data Schemas per Document Type
export interface ExtractedDocumentData {
  documentType: DocumentCategory;
  confidence: number;
  extractedAt: string;
  fields: Record<string, ExtractedField>;
  rawText?: string;
}

export interface ExtractedField {
  value: string | number | boolean | null;
  confidence: number;
  source?: string; // Reference to where in document this was found
  issues?: string[];
}

// Identity Document Schema
export interface IdentityDocumentData {
  documentSubtype: 'passport' | 'driving_licence' | 'national_id' | 'other';
  fullName: ExtractedField;
  dateOfBirth: ExtractedField;
  documentNumber: ExtractedField;
  expiryDate: ExtractedField;
  nationality?: ExtractedField;
  issueDate?: ExtractedField;
  issuingAuthority?: ExtractedField;
}

// Income Document Schema (Payslip)
export interface IncomeDocumentData {
  documentSubtype: 'payslip' | 'p60' | 'employment_letter' | 'self_employment';
  employerName: ExtractedField;
  employeeName: ExtractedField;
  payPeriod: ExtractedField;
  payDate: ExtractedField;
  grossPay: ExtractedField;
  netPay: ExtractedField;
  taxDeducted?: ExtractedField;
  niContributions?: ExtractedField;
}

// Bank Statement Schema
export interface BankStatementData {
  bankName: ExtractedField;
  accountHolder: ExtractedField;
  accountNumber: ExtractedField;
  sortCode: ExtractedField;
  statementPeriod: ExtractedField;
  openingBalance: ExtractedField;
  closingBalance: ExtractedField;
  totalCredits?: ExtractedField;
  totalDebits?: ExtractedField;
}

// Welfare Benefit Letter Schema
export interface WelfareBenefitData {
  benefitType: ExtractedField; // Universal Credit, Housing Benefit, etc.
  recipientName: ExtractedField;
  niNumber: ExtractedField;
  awardAmount: ExtractedField;
  awardPeriod: ExtractedField;
  issueDate: ExtractedField;
  issuingBody: ExtractedField;
}

// Medical Letter Schema
export interface MedicalDocumentData {
  issuerName: ExtractedField; // GP, Hospital, etc.
  issuerAddress?: ExtractedField;
  patientName: ExtractedField;
  dateOfLetter: ExtractedField;
  medicalConditions?: ExtractedField;
  supportRequirements?: ExtractedField;
}

// Document Version
export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  s3Key: string;
  extractedData?: ExtractedDocumentData;
  createdAt: string;
  createdBy?: string;
  changeReason?: string;
}

// Extraction Version (for JSON output versioning)
export interface ExtractionVersion {
  id: string;
  documentId: string;
  version: number;
  extractedData: ExtractedDocumentData;
  modelVersion: string;
  promptVersion: string;
  createdAt: string;
}

// Document Checklist
export interface DocumentChecklistStatus {
  identity: ChecklistItem;
  income: ChecklistItem;
  bankStatements: ChecklistItem;
  proofOfAddress: ChecklistItem;
  welfareBenefit?: ChecklistItem;
  medicalEvidence?: ChecklistItem;
  tenancyAgreement?: ChecklistItem;
}

export interface ChecklistItem {
  required: boolean;
  status: 'missing' | 'pending' | 'verified' | 'issues';
  documentIds: string[];
  issues?: string[];
}

// Classification Result
export interface ClassificationResult {
  category: DocumentCategory;
  confidence: number;
  subtype?: string;
  reasoning: string;
  alternativeCategories?: {
    category: DocumentCategory;
    confidence: number;
  }[];
}

// Extraction Result
export interface ExtractionResult {
  success: boolean;
  documentType: DocumentCategory;
  fields: Record<string, ExtractedField>;
  completenessScore: number;
  issues: ExtractionIssue[];
  rawText?: string;
}

export interface ExtractionIssue {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
