#!/bin/bash

#╔══════════════════════════════════════════════════════════════════════════════╗
#║                                                                              ║
#║   ██████╗ █████╗ ██████╗ ███████╗██╗███████╗██╗   ██╗                       ║
#║  ██╔════╝██╔══██╗██╔══██╗██╔════╝██║██╔════╝╚██╗ ██╔╝                       ║
#║  ██║     ███████║██████╔╝█████╗  ██║█████╗   ╚████╔╝                        ║
#║  ██║     ██╔══██║██╔══██╗██╔══╝  ██║██╔══╝    ╚██╔╝                         ║
#║  ╚██████╗██║  ██║██║  ██║███████╗██║██║        ██║                          ║
#║   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝        ╚═╝                          ║
#║                                                                              ║
#║  Social Housing Application Intelligence Platform                           ║
#║  EC2 Deployment Script v1.0                                                 ║
#║                                                                              ║
#╚══════════════════════════════════════════════════════════════════════════════╝

set -e

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Application ports
FRONTEND_PORT=${FRONTEND_PORT:-3000}
BACKEND_PORT=${BACKEND_PORT:-4000}

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR"
BACKEND_DIR="$SCRIPT_DIR/backend"
LOG_DIR="$SCRIPT_DIR/logs"
PID_DIR="$SCRIPT_DIR/pids"

# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

print_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                              ║"
    echo "║   ██████╗ █████╗ ██████╗ ███████╗██╗███████╗██╗   ██╗                       ║"
    echo "║  ██╔════╝██╔══██╗██╔══██╗██╔════╝██║██╔════╝╚██╗ ██╔╝                       ║"
    echo "║  ██║     ███████║██████╔╝█████╗  ██║█████╗   ╚████╔╝                        ║"
    echo "║  ██║     ██╔══██║██╔══██╗██╔══╝  ██║██╔══╝    ╚██╔╝                         ║"
    echo "║  ╚██████╗██║  ██║██║  ██║███████╗██║██║        ██║                          ║"
    echo "║   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝        ╚═╝                          ║"
    echo "║                                                                              ║"
    echo "║  Social Housing Application Intelligence Platform                           ║"
    echo "║  Empowering communities with compassionate technology                       ║"
    echo "║                                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_step() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# ═══════════════════════════════════════════════════════════════════════════════
# CLEANUP FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)

    if [ -n "$pids" ]; then
        log_warning "Killing processes on port $port: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
        log_success "Port $port cleared"
    else
        log_info "Port $port is already free"
    fi
}

cleanup_all_ports() {
    log_step "STEP 1: Cleaning up all application ports"

    # Kill processes on application ports
    kill_port $FRONTEND_PORT
    kill_port $BACKEND_PORT

    # Also clean up common development ports
    kill_port 5173  # Vite default
    kill_port 8080  # Common alternative

    # Kill any existing node processes for this project
    pkill -f "node.*social-housing" 2>/dev/null || true
    pkill -f "vite.*social-housing" 2>/dev/null || true

    log_success "All ports cleaned up successfully"
}

