import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  StatusBadge,
  PriorityBadge,
  Avatar,
  ProgressBar,
} from '../components';
import { dashboardStats, getMyApplications } from '../data/mockData';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const myApplications = getMyApplications();
  const recentApplications = myApplications.slice(0, 5);

  return (
    <div className="dashboard">
      {/* Welcome section */}
      <section className="dashboard__welcome">
        <div className="dashboard__welcome-content">
          <h2 className="dashboard__welcome-title">Welcome back, Sarah</h2>
          <p className="dashboard__welcome-subtitle">
            Here's an overview of your social housing applications
          </p>
        </div>
        <Link to="/new-application">
          <Button variant="primary" icon={<FileText size={18} />}>
            Start new application
          </Button>
        </Link>
      </section>

      {/* Stats cards */}
      <section className="dashboard__stats">
        <Card className="dashboard__stat-card">
          <div className="stat-card__icon stat-card__icon--primary">
            <FileText size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{dashboardStats.totalApplications}</span>
            <span className="stat-card__label">Total applications</span>
          </div>
        </Card>

        <Card className="dashboard__stat-card">
          <div className="stat-card__icon stat-card__icon--warning">
            <Clock size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{dashboardStats.pendingReview}</span>
            <span className="stat-card__label">Pending review</span>
          </div>
        </Card>

        <Card className="dashboard__stat-card">
          <div className="stat-card__icon stat-card__icon--info">
            <AlertCircle size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{dashboardStats.awaitingDocuments}</span>
            <span className="stat-card__label">Awaiting documents</span>
          </div>
        </Card>

        <Card className="dashboard__stat-card">
          <div className="stat-card__icon stat-card__icon--success">
            <CheckCircle size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__value">{dashboardStats.approvedThisMonth}</span>
            <span className="stat-card__label">Approved this month</span>
          </div>
        </Card>
      </section>

      <div className="dashboard__grid">
        {/* My applications */}
        <Card className="dashboard__applications" padding="none">
          <CardHeader className="dashboard__card-header">
            <CardTitle subtitle="Applications assigned to you">My applications</CardTitle>
            <Link to="/applications" className="dashboard__view-all">
              View all <ArrowRight size={16} />
            </Link>
          </CardHeader>
          <CardContent className="dashboard__applications-list">
            {recentApplications.length > 0 ? (
              <ul className="applications-list">
                {recentApplications.map((app) => (
                  <li key={app.id} className="applications-list__item">
                    <Link to={`/applications/${app.id}`} className="application-row">
                      <div className="application-row__main">
                        <Avatar
                          name={`${app.applicant.firstName} ${app.applicant.lastName}`}
                          size="md"
                        />
                        <div className="application-row__info">
                          <span className="application-row__name">
                            {app.applicant.firstName} {app.applicant.lastName}
                          </span>
                          <span className="application-row__ref">{app.referenceNumber}</span>
                        </div>
                      </div>
                      <div className="application-row__meta">
                        <StatusBadge status={app.status} />
                        <PriorityBadge priority={app.priority} />
                      </div>
                      <div className="application-row__progress">
                        <ProgressBar
                          value={app.completenessScore}
                          showValue={false}
                          size="sm"
                          variant={app.completenessScore === 100 ? 'success' : 'default'}
                        />
                        <span className="application-row__progress-label">
                          {app.completenessScore}% complete
                        </span>
                      </div>
                      <ArrowRight size={18} className="application-row__arrow" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dashboard__empty">
                <p>No applications assigned to you yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity & insights */}
        <div className="dashboard__sidebar">
          {/* Processing time */}
          <Card>
            <CardHeader>
              <CardTitle subtitle="Based on recent applications">Average processing time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="processing-time">
                <div className="processing-time__value">
                  <TrendingUp size={24} className="processing-time__icon" />
                  <span className="processing-time__number">
                    {dashboardStats.averageProcessingDays}
                  </span>
                  <span className="processing-time__unit">days</span>
                </div>
                <p className="processing-time__note">
                  Applications are being processed efficiently
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="quick-actions">
                <Link to="/new-application">
                  <Button variant="ghost" fullWidth icon={<FileText size={18} />}>
                    Start new application
                  </Button>
                </Link>
                <Link to="/applications?status=awaiting_documents">
                  <Button variant="ghost" fullWidth icon={<AlertCircle size={18} />}>
                    View pending documents
                  </Button>
                </Link>
                <Link to="/applications?status=under_review">
                  <Button variant="ghost" fullWidth icon={<Clock size={18} />}>
                    Applications under review
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card>
            <CardHeader>
              <CardTitle subtitle="Scheduled reviews">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="upcoming-list">
                <div className="upcoming-item">
                  <div className="upcoming-item__icon">
                    <Calendar size={18} />
                  </div>
                  <div className="upcoming-item__content">
                    <span className="upcoming-item__title">Team case review</span>
                    <span className="upcoming-item__date">Tomorrow, 10:00 AM</span>
                  </div>
                </div>
                <div className="upcoming-item">
                  <div className="upcoming-item__icon">
                    <Calendar size={18} />
                  </div>
                  <div className="upcoming-item__content">
                    <span className="upcoming-item__title">Monthly audit</span>
                    <span className="upcoming-item__date">15 Jan, 2:00 PM</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
