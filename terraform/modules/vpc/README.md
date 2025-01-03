# VPC Module

## Overview
This module creates an AWS VPC configured for EKS cluster deployment with public and private subnets, NAT Gateways, and required networking components.

## Features
- Public and private subnet configuration
- NAT Gateway for private subnet internet access
- DNS support and hostnames
- Proper tagging for EKS integration
- VPC Flow Logs (optional)
- VPC Endpoints (optional)

## Usage

### Basic Example
```hcl
module "vpc" {
  source = "../../modules/vpc"

  vpc_name     = "eks-vpc"
  vpc_cidr     = "10.0.0.0/16"
  cluster_name = "my-eks-cluster"

  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]

  tags = {
    Environment = "dev"
    Project     = "my-project"
  }
}
```

### Advanced Example with VPC Flow Logs
```hcl
module "vpc" {
  source = "../../modules/vpc"

  vpc_name     = "eks-vpc-prod"
  vpc_cidr     = "172.16.0.0/16"
  cluster_name = "prod-eks-cluster"

  private_subnets = ["172.16.1.0/24", "172.16.2.0/24", "172.16.3.0/24"]
  public_subnets  = ["172.16.4.0/24", "172.16.5.0/24", "172.16.6.0/24"]

  enable_dns_hostnames = true
  enable_dns_support   = true
  enable_nat_gateway   = true
  single_nat_gateway   = false  # High availability setup

  tags = {
    Environment = "production"
    Project     = "main"
  }
}
```

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 1.0 |
| aws | >= 4.0 |

## Providers

| Name | Version |
|------|---------|
| aws | >= 4.0 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| vpc_name | Name of the VPC | `string` | n/a | yes |
| vpc_cidr | CIDR block for VPC | `string` | n/a | yes |
| cluster_name | Name of the EKS cluster | `string` | n/a | yes |
| private_subnets | List of private subnet CIDR blocks | `list(string)` | n/a | yes |
| public_subnets | List of public subnet CIDR blocks | `list(string)` | n/a | yes |
| enable_nat_gateway | Enable NAT Gateway | `bool` | `true` | no |
| single_nat_gateway | Use single NAT Gateway | `bool` | `true` | no |
| enable_dns_hostnames | Enable DNS hostnames | `bool` | `true` | no |
| enable_dns_support | Enable DNS support | `bool` | `true` | no |
| tags | A map of tags to add to all resources | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| vpc_id | The ID of the VPC |
| private_subnet_ids | List of private subnet IDs |
| public_subnet_ids | List of public subnet IDs |
| nat_gateway_ids | List of NAT Gateway IDs |
| private_route_table_ids | List of private route table IDs |
| public_route_table_ids | List of public route table IDs |

## Network Architecture

### Subnet Layout
- Public subnets (with Internet Gateway)
  - NAT Gateways
  - Load Balancers
  - Bastion hosts
- Private subnets
  - EKS worker nodes
  - RDS instances
  - ElastiCache clusters

### Routing
- Public subnets route through Internet Gateway
- Private subnets route through NAT Gateway
- Each AZ has its own routing table

## Best Practices

1. **CIDR Planning**
   - Use appropriate CIDR ranges
   - Plan for future expansion
   - Consider IP address requirements

2. **High Availability**
   - Deploy across multiple AZs
   - Consider multiple NAT Gateways
   - Use proper subnet sizing

3. **Security**
   - Use private subnets for workloads
   - Implement proper NACL rules
   - Enable VPC Flow Logs

4. **Cost Optimization**
   - Use single NAT Gateway in non-prod
   - Right-size subnets
   - Monitor unused resources

## Troubleshooting

### Common Issues

1. **Subnet Issues**
   ```bash
   # Check available IPs
   aws ec2 describe-subnets --subnet-ids <subnet-id> --query 'Subnets[].AvailableIpAddressCount'
   
   # Check route tables
   aws ec2 describe-route-tables --filters Name=vpc-id,Values=<vpc-id>
   ```

2. **NAT Gateway Problems**
   ```bash
   # Check NAT Gateway status
   aws ec2 describe-nat-gateways --filter Name=vpc-id,Values=<vpc-id>
   
   # Check NAT Gateway routes
   aws ec2 describe-route-tables --filters Name=route.nat-gateway-id,Values=<nat-gateway-id>
   ```

3. **DNS Issues**
   ```bash
   # Verify DNS settings
   aws ec2 describe-vpc-attribute --vpc-id <vpc-id> --attribute enableDnsHostnames
   aws ec2 describe-vpc-attribute --vpc-id <vpc-id> --attribute enableDnsSupport
   ```

## Example Configurations

### Production VPC
```hcl
module "vpc_prod" {
  source = "../../modules/vpc"

  vpc_name     = "prod-vpc"
  vpc_cidr     = "10.0.0.0/16"
  cluster_name = "prod-eks"

  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = false  # High availability
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Environment = "production"
    Project     = "main"
    Terraform   = "true"
  }
}
```

## Related Documentation
- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html)
- [EKS VPC Requirements](https://docs.aws.amazon.com/eks/latest/userguide/network_reqs.html)
- [Terraform AWS VPC Module](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest)
