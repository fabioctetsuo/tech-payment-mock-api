#!/bin/bash

# Payment Mock Microservice Deployment Script
set -e

echo "🚀 Starting Payment Mock Microservice Deployment..."

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
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi
    
    if ! command -v envsubst &> /dev/null; then
        print_error "envsubst is not installed"
        exit 1
    fi
    
    print_status "All prerequisites are satisfied"
}

# Check if required environment variables are set
check_environment() {
    print_status "Checking environment variables..."
    
    if [ -z "$DOCKER_IMAGE" ]; then
        print_error "DOCKER_IMAGE environment variable is not set"
        print_error "Please set it to your Docker image (e.g., your-username/pagamento-mock:latest)"
        exit 1
    fi
    
    # Set PAYMENT_WEBHOOK_URL if not provided
    if [ -z "$PAYMENT_WEBHOOK_URL" ]; then
        print_status "PAYMENT_WEBHOOK_URL not provided, attempting to get it from LoadBalancer service..."
        
        # Get the external IP from the payment service LoadBalancer
        PAYMENT_EXTERNAL_IP=$(kubectl get svc payment-service-loadbalancer -n payment-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
        
        if [ -n "$PAYMENT_EXTERNAL_IP" ]; then
            PAYMENT_WEBHOOK_URL="http://${PAYMENT_EXTERNAL_IP}:3003/webhooks"
            print_status "✅ Payment Webhook URL retrieved from LoadBalancer: $PAYMENT_WEBHOOK_URL"
            export PAYMENT_WEBHOOK_URL
        else
            print_warning "⚠️  Payment service LoadBalancer external IP not available yet"
            print_warning "The service might still be provisioning. Using internal service URL as fallback."
            PAYMENT_WEBHOOK_URL="http://payment-service-loadbalancer.payment-service.svc.cluster.local:3003/webhooks"
            export PAYMENT_WEBHOOK_URL
        fi
    fi
    
    print_status "Environment variables are set correctly"
}

# Build and push Docker image
build_and_push_image() {
    print_status "Building and pushing Docker image..."
    
    # Build the image
    docker build -t $DOCKER_IMAGE .
    
    # Push the image
    docker push $DOCKER_IMAGE
    
    print_status "Image built and pushed successfully"
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    print_status "Deploying to Kubernetes..."
    
    # Create namespace if it doesn't exist
    kubectl apply -f k8s/namespace.yaml
    
    # Create ConfigMap
    kubectl apply -f k8s/configmap.yaml
    
    # Create or update Secret with PAYMENT_WEBHOOK_URL
    print_status "Creating/updating Secret..."
    kubectl create secret generic pagamento-mock-secret \
        --from-literal=PAYMENT_WEBHOOK_URL="$PAYMENT_WEBHOOK_URL" \
        --namespace=payment-mock-service \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Generate manifests with environment variables
    envsubst < k8s/deployment.yaml.template > k8s/deployment-generated.yaml
    envsubst < k8s/service.yaml.template > k8s/service-generated.yaml
    
    # Apply manifests
    kubectl apply -f k8s/deployment-generated.yaml
    kubectl apply -f k8s/service-generated.yaml
    kubectl apply -f k8s/hpa.yaml
    
    print_status "Kubernetes resources applied successfully"
}

# Wait for deployment to be ready
wait_for_deployment() {
    print_status "Waiting for deployment to be ready..."
    
    kubectl wait --for=condition=available deployment/pagamento-mock -n payment-mock-service --timeout=300s
    
    print_status "Deployment is ready"
}

# Check service health
check_health() {
    print_status "Checking service health..."
    
            # Get the LoadBalancer service URL
        SERVICE_URL=$(kubectl get svc payment-mock-service-loadbalancer -n payment-mock-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
        
        if [ -n "$SERVICE_URL" ]; then
            echo "Service URL: http://$SERVICE_URL:4000"
            
            # Wait a bit for the service to be ready
            sleep 30
            
            # Perform health check
            if curl -f -s "http://$SERVICE_URL:4000/health" > /dev/null; then
            print_status "✅ Service is healthy"
        else
            print_warning "⚠️  Health check failed, but deployment completed"
        fi
    else
        print_warning "⚠️  Service URL not available yet"
    fi
}

# Show service URLs
show_urls() {
    echo ""
    print_status "🎉 Payment Mock Microservice is deployed!"
    echo ""
    echo "Service URLs:"
    echo "  💳 Payment Mock API:    http://[EXTERNAL-IP]:4000"
    echo ""
    echo "Health Check:"
    echo "  Payment Mock API:    http://[EXTERNAL-IP]:4000/health"
    echo "  Swagger Docs:        http://[EXTERNAL-IP]:4000/api"
    echo ""
    echo "To get the external IP:"
    echo "  kubectl get svc payment-mock-service-loadbalancer -n payment-mock-service"
    echo ""
}

# Show logs
show_logs() {
    print_status "Showing service logs..."
    kubectl logs -f deployment/pagamento-mock -n payment-mock-service
}

# Main script logic
case "${1:-deploy}" in
    "deploy")
        check_prerequisites
        check_environment
        build_and_push_image
        deploy_to_kubernetes
        wait_for_deployment
        check_health
        show_urls
        ;;
    "build")
        check_prerequisites
        check_environment
        build_and_push_image
        ;;
    "deploy-k8s")
        check_prerequisites
        deploy_to_kubernetes
        wait_for_deployment
        check_health
        show_urls
        ;;
    "logs")
        show_logs
        ;;
    "health")
        check_health
        ;;
    *)
        echo "Usage: $0 {deploy|build|deploy-k8s|logs|health}"
        echo ""
        echo "Commands:"
        echo "  deploy         - Full deployment (build, push, deploy to K8s)"
        echo "  build          - Build and push Docker image only"
        echo "  deploy-k8s     - Deploy to Kubernetes only (assumes image exists)"
        echo "  logs           - Show service logs"
        echo "  health         - Check service health"
        echo ""
        echo "Environment Variables:"
        echo "  DOCKER_IMAGE   - Docker image to deploy (required)"
        exit 1
        ;;
esac 