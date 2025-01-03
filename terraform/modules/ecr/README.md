# ECR Module

## Overview
This module creates Amazon Elastic Container Registry (ECR) repositories with lifecycle policies and repository policies.

## Features
- ECR repository creation
- Image lifecycle policies
- Repository policies
- Image scanning configuration
- Tag immutability settings
- Cross-account access configuration

## Usage

### Basic Example
```hcl
module "ecr" {
  source = "../../modules/ecr"

  repository_name = "my-app"
  
  tags = {
    Environment = "dev"
    Project     = "my-project"
  }
}
```

### Advanced Example with Policies
```hcl
module "ecr" {
  source = "../../modules/ecr"

  repository_name = "production-app"
  
  image_tag_mutability = "IMMUTABLE"
  scan_on_push        = true

  lifecycle_policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 30 days of images"
        selection = {
          tagStatus     = "untagged"
          countType     = "sinceImagePushed"
          countUnit     = "days"
          countNumber   = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })

  repository_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPull"
        Effect = "Allow"
        Principal = {
          AWS = ["arn:aws:iam::111122223333:root"]
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
      }
    ]
  })

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
| repository_name | Name of the ECR repository | `string` | n/a | yes |
| image_tag_mutability | Image tag mutability setting | `string` | `"MUTABLE"` | no |
| scan_on_push | Enable image scanning on push | `bool` | `true` | no |
| lifecycle_policy | JSON formatted lifecycle policy | `string` | `null` | no |
| repository_policy | JSON formatted repository policy | `string` | `null` | no |
| tags | A map of tags to add to all resources | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| repository_url | URL of the repository |
| repository_arn | ARN of the repository |
| repository_name | Name of the repository |
| registry_id | The registry ID where the repository was created |

## Repository Management

### Image Lifecycle
- Automated cleanup of old images
- Tag retention rules
- Untagged image expiration

### Security
- Image scanning
- Tag immutability
- Access policies
- Cross-account permissions

## Best Practices

1. **Image Management**
   - Use semantic versioning for tags
   - Enable image scanning
   - Implement lifecycle policies
   - Use immutable tags in production

2. **Security**
   - Restrict repository access
   - Enable vulnerability scanning
   - Regular policy reviews
   - Use IAM roles for access

3. **Cost Optimization**
   - Clean up unused images
   - Set appropriate retention periods
   - Monitor storage usage

4. **Operations**
   - Use automated builds
   - Implement CI/CD pipelines
   - Regular security scans

## Troubleshooting

### Common Issues

1. **Authentication Issues**
   ```bash
   # Login to ECR
   aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
   ```

2. **Push/Pull Issues**
   ```bash
   # Check repository policy
   aws ecr get-repository-policy --repository-name <repository-name>
   
   # Check IAM permissions
   aws sts get-caller-identity
   ```

3. **Lifecycle Policy Issues**
   ```bash
   # Check lifecycle policy
   aws ecr get-lifecycle-policy --repository-name <repository-name>
   
   # List images
   aws ecr list-images --repository-name <repository-name>
   ```

## Example Configurations

### Production Repository
```hcl
module "ecr_prod" {
  source = "../../modules/ecr"

  repository_name = "production-service"
  
  image_tag_mutability = "IMMUTABLE"
  scan_on_push        = true

  lifecycle_policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 90 days of images"
        selection = {
          tagStatus     = "any"
          countType     = "sinceImagePushed"
          countUnit     = "days"
          countNumber   = 90
        }
        action = {
          type = "expire"
        }
      }
    ]
  })

  tags = {
    Environment = "production"
    Project     = "main"
    Terraform   = "true"
  }
}
```

## Related Documentation
- [AWS ECR Documentation](https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html)
- [ECR Lifecycle Policies](https://docs.aws.amazon.com/AmazonECR/latest/userguide/LifecyclePolicies.html)
- [ECR Repository Policies](https://docs.aws.amazon.com/AmazonECR/latest/userguide/repository-policies.html)
