# EKS Module

## Overview
This module creates an Amazon EKS (Elastic Kubernetes Service) cluster with associated IAM roles, security groups, and add-ons.

## Features
- EKS Cluster creation and management
- IAM roles and policies configuration
- Security group management
- Add-ons management (AWS Load Balancer Controller, CoreDNS, kube-proxy, etc.)
- OIDC provider integration
- Node group support
- Kubernetes service account integration

## Usage

### Basic Example
```hcl
module "eks" {
  source = "../../modules/eks"

  cluster_name    = "my-eks-cluster"
  cluster_version = "1.27"

  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids

  tags = {
    Environment = "dev"
    Project     = "my-project"
  }
}
```

### Advanced Example with Add-ons
```hcl
module "eks" {
  source = "../../modules/eks"

  cluster_name    = "prod-eks-cluster"
  cluster_version = "1.27"

  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids

  enable_irsa    = true
  
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-load-balancer-controller = {
      most_recent = true
    }
  }

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
| kubernetes | >= 2.10 |

## Providers

| Name | Version |
|------|---------|
| aws | >= 4.0 |
| kubernetes | >= 2.10 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| cluster_name | Name of the EKS cluster | `string` | n/a | yes |
| cluster_version | Kubernetes version | `string` | `"1.27"` | no |
| vpc_id | ID of the VPC | `string` | n/a | yes |
| subnet_ids | List of subnet IDs | `list(string)` | n/a | yes |
| enable_irsa | Enable IAM Roles for Service Accounts | `bool` | `true` | no |
| cluster_addons | Map of cluster addon configurations | `map(any)` | `{}` | no |
| tags | A map of tags to add to all resources | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| cluster_arn | ARN of the EKS cluster |
| cluster_endpoint | Endpoint for the EKS cluster |
| cluster_name | Name of the EKS cluster |
| cluster_security_group_id | Security group ID attached to the EKS cluster |
| oidc_provider_arn | ARN of the OIDC Provider |

## Cluster Architecture

### Components
- Control Plane (managed by AWS)
- Worker Nodes (managed via Node Groups)
- Add-ons
  - CoreDNS
  - kube-proxy
  - VPC CNI
  - AWS Load Balancer Controller

### Security
- IAM roles and policies
- Security groups
- OIDC provider for pod IAM roles
- Network policies

## Best Practices

1. **Version Management**
   - Keep cluster version up to date
   - Plan regular upgrades
   - Test upgrades in non-prod first

2. **Security**
   - Enable IRSA for pod-level IAM roles
   - Use private subnets for worker nodes
   - Implement least privilege access
   - Enable control plane logging

3. **High Availability**
   - Deploy across multiple AZs
   - Use managed node groups
   - Configure proper auto-scaling

4. **Monitoring**
   - Enable CloudWatch logging
   - Use Container Insights
   - Implement proper alerting

## Troubleshooting

### Common Issues

1. **Cluster Access**
   ```bash
   # Update kubeconfig
   aws eks update-kubeconfig --name <cluster-name> --region <region>
   
   # Test cluster access
   kubectl get nodes
   ```

2. **Add-on Issues**
   ```bash
   # Check add-on status
   kubectl get pods -n kube-system
   
   # Check add-on logs
   kubectl logs -n kube-system <pod-name>
   ```

3. **Authentication Issues**
   ```bash
   # Verify IAM role
   aws sts get-caller-identity
   
   # Check aws-auth configmap
   kubectl describe configmap aws-auth -n kube-system
   ```

## Example Configurations

### Production Cluster
```hcl
module "eks_prod" {
  source = "../../modules/eks"

  cluster_name    = "prod-cluster"
  cluster_version = "1.27"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  enable_irsa = true

  cluster_addons = {
    coredns = {
      most_recent = true
      configuration_values = jsonencode({
        computeType = "Fargate"
        replicaCount = 2
      })
    }
    vpc-cni = {
      most_recent = true
      configuration_values = jsonencode({
        enableNetworkPolicy = true
      })
    }
    aws-load-balancer-controller = {
      most_recent = true
    }
  }

  tags = {
    Environment = "production"
    Project     = "main"
    Terraform   = "true"
  }
}
```

## Related Documentation
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html)
- [EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [Terraform AWS EKS Module](https://registry.terraform.io/modules/terraform-aws-modules/eks/aws/latest)
