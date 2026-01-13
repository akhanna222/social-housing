import type {
  Document,
  DocumentCategory,
  DocumentChecklistStatus,
  ChecklistItem,
  ApplicantData,
} from '../types/index.js';

// Default document requirements for social housing applications
interface ChecklistRequirements {
  identity: {
    required: boolean;
    minDocuments: number;
    validityCheck?: boolean; // Check expiry date
  };
  income: {
    required: boolean;
    minDocuments: number;
    minMonthsCoverage?: number;
  };
  bankStatements: {
    required: boolean;
    minMonthsCoverage: number;
  };
  proofOfAddress: {
    required: boolean;
    maxAgeMonths: number;
  };
  welfareBenefit: {
    required: boolean;
    conditional?: string; // Condition for requirement
  };
  medicalEvidence: {
    required: boolean;
    conditional?: string;
  };
  tenancyAgreement: {
    required: boolean;
    conditional?: string;
  };
}

const DEFAULT_REQUIREMENTS: ChecklistRequirements = {
  identity: {
    required: true,
    minDocuments: 1,
    validityCheck: true,
  },
  income: {
    required: true,
    minDocuments: 1,
    minMonthsCoverage: 3,
  },
  bankStatements: {
    required: true,
    minMonthsCoverage: 3,
  },
  proofOfAddress: {
    required: true,
    maxAgeMonths: 3,
  },
  welfareBenefit: {
    required: false,
    conditional: 'If receiving benefits',
  },
  medicalEvidence: {
    required: false,
    conditional: 'If medical/disability needs',
  },
  tenancyAgreement: {
    required: false,
    conditional: 'If currently renting',
  },
};

export class ChecklistService {
  private requirements: ChecklistRequirements;

  constructor(requirements?: Partial<ChecklistRequirements>) {
    this.requirements = { ...DEFAULT_REQUIREMENTS, ...requirements };
  }

  /**
   * Evaluate document checklist for an application
   */
  evaluateChecklist(
    documents: Document[],
    applicantData?: ApplicantData
  ): DocumentChecklistStatus {
    // Group documents by category
    const documentsByCategory = this.groupDocumentsByCategory(documents);

    return {
      identity: this.evaluateIdentityDocuments(documentsByCategory.identity || []),
      income: this.evaluateIncomeDocuments(documentsByCategory.income || []),
      bankStatements: this.evaluateBankStatements(documentsByCategory.bank_statement || []),
      proofOfAddress: this.evaluateProofOfAddress(documentsByCategory.proof_of_address || []),
      welfareBenefit: this.evaluateWelfareBenefit(documentsByCategory.welfare_benefit || [], applicantData),
      medicalEvidence: this.evaluateMedicalEvidence(documentsByCategory.medical || [], applicantData),
      tenancyAgreement: this.evaluateTenancy(documentsByCategory.tenancy || [], applicantData),
    };
  }

  /**
   * Calculate overall completeness percentage
   */
  calculateOverallCompleteness(checklistStatus: DocumentChecklistStatus): number {
    const items = Object.entries(checklistStatus);
    let totalWeight = 0;
    let achievedWeight = 0;

    for (const [key, item] of items) {
      if (!item) continue;

      // Required items have higher weight
      const weight = item.required ? 2 : 1;

      if (!item.required && item.status === 'missing') {
        // Skip optional items that aren't provided
        continue;
      }

      totalWeight += weight;

      switch (item.status) {
        case 'verified':
          achievedWeight += weight;
          break;
        case 'pending':
          achievedWeight += weight * 0.5;
          break;
        case 'issues':
          achievedWeight += weight * 0.25;
          break;
        case 'missing':
          // No credit for missing required items
          break;
      }
    }

    return totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
  }

  /**
   * Get list of missing required documents
   */
  getMissingDocuments(checklistStatus: DocumentChecklistStatus): string[] {
    const missing: string[] = [];

    const categoryNames: Record<string, string> = {
      identity: 'Identity document (passport or driving licence)',
      income: 'Proof of income (payslips or employment letter)',
      bankStatements: 'Bank statements (last 3 months)',
      proofOfAddress: 'Proof of current address',
      welfareBenefit: 'Benefits letter (if applicable)',
      medicalEvidence: 'Medical evidence (if applicable)',
      tenancyAgreement: 'Current tenancy agreement (if renting)',
    };

    for (const [key, item] of Object.entries(checklistStatus)) {
      if (item && item.required && item.status === 'missing') {
        missing.push(categoryNames[key] || key);
      }
    }

    return missing;
  }

