# Payment Mock API Kubernetes Deployment

This directory contains all the Kubernetes manifests and deployment scripts for the Payment Mock API microservice.

## Prerequisites

1. **AWS EKS Cluster**: The infrastructure should be deployed using the `tech-challenge-fiap-infra` repository
2. **kubectl**: Configured to access your EKS cluster
3. **Docker Hub**: Account with access to push images

## Configuration

### Environment Variables

The following environment variables need to be set:

- `DOCKER_IMAGE`: The Docker image to deploy (e.g., `your-username/pagamento-mock:latest`)
- `PAYMENT_WEBHOOK_URL`: (Optional) The payment service webhook URL. If not provided, it will be automatically retrieved from the payment service LoadBalancer.

## Deployment

### Option 1: Using the Deployment Script

```bash
# Set environment variables
export DOCKER_IMAGE="your-username/pagamento-mock:latest"
# PAYMENT_WEBHOOK_URL will be automatically retrieved from the payment service LoadBalancer

# Run deployment
./k8s/deploy.sh
```

### Option 2: Manual Deployment

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create ConfigMap
kubectl apply -f k8s/configmap.yaml

# 3. Create Secret (optional - will be created automatically by deploy.sh)
kubectl create secret generic pagamento-mock-secret \
  --from-literal=PAYMENT_WEBHOOK_URL="http://your-payment-service-url:3003/webhooks" \
  --namespace=payment-mock-service

# 4. Generate manifests with environment variables
envsubst < k8s/deployment.yaml.template > k8s/deployment.yaml
envsubst < k8s/service.yaml.template > k8s/service.yaml

# 5. Apply manifests
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
```

## Monitoring and Troubleshooting

### Check Deployment Status

```bash
# Check pods
kubectl get pods -n payment-mock-service

# Check services
kubectl get services -n payment-mock-service

# Check HPA
kubectl get hpa -n payment-mock-service
```

### View Logs

```bash
# View application logs
kubectl logs -f deployment/pagamento-mock -n payment-mock-service

# View logs for specific pod
kubectl logs -f <pod-name> -n payment-mock-service
```

### Health Checks

```bash
# Check health endpoint via LoadBalancer
kubectl get svc payment-mock-service-loadbalancer -n payment-mock-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
curl http://your-loadbalancer-url:4000/health

# Check service directly
kubectl port-forward service/payment-mock-service 4000:4000 -n payment-mock-service
curl http://localhost:4000/health
```

### Scaling

The application uses Horizontal Pod Autoscaler (HPA) with:
- Minimum replicas: 1
- Maximum replicas: 5
- CPU target: 70%
- Memory target: 80%

```bash
# Check HPA status
kubectl describe hpa pagamento-mock-hpa -n payment-mock-service

# Manual scaling (if needed)
kubectl scale deployment pagamento-mock --replicas=2 -n payment-mock-service
```

## Architecture

### Components

1. **Deployment**: Runs 1 replica of the application
2. **Service**: ClusterIP service exposing port 3004
3. **LoadBalancer Service**: AWS ALB for external access (created by infrastructure)
4. **HPA**: Automatic scaling based on resource usage
5. **ConfigMap**: Non-sensitive configuration

### Network Flow

```
Internet → AWS ALB (LoadBalancer Service) → Service → Pods
```

### Resource Limits

- **CPU**: 100m request, 300m limit
- **Memory**: 128Mi request, 256Mi limit

## Security

- Non-root user in containers
- Proper signal handling
- Resource limits configured

## Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/pagamento-mock -n payment-mock-service

# Check rollout history
kubectl rollout history deployment/pagamento-mock -n payment-mock-service
```

## Cleanup

```bash
# Delete all resources
kubectl delete namespace payment-mock-service

# Or delete individual resources
kubectl delete -f k8s/
```

## Load Balancer Configuration

The infrastructure automatically creates a LoadBalancer service for the payment-mock service:

- **Service Name**: `payment-mock-service-loadbalancer`
- **Namespace**: `payment-mock-service`
- **Port**: `4000`
- **App Selector**: `pagamento-mock`

## PAYMENT_WEBHOOK_URL Configuration

The payment-mock service automatically configures the `PAYMENT_WEBHOOK_URL` environment variable by:

1. **Automatic Detection**: The deployment script automatically retrieves the payment service LoadBalancer URL
2. **Fallback**: If the LoadBalancer is not available, it uses the internal service URL
3. **Manual Override**: You can set `PAYMENT_WEBHOOK_URL` manually if needed

The webhook URL format is: `http://[PAYMENT-SERVICE-IP]:3003/webhooks`

### Access URLs

Once deployed, you can access the service at:
- **Health Check**: `http://[EXTERNAL-IP]:4000/health`
- **API Documentation**: `http://[EXTERNAL-IP]:4000/api`
- **Swagger UI**: `http://[EXTERNAL-IP]:4000/api`

To get the external IP:
```bash
kubectl get svc payment-mock-service-loadbalancer -n payment-mock-service
``` 