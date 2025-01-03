# Helm Module

## Overview
This module manages Helm chart deployments on Kubernetes clusters. It provides a standardized way to deploy applications using Helm charts with Terraform.

## Features
- Helm chart deployment and management
- Support for custom values
- Version control for charts
- Namespace management
- Repository management
- Release lifecycle management

## Usage

### Basic Example
```hcl
module "redis" {
  source = "../../modules/helm"

  cluster_name = module.eks.cluster_name
  namespace    = "default"
  
  repository    = "https://charts.bitnami.com/bitnami"
  chart         = "redis"
  chart_version = "18.6.1"
  release_name  = "redis"

  values = {
    architecture = "standalone"
    auth = {
      enabled = false
    }
    master = {
      persistence = {
        enabled = true
        size    = "8Gi"
      }
    }
  }
}
```

### Example with Custom Repository
```hcl
module "prometheus" {
  source = "../../modules/helm"

  cluster_name = module.eks.cluster_name
  namespace    = "monitoring"
  
  repository    = "https://prometheus-community.github.io/helm-charts"
  chart         = "kube-prometheus-stack"
  chart_version = "48.3.1"
  release_name  = "prometheus"

  values = {
    prometheus = {
      service = {
        type = "LoadBalancer"
      }
    }
    grafana = {
      enabled = true
      service = {
        type = "LoadBalancer"
      }
    }
  }
}
```

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 1.0 |
| helm | >= 2.0 |
| kubernetes | >= 2.0 |

## Providers

| Name | Version |
|------|---------|
| helm | >= 2.0 |
| kubernetes | >= 2.0 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| cluster_name | Name of the EKS cluster | `string` | n/a | yes |
| namespace | Kubernetes namespace | `string` | `"default"` | no |
| repository | Helm chart repository URL | `string` | n/a | yes |
| chart | Helm chart name | `string` | n/a | yes |
| chart_version | Helm chart version | `string` | n/a | yes |
| release_name | Helm release name | `string` | n/a | yes |
| values | Values to pass to the Helm chart | `any` | `{}` | no |
| create_namespace | Whether to create the namespace | `bool` | `false` | no |
| timeout | Timeout for Helm operations | `number` | `300` | no |
| atomic | If true, installation process rolls back changes made in case of failed installation | `bool` | `true` | no |
| cleanup_on_fail | If true, deletes the release on failure | `bool` | `true` | no |
| tags | A map of tags to add to all resources | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| release_name | The name of the Helm release |
| release_status | Status of the Helm release |
| namespace | The namespace of the Helm release |

## Best Practices

1. **Version Control**
   - Always specify chart versions explicitly
   - Use version constraints in production
   - Keep track of chart version updates

2. **Values Management**
   - Use structured values
   - Keep sensitive data in secrets
   - Document all custom values

3. **Namespace Organization**
   - Use separate namespaces for different environments
   - Implement namespace-level resource quotas
   - Apply network policies at namespace level

4. **Release Management**
   - Use meaningful release names
   - Implement proper release lifecycle management
   - Plan for rollbacks

## Troubleshooting

### Common Issues

1. **Chart Installation Failures**
   ```bash
   # Check Helm release status
   helm status <release-name> -n <namespace>
   
   # Check release history
   helm history <release-name> -n <namespace>
   ```

2. **Resource Issues**
   ```bash
   # Check pod status
   kubectl get pods -n <namespace>
   
   # Check pod logs
   kubectl logs -f <pod-name> -n <namespace>
   ```

3. **Value Problems**
   ```bash
   # Check applied values
   helm get values <release-name> -n <namespace>
   
   # Check all values
   helm get all <release-name> -n <namespace>
   ```

## Example Configurations

### Monitoring Stack
```hcl
module "monitoring" {
  source = "../../modules/helm"

  cluster_name = module.eks.cluster_name
  namespace    = "monitoring"
  
  repository    = "https://prometheus-community.github.io/helm-charts"
  chart         = "kube-prometheus-stack"
  chart_version = "48.3.1"
  release_name  = "prometheus"

  values = {
    prometheus = {
      prometheusSpec = {
        retention = "15d"
        resources = {
          requests = {
            memory = "512Mi"
            cpu    = "500m"
          }
        }
      }
    }
    grafana = {
      persistence = {
        enabled = true
        size    = "10Gi"
      }
    }
  }

  create_namespace = true
  timeout         = 600
  atomic          = true

  tags = {
    Environment = "production"
    Service     = "monitoring"
  }
}
```

## Related Documentation
- [Helm Documentation](https://helm.sh/docs/)
- [Terraform Helm Provider](https://registry.terraform.io/providers/hashicorp/helm/latest/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
