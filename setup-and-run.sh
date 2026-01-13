#!/bin/bash

# Social Housing Application - Setup and Run Script
# This script sets up and runs both frontend and backend

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
ENV_FILE="$BACKEND_DIR/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if node and npm are installed with correct versions
check_prerequisites() {
    print_header "Checking Prerequisites"

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    # Check Node.js version (requires 20.19+ or 22.12+)
    NODE_VERSION=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
    NODE_MINOR=$(echo "$NODE_VERSION" | cut -d. -f2)

    if [ "$NODE_MAJOR" -lt 20 ]; then
        print_error "Node.js version $NODE_VERSION is too old."
        echo ""
        echo "Vite requires Node.js 20.19+ or 22.12+"
        echo ""
        echo "To upgrade Node.js, run:"
        echo "  # Using nvm (recommended):"
        echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
        echo "  source ~/.bashrc"
        echo "  nvm install 22"
        echo "  nvm use 22"
        echo ""
        echo "  # Or using NodeSource:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        exit 1
    elif [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 19 ]; then
        print_error "Node.js version $NODE_VERSION is too old."
        echo ""
        echo "Vite requires Node.js 20.19+ or 22.12+"
        echo "Please upgrade to Node.js 20.19+ or 22.x"
        exit 1
    elif [ "$NODE_MAJOR" -eq 21 ]; then
        print_error "Node.js 21.x is not supported."
        echo ""
        echo "Vite requires Node.js 20.19+ or 22.12+"
        echo "Please use Node.js 22.x instead."
        exit 1
    elif [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 12 ]; then
        print_error "Node.js version $NODE_VERSION is too old."
        echo ""
        echo "Vite requires Node.js 22.12+"
        echo "Please upgrade your Node.js 22.x installation."
        exit 1
    fi

    print_success "Node.js found: v$NODE_VERSION"

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    print_success "npm found: $(npm --version)"
}

# Setup environment variables
setup_environment() {
    print_header "Environment Configuration"

    if [ -f "$ENV_FILE" ]; then
        echo -e "Existing .env file found at: ${YELLOW}$ENV_FILE${NC}"
        read -p "Do you want to reconfigure? (y/N): " reconfigure
        if [[ ! "$reconfigure" =~ ^[Yy]$ ]]; then
            print_success "Using existing configuration"
            return
        fi
    fi

    echo -e "\n${YELLOW}OpenAI API Key Configuration${NC}"
    echo "The OpenAI API key is required for document processing with GPT-4 Vision."
    echo "Get your API key from: https://platform.openai.com/api-keys"
    echo ""

    while true; do
        read -sp "Enter your OpenAI API Key: " OPENAI_API_KEY
        echo ""

        if [ -z "$OPENAI_API_KEY" ]; then
            print_warning "API key cannot be empty. Please try again."
        elif [[ ! "$OPENAI_API_KEY" =~ ^sk- ]]; then
            print_warning "API key should start with 'sk-'. Please verify and try again."
            read -p "Continue anyway? (y/N): " continue_anyway
            if [[ "$continue_anyway" =~ ^[Yy]$ ]]; then
                break
            fi
        else
            break
        fi
    done

    echo ""
    echo -e "${YELLOW}AWS S3 Configuration (Optional)${NC}"
    echo "AWS S3 is used for document storage. Skip if you want to use local storage."
    read -p "Configure AWS S3? (y/N): " configure_aws

    AWS_ACCESS_KEY_ID=""
    AWS_SECRET_ACCESS_KEY=""
    AWS_REGION="eu-west-2"
    S3_BUCKET_NAME="careify-documents"

    if [[ "$configure_aws" =~ ^[Yy]$ ]]; then
        read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
        read -sp "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
        echo ""
        read -p "AWS Region [eu-west-2]: " input_region
        AWS_REGION="${input_region:-eu-west-2}"
        read -p "S3 Bucket Name [careify-documents]: " input_bucket
        S3_BUCKET_NAME="${input_bucket:-careify-documents}"
    fi

    # Create .env file
    cat > "$ENV_FILE" << EOF
# Server Configuration
PORT=3001
NODE_ENV=development

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
AWS_REGION=$AWS_REGION
S3_BUCKET_NAME=$S3_BUCKET_NAME

# OpenAI Configuration
OPENAI_API_KEY=$OPENAI_API_KEY

# Database
DATABASE_PATH=./data/careify.db
EOF

    print_success "Environment file created at: $ENV_FILE"
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"

    echo "Installing frontend dependencies..."
    cd "$PROJECT_ROOT"
    npm install
    print_success "Frontend dependencies installed"

    echo ""
    echo "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm install

    # Rebuild native modules (better-sqlite3) for current Node.js version
    echo "Rebuilding native modules for Node.js $(node --version)..."
    npm rebuild better-sqlite3 2>/dev/null || true

    print_success "Backend dependencies installed"
}

# Setup database
setup_database() {
    print_header "Setting Up Database"

    cd "$BACKEND_DIR"

    # Create data directory if it doesn't exist
    mkdir -p data

    echo "Running database migrations..."
    npm run migrate
    print_success "Database migrations completed"

    read -p "Do you want to seed sample data? (y/N): " seed_data
    if [[ "$seed_data" =~ ^[Yy]$ ]]; then
        npm run seed
        print_success "Sample data seeded"
    fi
}

# Start the application
start_application() {
    print_header "Starting Application"

    echo -e "${GREEN}Starting both frontend and backend servers...${NC}"
    echo ""
    echo "Frontend will be available at: http://localhost:5173"
    echo "Backend will be available at:  http://localhost:3001"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
    echo ""

    # Function to cleanup on exit
    cleanup() {
        echo ""
        print_warning "Shutting down servers..."
        kill $BACKEND_PID 2>/dev/null || true
        kill $FRONTEND_PID 2>/dev/null || true
        exit 0
    }

    trap cleanup SIGINT SIGTERM

    # Start backend
    cd "$BACKEND_DIR"
    npm run dev &
    BACKEND_PID=$!
    echo "Backend started (PID: $BACKEND_PID)"

    # Wait a moment for backend to start
    sleep 2

    # Start frontend
    cd "$PROJECT_ROOT"
    npm run dev &
    FRONTEND_PID=$!
    echo "Frontend started (PID: $FRONTEND_PID)"

    echo ""
    print_success "Both servers are now running!"
    echo ""

    # Wait for both processes
    wait
}

# Main execution
main() {
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║          Social Housing Application Setup                 ║"
    echo "║          Careify Document Intelligence System             ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    check_prerequisites
    setup_environment
    install_dependencies
    setup_database
    start_application
}

# Run main function
main
