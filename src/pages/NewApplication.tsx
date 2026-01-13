import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Home,
  Users,
  FileText,
  Upload,
  Check,
  Plus,
  X,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  StepProgress,
  SuccessState,
} from '../components';
import './NewApplication.css';

interface FormData {
  // Step 1: Applicant details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationalInsuranceNumber: string;
  // Step 2: Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  // Step 3: Household
  householdMembers: {
    firstName: string;
    lastName: string;
    relationship: string;
    dateOfBirth: string;
    requiresSupport: boolean;
  }[];
  // Step 4: Documents
  uploadedFiles: File[];
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  nationalInsuranceNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postcode: '',
  householdMembers: [],
  uploadedFiles: [],
};

const relationshipOptions = [
  { value: 'spouse', label: 'Spouse / Partner' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other relative' },
];

export const NewApplication: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const totalSteps = 4;
  const stepLabels = ['Applicant', 'Address', 'Household', 'Documents'];

  const updateFormData = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addHouseholdMember = () => {
    setFormData((prev) => ({
      ...prev,
      householdMembers: [
        ...prev.householdMembers,
        {
          firstName: '',
          lastName: '',
          relationship: '',
          dateOfBirth: '',
          requiresSupport: false,
        },
      ],
    }));
  };

  const updateHouseholdMember = (index: number, field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      householdMembers: prev.householdMembers.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      ),
    }));
  };

  const removeHouseholdMember = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      householdMembers: prev.householdMembers.filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, ...newFiles],
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index),
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <div className="new-application">
        <Card className="new-application__success">
          <SuccessState
            title="Application created successfully"
            message="The application has been saved and is ready for document upload and review."
            action={
              <div className="success-actions">
                <Button variant="ghost" onClick={() => navigate('/applications')}>
                  View all applications
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setFormData(initialFormData);
                    setCurrentStep(1);
                    setIsComplete(false);
                  }}
                >
                  Create another application
                </Button>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="new-application">
      {/* Header */}
      <div className="new-application__header">
        <h1 className="new-application__title">New application</h1>
        <p className="new-application__subtitle">
          Let's start by gathering the applicant's information
        </p>
      </div>

      {/* Progress */}
      <StepProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        labels={stepLabels}
        className="new-application__progress"
      />

      {/* Form */}
      <Card className="new-application__form">
        {currentStep === 1 && (
          <div className="form-step animate-fade-in">
            <CardHeader>
              <CardTitle subtitle="Please enter the applicant's personal details">
                <User size={20} className="step-icon" />
                Applicant details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="form-grid">
                <Input
                  label="First name"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
                <Input
                  label="Last name"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
                <Input
                  label="Email address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="email@example.com"
                />
                <Input
                  label="Phone number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="07700 900000"
                />
                <Input
                  label="Date of birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                />
                <Input
                  label="National Insurance number"
                  value={formData.nationalInsuranceNumber}
                  onChange={(e) => updateFormData('nationalInsuranceNumber', e.target.value)}
                  placeholder="AB123456C"
                  hint="Optional but helps with verification"
                />
              </div>
            </CardContent>
          </div>
        )}

        {currentStep === 2 && (
          <div className="form-step animate-fade-in">
            <CardHeader>
              <CardTitle subtitle="Where the applicant currently lives">
                <Home size={20} className="step-icon" />
                Current address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="form-grid form-grid--single">
                <Input
                  label="Address line 1"
                  value={formData.addressLine1}
                  onChange={(e) => updateFormData('addressLine1', e.target.value)}
                  placeholder="House number and street"
                />
                <Input
                  label="Address line 2"
                  value={formData.addressLine2}
                  onChange={(e) => updateFormData('addressLine2', e.target.value)}
                  placeholder="Flat, apartment, etc. (optional)"
                />
                <div className="form-row">
                  <Input
                    label="City"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="City"
                  />
                  <Input
                    label="Postcode"
                    value={formData.postcode}
                    onChange={(e) => updateFormData('postcode', e.target.value)}
                    placeholder="M1 1AA"
                  />
                </div>
              </div>
            </CardContent>
          </div>
        )}

        {currentStep === 3 && (
          <div className="form-step animate-fade-in">
            <CardHeader>
              <CardTitle subtitle="Add other people who will live in the property">
                <Users size={20} className="step-icon" />
                Household members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="household-section">
                {formData.householdMembers.length === 0 ? (
                  <div className="household-empty">
                    <Users size={40} />
                    <p>No household members added yet</p>
                    <p className="household-empty__hint">
                      If the applicant will be living alone, you can skip this step
                    </p>
                  </div>
                ) : (
                  <div className="household-list">
                    {formData.householdMembers.map((member, index) => (
                      <div key={index} className="household-member-form">
                        <div className="household-member-form__header">
                          <span className="household-member-form__number">
                            Person {index + 2}
                          </span>
                          <button
                            className="household-member-form__remove"
                            onClick={() => removeHouseholdMember(index)}
                            aria-label="Remove household member"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <div className="form-grid">
                          <Input
                            label="First name"
                            value={member.firstName}
                            onChange={(e) =>
                              updateHouseholdMember(index, 'firstName', e.target.value)
                            }
                            placeholder="First name"
                          />
                          <Input
                            label="Last name"
                            value={member.lastName}
                            onChange={(e) =>
                              updateHouseholdMember(index, 'lastName', e.target.value)
                            }
                            placeholder="Last name"
                          />
                          <Select
                            label="Relationship to applicant"
                            options={relationshipOptions}
                            value={member.relationship}
                            onChange={(e) =>
                              updateHouseholdMember(index, 'relationship', e.target.value)
                            }
                            placeholder="Select relationship"
                          />
                          <Input
                            label="Date of birth"
                            type="date"
                            value={member.dateOfBirth}
                            onChange={(e) =>
                              updateHouseholdMember(index, 'dateOfBirth', e.target.value)
                            }
                          />
                        </div>
                        <label className="support-checkbox">
                          <input
                            type="checkbox"
                            checked={member.requiresSupport}
                            onChange={(e) =>
                              updateHouseholdMember(index, 'requiresSupport', e.target.checked)
                            }
                          />
                          <span>This person has additional support needs</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="ghost"
                  icon={<Plus size={18} />}
                  onClick={addHouseholdMember}
                  className="add-member-btn"
                >
                  Add household member
                </Button>
              </div>
            </CardContent>
          </div>
        )}

        {currentStep === 4 && (
          <div className="form-step animate-fade-in">
            <CardHeader>
              <CardTitle subtitle="Upload supporting documents for this application">
                <FileText size={20} className="step-icon" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="documents-section">
                <div className="upload-area">
                  <input
                    type="file"
                    id="file-upload"
                    className="upload-input"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                  />
                  <label htmlFor="file-upload" className="upload-label">
                    <Upload size={32} />
                    <span className="upload-label__title">
                      Drag and drop files here, or click to browse
                    </span>
                    <span className="upload-label__hint">
                      Supports PDF, JPG, and PNG files
                    </span>
                  </label>
                </div>

                {formData.uploadedFiles.length > 0 && (
                  <div className="uploaded-files">
                    <h4>Uploaded files</h4>
                    <ul className="files-list">
                      {formData.uploadedFiles.map((file, index) => (
                        <li key={index} className="file-item">
                          <FileText size={18} />
                          <span className="file-item__name">{file.name}</span>
                          <span className="file-item__size">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                          <button
                            className="file-item__remove"
                            onClick={() => removeFile(index)}
                            aria-label="Remove file"
                          >
                            <X size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="documents-info">
                  <h4>Recommended documents</h4>
                  <ul className="documents-checklist">
                    <li>
                      <Check size={16} />
                      <span>Proof of identity (passport, driving licence)</span>
                    </li>
                    <li>
                      <Check size={16} />
                      <span>Proof of income (payslips, benefits letter)</span>
                    </li>
                    <li>
                      <Check size={16} />
                      <span>Bank statements (last 3 months)</span>
                    </li>
                    <li>
                      <Check size={16} />
                      <span>Current tenancy agreement</span>
                    </li>
                  </ul>
                  <p className="documents-note">
                    Documents can also be uploaded later after the application is created.
                  </p>
                </div>
              </div>
            </CardContent>
          </div>
        )}

        {/* Navigation */}
        <div className="form-navigation">
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1}>
            <ArrowLeft size={18} />
            Back
          </Button>

          <div className="form-navigation__right">
            {currentStep < totalSteps ? (
              <Button variant="primary" onClick={handleNext}>
                Continue
                <ArrowRight size={18} />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={isSubmitting}
              >
                Create application
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NewApplication;