  /**
   * Get items requiring review
   */
  getItemsNeedingReview(checklistStatus: DocumentChecklistStatus): { category: string; issues: string[] }[] {
    const needsReview: { category: string; issues: string[] }[] = [];

    for (const [key, item] of Object.entries(checklistStatus)) {
      if (item && (item.status === 'issues' || item.status === 'pending') && item.issues) {
        needsReview.push({
          category: key,
          issues: item.issues,
        });
      }
    }

    return needsReview;
  }

  /**
   * Group documents by their category
   */
  private groupDocumentsByCategory(documents: Document[]): Record<DocumentCategory, Document[]> {
    const groups: Record<string, Document[]> = {};

    for (const doc of documents) {
      if (!groups[doc.category]) {
        groups[doc.category] = [];
      }
      groups[doc.category].push(doc);
    }

    return groups as Record<DocumentCategory, Document[]>;
  }

  /**
   * Evaluate identity documents
   */
  private evaluateIdentityDocuments(documents: Document[]): ChecklistItem {
    const req = this.requirements.identity;

    if (documents.length === 0) {
      return {
        required: req.required,
        status: 'missing',
        documentIds: [],
        issues: ['No identity document uploaded'],
      };
    }

    const issues: string[] = [];
    const validDocs: Document[] = [];

    for (const doc of documents) {
      // Check processing status
      if (doc.processingStatus === 'error' || doc.processingStatus === 'validation_failed') {
        issues.push(`${doc.originalFileName}: Processing failed`);
        continue;
      }

      // Check confidence
      if (doc.classificationConfidence < 0.7) {
        issues.push(`${doc.originalFileName}: Low classification confidence`);
      }

      // Check expiry if required
      if (req.validityCheck && doc.extractedData?.fields?.expiryDate) {
        const expiryValue = doc.extractedData.fields.expiryDate.value;
        if (expiryValue && typeof expiryValue === 'string') {
          const expiryDate = new Date(expiryValue);
          if (expiryDate < new Date()) {
            issues.push(`${doc.originalFileName}: Document has expired`);
            continue;
          }
        }
      }

      // Check completeness
      if (doc.completenessScore < 70) {
        issues.push(`${doc.originalFileName}: Incomplete data extraction (${doc.completenessScore}%)`);
      }

      validDocs.push(doc);
    }

    if (validDocs.length < req.minDocuments) {
      return {
        required: req.required,
        status: 'issues',
        documentIds: documents.map((d) => d.id),
        issues: issues.length > 0 ? issues : ['Valid identity document required'],
      };
    }

    return {
      required: req.required,
      status: issues.length > 0 ? 'pending' : 'verified',
      documentIds: documents.map((d) => d.id),
      issues: issues.length > 0 ? issues : undefined,
    };
  }

  /**
   * Evaluate income documents
   */
  private evaluateIncomeDocuments(documents: Document[]): ChecklistItem {
    const req = this.requirements.income;

    if (documents.length === 0) {
      return {
        required: req.required,
        status: 'missing',
        documentIds: [],
        issues: ['No income documents uploaded'],
      };
    }

    const issues: string[] = [];

    // Check for minimum number of documents
    if (documents.length < req.minDocuments) {
      issues.push(`Need at least ${req.minDocuments} income document(s)`);
    }

    // Check completeness of each document
    for (const doc of documents) {
      if (doc.completenessScore < 70) {
        issues.push(`${doc.originalFileName}: Missing key income information`);
      }
    }

    // Check for coverage period if multiple payslips
    if (req.minMonthsCoverage && documents.length > 0) {
      // This would need actual date analysis of extracted data
      // For now, just check document count as proxy
      if (documents.length < req.minMonthsCoverage) {
        issues.push(`Recommend ${req.minMonthsCoverage} months of payslips for income verification`);
      }
    }

    return {
      required: req.required,
      status: issues.length > 0 ? 'pending' : 'verified',
      documentIds: documents.map((d) => d.id),
      issues: issues.length > 0 ? issues : undefined,
    };
  }

