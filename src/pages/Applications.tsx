import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowRight,
  FileText,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Select,
  StatusBadge,
  PriorityBadge,
  Avatar,
  ProgressBar,
  EmptyState,
} from '../components';
import { mockApplications } from '../data/mockData';
import './Applications.css';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'awaiting_documents', label: 'Awaiting documents' },
  { value: 'eligible', label: 'Eligible' },
  { value: 'further_review', label: 'Further review needed' },
  { value: 'approved', label: 'Approved' },
];

const priorityOptions = [
  { value: '', label: 'All priorities' },
  { value: 'standard', label: 'Standard' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'emergency', label: 'Emergency' },
];

export const Applications: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredApplications = mockApplications.filter((app) => {
    const matchesSearch =
      searchQuery === '' ||
      app.applicant.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === '' || app.status === statusFilter;
    const matchesPriority = priorityFilter === '' || app.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const activeFiltersCount = [statusFilter, priorityFilter].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setSearchQuery('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="applications-page">
      {/* Header */}
      <div className="applications-page__header">
        <div className="applications-page__title-section">
          <h2 className="applications-page__title">All applications</h2>
          <p className="applications-page__subtitle">
            {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link to="/new-application">
          <Button variant="primary" icon={<FileText size={18} />}>
            New application
          </Button>
        </Link>
      </div>

      {/* Search and filters */}
      <div className="applications-page__filters">
        <div className="applications-page__search">
          <Input
            placeholder="Search by name or reference number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={18} />}
          />
        </div>

        <div className="applications-page__filter-actions">
          <Button
            variant="ghost"
            icon={<Filter size={18} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
            {activeFiltersCount > 0 && (
              <span className="filter-count">{activeFiltersCount}</span>
            )}
            <ChevronDown size={16} className={showFilters ? 'rotated' : ''} />
          </Button>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" onClick={clearFilters} icon={<X size={16} />}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card className="applications-page__filter-panel">
          <div className="filter-panel__grid">
            <Select
              label="Status"
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Select
              label="Priority"
              options={priorityOptions}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            />
          </div>
        </Card>
      )}

      {/* Applications list */}
      {filteredApplications.length > 0 ? (
        <Card padding="none" className="applications-page__list">
          <table className="applications-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Completeness</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div className="applicant-cell">
                      <Avatar
                        name={`${app.applicant.firstName} ${app.applicant.lastName}`}
                        size="sm"
                      />
                      <div className="applicant-cell__info">
                        <span className="applicant-cell__name">
                          {app.applicant.firstName} {app.applicant.lastName}
                        </span>
                        <span className="applicant-cell__household">
                          Household of {app.applicant.householdSize}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="reference-number">{app.referenceNumber}</span>
                  </td>
                  <td>
                    <StatusBadge status={app.status} />
                  </td>
                  <td>
                    <PriorityBadge priority={app.priority} />
                  </td>
                  <td>
                    <div className="completeness-cell">
                      <ProgressBar
                        value={app.completenessScore}
                        showValue={false}
                        size="sm"
                        variant={app.completenessScore === 100 ? 'success' : 'default'}
                      />
                      <span className="completeness-cell__value">{app.completenessScore}%</span>
                    </div>
                  </td>
                  <td>
                    <span className="date-cell">{formatDate(app.updatedAt)}</span>
                  </td>
                  <td>
                    <Link to={`/applications/${app.id}`}>
                      <Button variant="ghost" size="sm" icon={<ArrowRight size={16} />}>
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState
          icon={<FileText size={40} />}
          title="No applications found"
          description="Try adjusting your search or filter criteria to find what you're looking for."
          action={
            <Button variant="ghost" onClick={clearFilters}>
              Clear all filters
            </Button>
          }
        />
      )}
    </div>
  );
};

export default Applications;
