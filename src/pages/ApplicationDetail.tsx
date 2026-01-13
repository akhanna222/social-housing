import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
  Eye,
  Edit3,
  MessageSquare,
  History,
  Sparkles,
  Download,
  MoreVertical,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  StatusBadge,
  PriorityBadge,
  DocumentStatusBadge,
  ConfidenceBadge,
  Badge,
  Avatar,
  ProgressBar,
  Textarea,
  Modal,
  ModalFooter,
} from '../components';
import { getApplicationById } from '../data/mockData';
import './ApplicationDetail.css';

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'eligibility' | 'audit'>('overview');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState('');

  const application = getApplicationById(id || '');

  if (!application) {
    return (
      <div className="application-detail__not-found">
        <Card>
          <CardContent>
            <div className="not-found-content">
              <AlertCircle size={48} />
              <h2>Application not found</h2>
              <p>The application you're looking for doesn't exist or has been removed.</p>
              <Link to="/applications">
                <Button variant="primary">Back to applications</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      id: 'Identity document',
      payslip: 'Payslip',
      bank_statement: 'Bank statement',
      welfare_letter: 'Welfare letter',
      medical_letter: 'Medical letter',
      support_letter: 'Support letter',
      proof_of_address: 'Proof of address',
      tenancy_agreement: 'Tenancy agreement',
      other: 'Other document',
    };
    return labels[type] || type;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText, count: application.documents.length },
    { id: 'eligibility', label: 'Eligibility', icon: CheckCircle },
    { id: 'audit', label: 'Audit log', icon: History },
  ];

  return (
    <div className="application-detail">
      {/* Back navigation */}
      <Link to="/applications" className="application-detail__back">
        <ArrowLeft size={18} />
        <span>Back to applications</span>
      </Link>

      {/* Header */}
      <div className="application-detail__header">
        <div className="application-detail__header-main">
          <Avatar
            name={`${application.applicant.firstName} ${application.applicant.lastName}`}
            size="xl"
          />
          <div className="application-detail__header-info">
            <h1 className="application-detail__title">
              {application.applicant.firstName} {application.applicant.lastName}
            </h1>
            <div className="application-detail__meta">
              <span className="application-detail__ref">{application.referenceNumber}</span>
              <StatusBadge status={application.status} />
              <PriorityBadge priority={application.priority} />
            </div>
          </div>
        </div>
        <div className="application-detail__actions">
          <Button variant="ghost" icon={<MessageSquare size={18} />} onClick={() => setShowNoteModal(true)}>
            Add note
          </Button>
          <Button variant="primary" icon={<Edit3 size={18} />}>
            Update status
          </Button>
        </div>
      </div>

      {/* Completeness indicator */}
      <Card className="application-detail__completeness">
        <div className="completeness-header">
          <div className="completeness-info">
            <h3>Application completeness</h3>
            <p>
              {application.completenessScore === 100
                ? 'All essential documents present'
                : 'Some documents may need review'}
            </p>
          </div>
          <span className="completeness-value">{application.completenessScore}%</span>
        </div>
        <ProgressBar
          value={application.completenessScore}
          showValue={false}
          size="lg"
          variant={application.completenessScore === 100 ? 'success' : 'default'}
        />
      </Card>

      {/* Tabs */}
      <div className="application-detail__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`application-detail__tab ${activeTab === tab.id ? 'application-detail__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="application-detail__tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="application-detail__content">
        {activeTab === 'overview' && (
          <div className="tab-overview">
            <div className="overview-grid">
              {/* Applicant details */}
              <Card>
                <CardHeader>
                  <CardTitle subtitle="Personal information">Applicant details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="detail-list">
                    <div className="detail-item">
                      <dt>Full name</dt>
                      <dd>{application.applicant.firstName} {application.applicant.lastName}</dd>
                    </div>
                    <div className="detail-item">
                      <dt>Date of birth</dt>
                      <dd>{formatDate(application.applicant.dateOfBirth)}</dd>
                    </div>
                    <div className="detail-item">
                      <dt>Email</dt>
                      <dd>{application.applicant.email}</dd>
                    </div>
                    <div className="detail-item">
                      <dt>Phone</dt>
                      <dd>{application.applicant.phone}</dd>
                    </div>
                    {application.applicant.nationalInsuranceNumber && (
                      <div className="detail-item">
                        <dt>National Insurance</dt>
                        <dd>{application.applicant.nationalInsuranceNumber}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              {/* Current address */}
              <Card>
                <CardHeader>
                  <CardTitle subtitle="Where the applicant currently lives">Current address</CardTitle>
                </CardHeader>
                <CardContent>
                  <address className="address-block">
                    {application.applicant.currentAddress.line1}<br />
                    {application.applicant.currentAddress.line2 && (
                      <>{application.applicant.currentAddress.line2}<br /></>
                    )}
                    {application.applicant.currentAddress.city}<br />
                    {application.applicant.currentAddress.postcode}
                  </address>
                </CardContent>
              </Card>

              {/* Household members */}
              <Card>
                <CardHeader>
                  <CardTitle subtitle={`${application.applicant.householdSize} people in household`}>
                    Household
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {application.applicant.householdMembers.length > 0 ? (
                    <ul className="household-list">
                      {application.applicant.householdMembers.map((member) => (
                        <li key={member.id} className="household-member">
                          <Avatar name={`${member.firstName} ${member.lastName}`} size="sm" />
                          <div className="household-member__info">
                            <span className="household-member__name">
                              {member.firstName} {member.lastName}
                            </span>
                            <span className="household-member__relation">
                              {member.relationship}
                            </span>
                          </div>
                          {member.requiresSupport && (
                            <Badge variant="info" size="sm">Requires support</Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-members">Single person household</p>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader action={
                  <Button variant="ghost" size="sm" onClick={() => setShowNoteModal(true)}>
                    Add note
                  </Button>
                }>
                  <CardTitle>Case notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {application.notes.length > 0 ? (
                    <ul className="notes-list">
                      {application.notes.map((note) => (
                        <li key={note.id} className="note-item">
                          <div className="note-item__header">
                            <Avatar
                              name={`${note.createdBy.firstName} ${note.createdBy.lastName}`}
                              size="sm"
                            />
                            <div className="note-item__meta">
                              <span className="note-item__author">
                                {note.createdBy.firstName} {note.createdBy.lastName}
                              </span>
                              <span className="note-item__date">
                                {formatDateTime(note.createdAt)}
                              </span>
                            </div>
                          </div>
                          <p className="note-item__content">{note.content}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-notes">No notes yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="tab-documents">
            <div className="documents-header">
              <p className="documents-description">
                Documents uploaded for this application. Review and verify each document.
              </p>
              <Button variant="secondary" icon={<Upload size={18} />}>
                Upload document
              </Button>
            </div>

            {application.documents.length > 0 ? (
              <div className="documents-grid">
                {application.documents.map((doc) => (
                  <Card key={doc.id} className="document-card" padding="none">
                    <div className="document-card__preview">
                      <FileText size={32} />
                    </div>
                    <div className="document-card__content">
                      <div className="document-card__header">
                        <h4 className="document-card__name">{doc.fileName}</h4>
                        <button className="document-card__menu">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                      <p className="document-card__type">{getDocumentTypeLabel(doc.documentType)}</p>
                      <div className="document-card__meta">
                        <DocumentStatusBadge status={doc.status} />
                        {doc.confidence && (
                          <div className="document-card__ai-badge">
                            <Sparkles size={12} />
                            <ConfidenceBadge confidence={doc.confidence} />
                          </div>
                        )}
                      </div>
                      {doc.notes && (
                        <p className="document-card__notes">{doc.notes}</p>
                      )}
                      <div className="document-card__footer">
                        <span className="document-card__date">
                          Uploaded {formatDateTime(doc.uploadedAt)}
                        </span>
                        <div className="document-card__actions">
                          <Button variant="ghost" size="sm" icon={<Eye size={14} />}>
                            View
                          </Button>
                          <Button variant="ghost" size="sm" icon={<Download size={14} />}>
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent>
                  <div className="no-documents">
                    <FileText size={48} />
                    <h3>No documents uploaded yet</h3>
                    <p>Upload documents to continue with the application review.</p>
                    <Button variant="primary" icon={<Upload size={18} />}>
                      Upload documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'eligibility' && (
          <div className="tab-eligibility">
            {application.eligibilityResult ? (
              <>
                {/* Eligibility outcome */}
                <Card className={`eligibility-outcome eligibility-outcome--${application.eligibilityResult.outcome}`}>
                  <div className="eligibility-outcome__icon">
                    {application.eligibilityResult.outcome === 'eligible' ? (
                      <CheckCircle size={32} />
                    ) : application.eligibilityResult.outcome === 'ineligible' ? (
                      <AlertCircle size={32} />
                    ) : (
                      <Clock size={32} />
                    )}
                  </div>
                  <div className="eligibility-outcome__content">
                    <h3 className="eligibility-outcome__title">
                      {application.eligibilityResult.outcome === 'eligible'
                        ? 'Application meets eligibility criteria'
                        : application.eligibilityResult.outcome === 'ineligible'
                        ? 'Application does not meet eligibility criteria'
                        : 'Further review required'}
                    </h3>
                    <p className="eligibility-outcome__subtitle">
                      Assessed on {formatDateTime(application.eligibilityResult.assessedAt)}
                      {application.eligibilityResult.assessedBy === 'system'
                        ? ' by automated assessment'
                        : ` by ${application.eligibilityResult.assessedBy}`}
                    </p>
                  </div>
                  {!application.eligibilityResult.overridden && (
                    <Button variant="ghost" onClick={() => setShowOverrideModal(true)}>
                      Record officer decision
                    </Button>
                  )}
                </Card>

                {/* Eligibility rules */}
                <Card>
                  <CardHeader>
                    <CardTitle subtitle="How this assessment was determined">
                      Eligibility assessment details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="eligibility-rules">
                      {application.eligibilityResult.rules.map((rule) => (
                        <li key={rule.id} className={`eligibility-rule ${rule.passed ? 'eligibility-rule--passed' : 'eligibility-rule--attention'}`}>
                          <div className="eligibility-rule__icon">
                            {rule.passed ? (
                              <CheckCircle size={20} />
                            ) : (
                              <AlertCircle size={20} />
                            )}
                          </div>
                          <div className="eligibility-rule__content">
                            <h4 className="eligibility-rule__name">{rule.name}</h4>
                            <p className="eligibility-rule__reason">{rule.reason}</p>
                            {rule.details && (
                              <p className="eligibility-rule__details">{rule.details}</p>
                            )}
                          </div>
                          <Badge variant={rule.passed ? 'success' : 'warning'} size="sm">
                            {rule.passed ? 'Verified' : 'Needs review'}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Override info if exists */}
                {application.eligibilityResult.overridden && (
                  <Card className="override-info">
                    <div className="override-info__header">
                      <Edit3 size={20} />
                      <h4>Officer decision recorded</h4>
                    </div>
                    <p className="override-info__reason">
                      {application.eligibilityResult.overrideReason}
                    </p>
                    <p className="override-info__meta">
                      Decision by {application.eligibilityResult.overriddenBy?.firstName}{' '}
                      {application.eligibilityResult.overriddenBy?.lastName} on{' '}
                      {formatDateTime(application.eligibilityResult.overriddenAt!)}
                    </p>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent>
                  <div className="no-eligibility">
                    <Clock size={48} />
                    <h3>Eligibility assessment pending</h3>
                    <p>
                      The eligibility assessment will be completed once all required documents
                      have been uploaded and verified.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="tab-audit">
            <Card>
              <CardHeader action={
                <Button variant="ghost" size="sm" icon={<Download size={16} />}>
                  Export audit log
                </Button>
              }>
                <CardTitle subtitle="Complete history of all actions taken on this application">
                  Audit log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="audit-log">
                  {application.auditLog.map((entry, index) => (
                    <li key={entry.id} className="audit-entry">
                      <div className="audit-entry__timeline">
                        <div className="audit-entry__dot" />
                        {index < application.auditLog.length - 1 && (
                          <div className="audit-entry__line" />
                        )}
                      </div>
                      <div className="audit-entry__content">
                        <div className="audit-entry__header">
                          <span className="audit-entry__action">{entry.action}</span>
                          <span className="audit-entry__time">
                            {formatDateTime(entry.timestamp)}
                          </span>
                        </div>
                        <p className="audit-entry__details">{entry.details}</p>
                        <span className="audit-entry__actor">By {entry.actor}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Override Modal */}
      <Modal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        title="Record officer decision"
        description="Provide your assessment and rationale for this application."
        size="md"
      >
        <div className="override-modal-content">
          <Textarea
            label="Decision rationale"
            placeholder="Please provide your reasoning for this decision..."
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            hint="This will be recorded in the audit log"
          />
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowOverrideModal(false)}>
            Cancel
          </Button>
          <Button variant="primary">
            Record decision
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Add case note"
        size="md"
      >
        <div className="note-modal-content">
          <Textarea
            label="Note"
            placeholder="Add your note here..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowNoteModal(false)}>
            Cancel
          </Button>
          <Button variant="primary">
            Add note
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ApplicationDetail;
