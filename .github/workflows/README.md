# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the Payment Mock API service.

## Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**Jobs:**
1. **Test**: Runs linting, tests, and builds the application
2. **Build and Push**: Builds and pushes Docker image to Docker Hub
3. **Deploy**: Deploys to AWS EKS cluster

**Features:**
- Automatic Docker image building and pushing
- Dynamic PAYMENT_WEBHOOK_URL detection from payment service LoadBalancer
- Kubernetes deployment with health checks
- Automatic secret creation

### 2. Manual Deploy (`manual-deploy.yml`)

**Triggers:**
- Manual workflow dispatch

**Inputs:**
- `docker_image`: Docker image to deploy
- `payment_webhook_url`: Payment webhook URL (optional - auto-detected)
- `environment`: Environment (production/staging)
- `namespace`: Kubernetes namespace
- `replicas`: Number of replicas

**Features:**
- Manual deployment with custom parameters
- Dynamic service URL detection
- Health checks and deployment summary
- Flexible configuration options

### 3. Rollback (`rollback.yml`)

**Triggers:**
- Manual workflow dispatch

**Inputs:**
- `namespace`: Kubernetes namespace
- `revision`: Revision number to rollback to (optional)

**Features:**
- Rollback to previous or specific revision
- Deployment history display
- Health checks after rollback
- Rollback summary

### 4. Scale (`scale.yml`)

**Triggers:**
- Manual workflow dispatch

**Inputs:**
- `namespace`: Kubernetes namespace
- `action`: Scaling action (scale-up/scale-down/set-replicas)
- `replicas`: Number of replicas (for set-replicas action)

**Features:**
- Scale up/down or set specific number of replicas
- Health checks after scaling
- Scaling summary with useful commands

## Required Secrets

Configure these secrets in your GitHub repository:

### AWS Credentials
- `AWS_ACCESS_KEY_ID`: AWS access key with EKS permissions
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_SESSION_TOKEN`: AWS session token (if using temporary credentials)

### Docker Hub
- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_ACCESS_TOKEN`: Your Docker Hub access token

## Usage

### Automatic Deployment

1. Push to `main` branch
2. Workflow automatically:
   - Tests the code
   - Builds and pushes Docker image
   - Deploys to AWS EKS

### Manual Deployment

1. Go to Actions tab in GitHub
2. Select "Manual Deploy to AWS"
3. Fill in the required parameters
4. Click "Run workflow"

### Rollback

1. Go to Actions tab in GitHub
2. Select "Rollback Deployment"
3. Choose namespace and revision (optional)
4. Click "Run workflow"

### Scaling

1. Go to Actions tab in GitHub
2. Select "Scale Deployment"
3. Choose action and parameters
4. Click "Run workflow"

## Service URLs

After deployment, the service will be available at:
- **Health Check**: `http://[EXTERNAL-IP]:4000/health`
- **API Documentation**: `http://[EXTERNAL-IP]:4000/api`
- **Swagger UI**: `http://[EXTERNAL-IP]:4000/api`

## Troubleshooting

### Common Issues

1. **Deployment fails**: Check AWS credentials and EKS cluster access
2. **Image not found**: Verify Docker Hub credentials and image exists
3. **Service not accessible**: Check LoadBalancer provisioning
4. **Health check fails**: Check application logs and configuration

### Useful Commands

```bash
# Check deployment status
kubectl get pods -n payment-mock-service

# View logs
kubectl logs -f deployment/pagamento-mock -n payment-mock-service

# Check service
kubectl get svc -n payment-mock-service

# Check deployment history
kubectl rollout history deployment/pagamento-mock -n payment-mock-service
```

## Configuration

### Environment Variables

The workflows automatically handle:
- `PAYMENT_WEBHOOK_URL`: Retrieved from payment service LoadBalancer
- `DOCKER_IMAGE`: Set from GitHub repository
- `SERVICE_PORT`: Set to 4000
- `NAMESPACE`: Set to payment-mock-service

### Load Balancer Integration

The workflows automatically:
1. Detect payment service LoadBalancer URL
2. Create secrets with webhook URLs
3. Configure service communication
4. Handle fallback URLs if LoadBalancer is not ready 