#!/bin/bash

# Script to get external service URLs for tech-payment-api
# This script retrieves the MOCK_PAYMENT_SERVICE_URL and ORDER_API_URL from AWS load balancers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "🔍 Retrieving external service URLs for tech-payment-api..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed or not in PATH"
    exit 1
fi

# Check if we can connect to the cluster
print_status "Checking cluster connectivity..."
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster"
    print_error "Please ensure your kubeconfig is properly configured"
    exit 1
fi

print_success "Connected to Kubernetes cluster"

# Get MOCK_PAYMENT_SERVICE_URL from LoadBalancer
print_status "Getting MOCK_PAYMENT_SERVICE_URL..."
MOCK_PAYMENT_EXTERNAL_IP=$(kubectl get svc payment-mock-service-loadbalancer -n payment-mock-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

if [ -n "$MOCK_PAYMENT_EXTERNAL_IP" ]; then
    MOCK_PAYMENT_SERVICE_URL="http://${MOCK_PAYMENT_EXTERNAL_IP}:4000"
    print_success "✅ Mock Payment Service URL: $MOCK_PAYMENT_SERVICE_URL"
else
    print_warning "⚠️  Mock Payment service LoadBalancer external IP not available yet"
    print_warning "The service might still be provisioning. Using internal service URL as fallback."
    MOCK_PAYMENT_SERVICE_URL="http://payment-mock-service-loadbalancer.payment-mock-service.svc.cluster.local:4000"
    print_status "Fallback Mock Payment Service URL: $MOCK_PAYMENT_SERVICE_URL"
fi

# Get ORDER_API_URL from LoadBalancer
print_status "Getting ORDER_API_URL..."
ORDER_EXTERNAL_IP=$(kubectl get svc orders-service-loadbalancer -n orders-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

if [ -n "$ORDER_EXTERNAL_IP" ]; then
    ORDER_API_URL="http://${ORDER_EXTERNAL_IP}:3000"
    print_success "✅ Order API URL: $ORDER_API_URL"
else
    print_warning "⚠️  Order service LoadBalancer external IP not available yet"
    print_warning "The service might still be provisioning. Using internal service URL as fallback."
    ORDER_API_URL="http://orders-service-loadbalancer.orders-service.svc.cluster.local:3000"
    print_status "Fallback Order API URL: $ORDER_API_URL"
fi

echo ""
print_success "🎉 External service URLs retrieved successfully!"
echo ""
echo "Environment variables for tech-payment-api:"
echo "  MOCK_PAYMENT_SERVICE_URL=$MOCK_PAYMENT_SERVICE_URL"
echo "  ORDER_API_URL=$ORDER_API_URL"
echo ""
echo "You can use these URLs in your deployment or set them as environment variables." 