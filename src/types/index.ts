// Careify Type Definitions

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'awaiting_documents'
  | 'eligible'
  | 'ineligible'
  | 'further_review'
  | 'approved'
  | 'declined';

export type DocumentType =
  | 'id'
  | 'payslip'
  | 'bank_statement'
  | 'welfare_letter'
  | 'medical_letter'
  | 'support_letter'
  | 'proof_of_address'
  | 'tenancy_agreement'
  | 'other';

export type DocumentStatus =
  | 'uploaded'
  | 'processing'
  | 'verified'
  | 'needs_review'
  | 'rejected';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type EligibilityOutcome = 'eligible' | 'ineligible' | 'further_review';

export interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationalInsuranceNumber?: string;
  currentAddress: Address;
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
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  dateOfBirth: string;
  hasDisability?: boolean;
  requiresSupport?: boolean;
}

export interface Document {
  id: string;
  applicationId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  documentType: DocumentType;
  suggestedType?: DocumentType;
  status: DocumentStatus;
  confidence: ConfidenceLevel;
  extractedData?: Record<string, unknown>;
  pages?: number;
  notes?: string;
}

export interface Application {
  id: string;
  referenceNumber: string;
  applicant: Applicant;
  status: ApplicationStatus;
  priority: 'standard' | 'urgent' | 'emergency';
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  assignedOfficer?: Officer;
  documents: Document[];
  eligibilityResult?: EligibilityResult;
  completenessScore: number;
  notes: ApplicationNote[];
  auditLog: AuditEntry[];
}

export interface Officer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'housing_officer' | 'intake_admin' | 'compliance_officer' | 'manager';
  avatar?: string;
}

export interface EligibilityResult {
  outcome: EligibilityOutcome;
  assessedAt: string;
  assessedBy: 'system' | string;
  rules: EligibilityRule[];
  overridden: boolean;
  overrideReason?: string;
  overriddenBy?: Officer;
  overriddenAt?: string;
}

export interface EligibilityRule {
  id: string;
  name: string;
  category: 'mandatory' | 'means' | 'residency' | 'completeness';
  passed: boolean;
  reason: string;
  details?: string;
  sourceDocuments?: string[];
}

export interface ApplicationNote {
  id: string;
  content: string;
  createdAt: string;
  createdBy: Officer;
  isInternal: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardStats {
  totalApplications: number;
  pendingReview: number;
  awaitingDocuments: number;
  approvedThisMonth: number;
  averageProcessingDays: number;
}

export interface FilterOptions {
  status?: ApplicationStatus[];
  priority?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  assignedTo?: string;
  searchQuery?: string;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'action_required';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}
