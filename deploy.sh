#!/bin/bash

# Payment Microservice Deployment Script
set -e

echo "🚀 Starting Payment Microservice Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    print_status "All prerequisites are satisfied"
}

# Build Docker image
build_image() {
    print_status "Building Pagamento Mock Docker image..."
    docker-compose build
    print_status "Image built successfully"
}

# Start services
start_services() {
    print_status "Starting Pagamento Mock microservice..."
    docker-compose up -d
    print_status "Services started successfully"
}


# Check service health
check_health() {
    print_status "Checking service health..."
    
    if curl -f -s "http://localhost:4000/health" > /dev/null; then
        print_status "✅ Payment API is healthy"
    else
        print_error "❌ Payment API is not responding"
    fi
}

# Show service URLs
show_urls() {
    echo ""
    print_status "🎉 Payment Microservice is running!"
    echo ""
    echo "Service URLs:"
    echo "  💳 Payment API:    http://localhost:4000"
    echo ""
    echo "Health Check:"
    echo "  Payment API:    http://localhost:4000/health"
    echo "  Swagger Docs:   http://localhost:4000/api"
    echo ""
}

# Stop services
stop_services() {
    print_status "Stopping Pagamento Mock microservice..."
    docker-compose down
    print_status "Services stopped successfully"
}

# Show logs
show_logs() {
    print_status "Showing service logs..."
    docker-compose logs -f
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        check_prerequisites
        build_image
        start_services
        check_health
        show_urls
        ;;
    "start")
        start_services
        show_urls
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        stop_services
        start_services
        wait_for_mongodb
        show_urls
        ;;
    "logs")
        show_logs
        ;;
    "build")
        check_prerequisites
        build_image
        ;;
    "health")
        check_health
        ;;

    *)
        echo "Usage: $0 {deploy|start|stop|restart|logs|build|health}"
        echo ""
        echo "Commands:"
        echo "  deploy         - Full deployment (build, start, health check)"
        echo "  start          - Start services only"
        echo "  stop           - Stop services"
        echo "  restart        - Restart services"
        echo "  logs           - Show service logs"
        echo "  build          - Build Docker image only"
        echo "  health         - Check service health only"
        exit 1
        ;;
esac 