cleanup_old_processes() {
    log_info "Cleaning up old Careify processes..."

    # Read and kill old PIDs
    if [ -f "$PID_DIR/frontend.pid" ]; then
        OLD_PID=$(cat "$PID_DIR/frontend.pid")
        kill -9 $OLD_PID 2>/dev/null || true
        rm -f "$PID_DIR/frontend.pid"
    fi

    if [ -f "$PID_DIR/backend.pid" ]; then
        OLD_PID=$(cat "$PID_DIR/backend.pid")
        kill -9 $OLD_PID 2>/dev/null || true
        rm -f "$PID_DIR/backend.pid"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# ENVIRONMENT SETUP
# ═══════════════════════════════════════════════════════════════════════════════

setup_directories() {
    log_step "STEP 2: Setting up directories"

    mkdir -p "$LOG_DIR"
    mkdir -p "$PID_DIR"
    mkdir -p "$BACKEND_DIR/data"

    log_success "Directories created"
}

check_prerequisites() {
    log_step "STEP 3: Checking prerequisites"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18+ required. Current version: $(node -v)"
        exit 1
    fi
    log_success "Node.js $(node -v) detected"

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    log_success "npm $(npm -v) detected"

    # Check for AWS CLI (optional)
    if command -v aws &> /dev/null; then
        log_success "AWS CLI detected"
    else
        log_warning "AWS CLI not found - S3 features will use mock storage"
    fi
}

setup_environment() {
    log_step "STEP 4: Setting up environment variables"

    # Create backend .env if it doesn't exist
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        log_info "Creating backend .env from template..."

        cat > "$BACKEND_DIR/.env" << 'ENVFILE'
# ═══════════════════════════════════════════════════════════════════════════════
# CAREIFY BACKEND CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Server Configuration
NODE_ENV=production
PORT=4000

# Database Configuration
DATABASE_PATH=./data/careify.db

# AWS S3 Configuration (for document storage)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET_NAME=careify-documents

# OpenAI Configuration (for document processing)
OPENAI_API_KEY=your-openai-api-key

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=http://localhost:3000

# Document Processing
MAX_FILE_SIZE=10485760
ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png,image/webp
ENVFILE

        log_warning "Backend .env created with placeholder values"
        log_warning "Please update AWS and OpenAI credentials before production use"
    else
        log_success "Backend .env already exists"
    fi

    # Create frontend .env if needed
    if [ ! -f "$FRONTEND_DIR/.env" ]; then
        cat > "$FRONTEND_DIR/.env" << 'ENVFILE'
# Careify Frontend Configuration
VITE_API_URL=http://localhost:4000/api
VITE_APP_NAME=Careify
ENVFILE
        log_success "Frontend .env created"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# BUILD FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

install_dependencies() {
    log_step "STEP 5: Installing dependencies"

    # Frontend dependencies
    log_info "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm ci --silent 2>/dev/null || npm install --silent
    log_success "Frontend dependencies installed"

    # Backend dependencies
    log_info "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm ci --silent 2>/dev/null || npm install --silent
    log_success "Backend dependencies installed"
}

build_applications() {
    log_step "STEP 6: Building applications"

    # Build frontend
    log_info "Building frontend..."
    cd "$FRONTEND_DIR"
    npm run build
    log_success "Frontend built successfully"

    # Build backend
    log_info "Building backend..."
    cd "$BACKEND_DIR"
    npm run build
    log_success "Backend built successfully"
}

# ═══════════════════════════════════════════════════════════════════════════════
# RUN FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

start_backend() {
    log_step "STEP 7: Starting backend server"

    cd "$BACKEND_DIR"

    # Start backend in background
    nohup node dist/index.js > "$LOG_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PID_DIR/backend.pid"

    # Wait for backend to be ready
    log_info "Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
            log_success "Backend started on port $BACKEND_PORT (PID: $BACKEND_PID)"
            return 0
        fi
        sleep 1
    done

    log_error "Backend failed to start. Check logs: $LOG_DIR/backend.log"
    exit 1
}

start_frontend() {
    log_step "STEP 8: Starting frontend server"

    cd "$FRONTEND_DIR"

    # For production, use a static file server
    if command -v serve &> /dev/null; then
        nohup serve -s dist -l $FRONTEND_PORT > "$LOG_DIR/frontend.log" 2>&1 &
    else
        # Install serve globally if not present
        npm install -g serve
        nohup serve -s dist -l $FRONTEND_PORT > "$LOG_DIR/frontend.log" 2>&1 &
    fi

    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$PID_DIR/frontend.pid"

    # Wait for frontend to be ready
    log_info "Waiting for frontend to start..."
    for i in {1..30}; do
        if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
            log_success "Frontend started on port $FRONTEND_PORT (PID: $FRONTEND_PID)"
            return 0
        fi
        sleep 1
    done

    log_error "Frontend failed to start. Check logs: $LOG_DIR/frontend.log"
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════════════
# STATUS FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

print_status() {
    log_step "DEPLOYMENT COMPLETE"

    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                              ║"
    echo "║  Careify is now running!                                                     ║"
    echo "║                                                                              ║"
    echo "║  ┌─────────────────────────────────────────────────────────────────────────┐ ║"
    echo "║  │  Frontend:  http://localhost:$FRONTEND_PORT                                    │ ║"
    echo "║  │  Backend:   http://localhost:$BACKEND_PORT                                    │ ║"
    echo "║  │  API Docs:  http://localhost:$BACKEND_PORT/api/health                         │ ║"
    echo "║  └─────────────────────────────────────────────────────────────────────────┘ ║"
    echo "║                                                                              ║"
    echo "║  Logs:                                                                       ║"
    echo "║    Frontend: $LOG_DIR/frontend.log"
    echo "║    Backend:  $LOG_DIR/backend.log"
    echo "║                                                                              ║"
    echo "║  Commands:                                                                   ║"
    echo "║    Stop:    ./deploy.sh stop                                                ║"
    echo "║    Restart: ./deploy.sh restart                                             ║"
    echo "║    Status:  ./deploy.sh status                                              ║"
    echo "║    Logs:    ./deploy.sh logs                                                ║"
    echo "║                                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

show_status() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║  CAREIFY STATUS                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # Check backend
    if [ -f "$PID_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat "$PID_DIR/backend.pid")
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo -e "  Backend:  ${GREEN}Running${NC} (PID: $BACKEND_PID)"
        else
            echo -e "  Backend:  ${RED}Stopped${NC}"
        fi
    else
        echo -e "  Backend:  ${YELLOW}Not started${NC}"
    fi

    # Check frontend
    if [ -f "$PID_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$PID_DIR/frontend.pid")
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo -e "  Frontend: ${GREEN}Running${NC} (PID: $FRONTEND_PID)"
        else
            echo -e "  Frontend: ${RED}Stopped${NC}"
        fi
    else
        echo -e "  Frontend: ${YELLOW}Not started${NC}"
    fi

    echo ""
}

show_logs() {
    echo -e "${CYAN}=== Backend Logs ===${NC}"
    tail -50 "$LOG_DIR/backend.log" 2>/dev/null || echo "No backend logs found"
    echo ""
    echo -e "${CYAN}=== Frontend Logs ===${NC}"
    tail -50 "$LOG_DIR/frontend.log" 2>/dev/null || echo "No frontend logs found"
}

stop_all() {
    log_step "Stopping Careify services"

    cleanup_old_processes
    cleanup_all_ports

    log_success "All services stopped"
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

main() {
    print_banner

    cleanup_old_processes
    cleanup_all_ports
    setup_directories
    check_prerequisites
    setup_environment
    install_dependencies
    build_applications
    start_backend
    start_frontend
    print_status
}

# Handle command line arguments
case "${1:-start}" in
    start)
        main
        ;;
    stop)
        print_banner
        stop_all
        ;;
    restart)
        print_banner
        stop_all
        main
        ;;
    status)
        print_banner
        show_status
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