  /**
   * Evaluate bank statements
   */
  private evaluateBankStatements(documents: Document[]): ChecklistItem {
    const req = this.requirements.bankStatements;

    if (documents.length === 0) {
      return {
        required: req.required,
        status: 'missing',
        documentIds: [],
        issues: [`Bank statements for the last ${req.minMonthsCoverage} months required`],
      };
    }

    const issues: string[] = [];

    // Check for adequate coverage
    // This would need actual date analysis
    if (documents.length < req.minMonthsCoverage) {
      issues.push(`${req.minMonthsCoverage} months of statements recommended, only ${documents.length} provided`);
    }

    // Check completeness
    for (const doc of documents) {
      if (doc.completenessScore < 60) {
        issues.push(`${doc.originalFileName}: Key statement details missing`);
      }
    }

    return {
      required: req.required,
      status: issues.length > 0 ? 'pending' : 'verified',
      documentIds: documents.map((d) => d.id),
      issues: issues.length > 0 ? issues : undefined,
    };
  }

  /**
   * Evaluate proof of address
   */
  private evaluateProofOfAddress(documents: Document[]): ChecklistItem {
    const req = this.requirements.proofOfAddress;

    if (documents.length === 0) {
      return {
        required: req.required,
        status: 'missing',
        documentIds: [],
        issues: ['Proof of current address required (utility bill, council tax, etc.)'],
      };
    }

    const issues: string[] = [];

    // Check document age
    for (const doc of documents) {
      const dateField = doc.extractedData?.fields?.documentDate;
      if (dateField?.value && typeof dateField.value === 'string') {
        const docDate = new Date(dateField.value);
        const maxAge = new Date();
        maxAge.setMonth(maxAge.getMonth() - req.maxAgeMonths);

        if (docDate < maxAge) {
          issues.push(`${doc.originalFileName}: Document is older than ${req.maxAgeMonths} months`);
        }
      }
    }

    return {
      required: req.required,
      status: issues.length > 0 ? 'pending' : 'verified',
      documentIds: documents.map((d) => d.id),
      issues: issues.length > 0 ? issues : undefined,
    };
  }

  /**
   * Evaluate welfare benefit documents
   */
  private evaluateWelfareBenefit(
    documents: Document[],
    applicantData?: ApplicantData
  ): ChecklistItem {
    const req = this.requirements.welfareBenefit;

    // Determine if this should be required based on applicant data
    // This is a placeholder - actual logic would depend on application data
    const isRequired = req.required; // Could be made conditional

    if (documents.length === 0) {
      return {
        required: isRequired,
        status: 'missing',
        documentIds: [],
        issues: isRequired ? ['Benefits documentation required'] : undefined,
      };
    }

    const issues: string[] = [];

    for (const doc of documents) {
      if (doc.completenessScore < 70) {
        issues.push(`${doc.originalFileName}: Missing benefit details`);
      }
    }

    return {
      required: isRequired,
      status: issues.length > 0 ? 'pending' : 'verified',
      documentIds: documents.map((d) => d.id),
      issues: issues.length > 0 ? issues : undefined,
    };
  }

  /**
   * Evaluate medical evidence
   */
  private evaluateMedicalEvidence(
    documents: Document[],
    applicantData?: ApplicantData
  ): ChecklistItem {
    const req = this.requirements.medicalEvidence;

    // Check if any household members require support
    const needsMedicalEvidence =
      applicantData?.householdMembers?.some((m) => m.requiresSupport) || false;

    const isRequired = req.required || needsMedicalEvidence;

    if (documents.length === 0) {
      return {
        required: isRequired,
        status: 'missing',
        documentIds: [],
        issues: isRequired ? ['Medical evidence required for support needs assessment'] : undefined,
      };
    }

    return {
      required: isRequired,
      status: 'verified',
      documentIds: documents.map((d) => d.id),
    };
  }

  /**
   * Evaluate tenancy documents
   */
  private evaluateTenancy(
    documents: Document[],
    applicantData?: ApplicantData
  ): ChecklistItem {
    const req = this.requirements.tenancyAgreement;

    if (documents.length === 0) {
      return {
        required: req.required,
        status: 'missing',
        documentIds: [],
        issues: req.required ? ['Current tenancy agreement required'] : undefined,
      };
    }

    const issues: string[] = [];

    for (const doc of documents) {
      if (doc.completenessScore < 60) {
        issues.push(`${doc.originalFileName}: Missing tenancy details`);
      }
    }

    return {
      required: req.required,
      status: issues.length > 0 ? 'pending' : 'verified',
      documentIds: documents.map((d) => d.id),
      issues: issues.length > 0 ? issues : undefined,
    };
  }
}

export const checklistService = new ChecklistService();
