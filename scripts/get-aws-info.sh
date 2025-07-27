#!/bin/bash

# Script to get AWS infrastructure information for MongoDB Atlas configuration

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 AWS Infrastructure Information for MongoDB Atlas${NC}"
echo "=================================================="
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${YELLOW}⚠️  AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Get EKS cluster information
echo -e "${GREEN}📦 EKS Cluster Information:${NC}"
CLUSTER_NAME="tech_challenge_cluster"
REGION="us-east-1"

echo "Cluster Name: $CLUSTER_NAME"
echo "Region: $REGION"

# Get cluster VPC information
echo ""
echo -e "${GREEN}🌐 VPC Information:${NC}"
VPC_ID=$(aws eks describe-cluster --name $CLUSTER_NAME --region $REGION --query 'cluster.resourcesVpcConfig.vpcId' --output text 2>/dev/null || echo "Not found")

if [ "$VPC_ID" != "Not found" ]; then
    echo "VPC ID: $VPC_ID"
    
    # Get VPC CIDR
    VPC_CIDR=$(aws ec2 describe-vpcs --vpc-ids $VPC_ID --query 'Vpcs[0].CidrBlock' --output text 2>/dev/null || echo "Not found")
    echo "VPC CIDR: $VPC_CIDR"
    
    # Get subnets
    echo ""
    echo -e "${GREEN}📡 Subnet Information:${NC}"
    aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[*].[SubnetId,CidrBlock,AvailabilityZone,MapPublicIpOnLaunch]' --output table
else
    echo "Could not retrieve VPC information"
fi

# Get EKS nodes
echo ""
echo -e "${GREEN}🖥️  EKS Node Information:${NC}"
kubectl get nodes -o wide

# Get external IPs
echo ""
echo -e "${GREEN}🌍 External IP Addresses (for MongoDB Atlas):${NC}"
EXTERNAL_IPS=$(kubectl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="ExternalIP")].address}' 2>/dev/null)

if [ -n "$EXTERNAL_IPS" ]; then
    echo "Add these IP addresses to MongoDB Atlas Network Access:"
    echo ""
    for ip in $EXTERNAL_IPS; do
        echo "  $ip/32"
    done
    echo ""
    echo "Or add the entire VPC CIDR: $VPC_CIDR"
else
    echo "Could not retrieve external IP addresses"
fi

# Get security groups
echo ""
echo -e "${GREEN}🔒 Security Group Information:${NC}"
if [ "$VPC_ID" != "Not found" ]; then
    aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[*].[GroupId,GroupName,Description]' --output table
fi

# Get NAT Gateway information
echo ""
echo -e "${GREEN}🌐 NAT Gateway Information:${NC}"
NAT_GATEWAYS=$(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID" --query 'NatGateways[*].[NatGatewayId,State,SubnetId]' --output table 2>/dev/null || echo "No NAT Gateways found")

if [ "$NAT_GATEWAYS" != "No NAT Gateways found" ]; then
    echo "$NAT_GATEWAYS"
else
    echo "No NAT Gateways found in VPC"
fi

# Get route tables
echo ""
echo -e "${GREEN}🛣️  Route Table Information:${NC}"
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[*].[RouteTableId,Associations[0].SubnetId,Routes[0].GatewayId]' --output table

echo ""
echo -e "${GREEN}📋 Summary for MongoDB Atlas Configuration:${NC}"
echo "=================================================="
echo ""
echo "1. Network Access Configuration:"
echo "   Add these IP addresses to MongoDB Atlas:"
for ip in $EXTERNAL_IPS; do
    echo "   - $ip/32"
done
echo ""
echo "   Or add the entire VPC CIDR: $VPC_CIDR"
echo ""
echo "2. Connection String Format:"
echo "   mongodb+srv://username:password@cluster.mongodb.net/payments?retryWrites=true&w=majority"
echo ""
echo "3. GitHub Secret to Set:"
echo "   MONGODB_URI=your-connection-string"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "- Use specific IP addresses for better security"
echo "- Update IP list when EKS nodes change"
echo "- Consider VPC peering for production"
echo "- Test connection from a pod before deployment" 