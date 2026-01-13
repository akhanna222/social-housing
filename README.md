# Careify - Social Housing Application Intelligence Platform

A modern, full-stack application designed to streamline document processing and eligibility assessment for social housing applications. Careify combines intelligent document classification, data extraction, and eligibility checking with a responsive, accessible web interface.

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite 7** for fast development and optimized builds
- **React Router DOM 7** for client-side routing
- **Lucide React** for consistent iconography
- **CSS** with glassmorphism design system

### Backend
- **Node.js** with Express.js and TypeScript
- **SQLite3** with better-sqlite3 driver for local persistence
- **AWS S3** for scalable document storage
- **OpenAI API** for intelligent document classification and extraction
- **Zod** for runtime validation

## Features

### Frontend Components

| Component | Description |
|-----------|-------------|
| `Avatar` | User avatars with initials fallback and group support |
| `Badge` | Status, priority, confidence, and document status badges |
| `Button` | Primary, secondary, ghost variants with loading states |
| `Card` | Glassmorphism cards with header, content, and footer |
| `EmptyState` | Empty, loading, and success state displays |
| `Input` | Text inputs, textareas, and selects with validation |
| `Layout` | Responsive sidebar navigation with notifications |
| `Modal` | Accessible modals with keyboard support |
| `Progress` | Progress bars and multi-step progress indicators |

### Pages

| Page | Description |
|------|-------------|
| `Dashboard` | Overview with stats, recent applications, and quick actions |
| `Applications` | List view with filtering and search |
| `ApplicationDetail` | Detailed view with documents and eligibility status |
| `NewApplication` | Multi-step application creation form |

### Backend Services

| Service | Description |
|---------|-------------|
| `ClassificationService` | AI-powered document type classification using OpenAI Vision |
| `ExtractionService` | Intelligent data extraction from classified documents |
| `ChecklistService` | Document requirements validation and completeness scoring |
| `StorageService` | AWS S3 document storage with versioning support |
| `DocumentService` | Orchestrates upload, processing, and checklist updates |
| `SchemaVersioningService` | Extraction schema management for different document types |

### Supported Document Types

- Identity (passport, driving licence, national ID, birth certificate)
- Income (payslips, P60, employment letters)
- Bank statements
- Welfare benefits (Universal Credit, Housing Benefit, DWP letters)
- Medical documentation
- Tenancy agreements
- Proof of address (utility bills, council tax)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- AWS account (for S3 storage)
- OpenAI API key (for document processing)

### Installation

```bash
# Clone the repository
git clone https://github.com/akhanna222/social-housing.git
cd social-housing

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### Configuration

Create environment files:

**Backend (`backend/.env`):**
```env
NODE_ENV=development
PORT=3001
DATABASE_PATH=./data/careify.db
AWS_REGION=eu-west-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=careify-documents
OPENAI_API_KEY=your-openai-key
```

**Frontend (`.env`):**
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Careify
```

### Development

```bash
# Start frontend (from root directory)
npm run dev

# Start backend (from backend directory)
cd backend
npm run dev
```

### Production Deployment

Use the included deployment script for EC2:

```bash
# Make executable
chmod +x deploy.sh

# Start all services
./deploy.sh start

# Other commands
./deploy.sh stop
./deploy.sh restart
./deploy.sh status
./deploy.sh logs
```

## Project Structure

```
social-housing/
├── src/                          # Frontend source
│   ├── components/               # Reusable UI components
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Input.tsx
│   │   ├── Layout.tsx
│   │   ├── Modal.tsx
│   │   └── Progress.tsx
│   ├── pages/                    # Route pages
│   │   ├── Dashboard.tsx
│   │   ├── Applications.tsx
│   │   ├── ApplicationDetail.tsx
│   │   └── NewApplication.tsx
│   ├── data/                     # Mock data
│   ├── types/                    # TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── backend/                      # Backend source
│   └── src/
│       ├── controllers/          # Request handlers
│       ├── services/             # Business logic
│       ├── database/             # SQLite schema & repositories
│       ├── routes/               # API endpoints
│       ├── middleware/           # Express middleware
│       ├── config/               # Configuration
│       └── types/                # Backend types
├── deploy.sh                     # EC2 deployment script
├── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/applications` | Create new application |
| `GET` | `/api/applications/:id` | Get application details |
| `GET` | `/api/applications/:id/documents` | List application documents |
| `POST` | `/api/applications/:id/documents` | Upload document |
| `GET` | `/api/documents/:id` | Get document details |
| `POST` | `/api/documents/:id/reprocess` | Reprocess document |
| `DELETE` | `/api/documents/:id` | Delete document |
| `GET` | `/api/health` | Health check endpoint |

## Future Focus

### Phase 1: Core Enhancements

- **Authentication & Authorization**
  - Implement JWT-based authentication with refresh tokens
  - Role-based access control (RBAC) for housing officers, admins, and managers
  - Multi-factor authentication (MFA) for sensitive operations
  - Session management and audit logging

- **Real-time Features**
  - WebSocket integration for live application status updates
  - Real-time notifications for document processing completion
  - Collaborative document review with presence indicators

- **Testing Infrastructure**
  - Comprehensive unit test suite with Jest
  - Integration tests for API endpoints
  - End-to-end tests with Playwright
  - Continuous integration pipeline

### Phase 2: Intelligence & Analytics

- **Advanced Document Processing**
  - OCR improvements for handwritten documents
  - Multi-language document support
  - Batch document processing queue
  - Document fraud detection algorithms

- **Eligibility Engine Enhancements**
  - Configurable eligibility rules per local authority
  - Historical decision analysis for consistency
  - Appeal workflow management
  - Automated priority scoring based on circumstances

- **Reporting & Analytics Dashboard**
  - Processing time analytics and bottleneck identification
  - Application outcome trends and forecasting
  - Officer workload distribution metrics
  - Compliance reporting for regulatory requirements

### Phase 3: Integration & Scalability

- **External System Integrations**
  - GOV.UK Verify / GOV.UK One Login integration
  - DWP benefits verification API
  - HMRC income verification
  - Land Registry address validation
  - Local authority housing register sync

- **Infrastructure Improvements**
  - Migration to PostgreSQL for production scalability
  - Redis caching layer for frequently accessed data
  - Kubernetes deployment configuration
  - Auto-scaling based on processing queue depth

- **Accessibility & Localization**
  - WCAG 2.2 AA compliance audit and improvements
  - Multi-language UI support (Welsh, Bengali, Urdu, Polish)
  - Screen reader optimization
  - High contrast and reduced motion modes

### Phase 4: Applicant Experience

- **Self-Service Portal**
  - Applicant-facing dashboard for status tracking
  - Secure document upload with progress indication
  - In-app messaging with housing officers
  - Application timeline visualization

- **Mobile Application**
  - React Native mobile app for iOS and Android
  - Camera integration for document capture
  - Push notifications for status updates
  - Offline document queue for poor connectivity

- **Intelligent Assistance**
  - AI-powered application guidance chatbot
  - Smart form auto-fill from uploaded documents
  - Proactive document requirement suggestions
  - Estimated processing time predictions

### Phase 5: Compliance & Governance

- **Data Protection**
  - GDPR compliance tooling and consent management
  - Automated data retention and deletion policies
  - Data subject access request (DSAR) workflow
  - Anonymization for analytics and reporting

- **Audit & Compliance**
  - Complete audit trail with tamper-proof logging
  - Decision explanation reports for appeals
  - Regulatory compliance dashboards
  - Automated compliance checking

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
