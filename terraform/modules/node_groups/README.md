# EKS Node Groups Module

## Overview
This module manages Amazon EKS node groups, which are groups of EC2 instances that serve as worker nodes in your Kubernetes cluster.

## Features
- Managed Node Groups with auto-scaling capabilities
- Custom instance types support
- Configurable capacity types (ON_DEMAND/SPOT)
- Tagging support
- Custom AMI support
- User-data script configuration

## Usage

### Basic Example
```hcl
module "node_groups" {
  source = "../../modules/node_groups"

  cluster_name = "my-eks-cluster"
  subnet_ids   = ["subnet-1234", "subnet-5678"]

  desired_size = 2
  min_size     = 1
  max_size     = 4

  instance_types = ["t3.medium"]
  
  tags = {
    Environment = "dev"
    Project     = "my-project"
  }
}
```

### Advanced Example with Spot Instances
```hcl
module "node_groups" {
  source = "../../modules/node_groups"

  cluster_name = "my-eks-cluster"
  subnet_ids   = ["subnet-1234", "subnet-5678"]

  desired_size = 3
  min_size     = 1
  max_size     = 5

  instance_types = ["t3.medium", "t3.large"]
  capacity_type  = "SPOT"

  labels = {
    role = "worker"
    type = "spot"
  }

  taints = [
    {
      key    = "dedicated"
      value  = "spot"
      effect = "NO_SCHEDULE"
    }
  ]

  tags = {
    Environment = "prod"
    Project     = "my-project"
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
| cluster_name | Name of the EKS cluster | `string` | n/a | yes |
| subnet_ids | List of subnet IDs for the node group | `list(string)` | n/a | yes |
| desired_size | Desired number of worker nodes | `number` | `2` | no |
| min_size | Minimum number of worker nodes | `number` | `1` | no |
| max_size | Maximum number of worker nodes | `number` | `4` | no |
| instance_types | List of instance types for the node group | `list(string)` | `["t3.medium"]` | no |
| capacity_type | Type of capacity associated with the EKS Node Group. Valid values: ON_DEMAND, SPOT | `string` | `"ON_DEMAND"` | no |
| disk_size | Disk size in GiB for worker nodes | `number` | `20` | no |
| labels | Key-value mapping of Kubernetes labels | `map(string)` | `{}` | no |
| taints | List of Kubernetes taints | `list(map(string))` | `[]` | no |
| tags | A map of tags to add to all resources | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| node_group_arn | ARN of the EKS Node Group |
| node_group_id | ID of the EKS Node Group |
| node_group_status | Status of the EKS Node Group |
| node_group_resources | List of objects containing information about underlying resources |

## Resource Management

### Scaling
The node group will automatically scale between the specified minimum and maximum sizes based on the workload requirements.

### Updates
Node groups support automatic updates and can be configured to perform rolling updates when changes are applied.

### Monitoring
Monitor node group health and performance using:
- CloudWatch metrics
- EKS console
- kubectl commands

## Best Practices

1. **Instance Types**
   - Use a mix of instance types for better availability and cost optimization
   - Consider using Spot instances for non-critical workloads

2. **Scaling**
   - Set appropriate min/max values based on your workload
   - Use separate node groups for different workload types

3. **Labels and Taints**
   - Use labels to identify node groups
   - Use taints to control pod scheduling

4. **Networking**
   - Place nodes in private subnets
   - Ensure sufficient IP addresses in subnets

5. **Security**
   - Use the principle of least privilege for IAM roles
   - Regularly update node AMIs

## Troubleshooting

### Common Issues

1. **Scaling Issues**
   ```bash
   # Check node group status
   aws eks describe-nodegroup --cluster-name <cluster-name> --nodegroup-name <nodegroup-name>
   
   # Check autoscaling group
   aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names <asg-name>
   ```

2. **Node Health**
   ```bash
   # Check node status
   kubectl get nodes
   
   # Get node details
   kubectl describe node <node-name>
   ```

3. **Capacity Issues**
   ```bash
   # Check pod distribution
   kubectl get pods -o wide
   
   # Check resource usage
   kubectl top nodes
   ```

## Example Configurations

### Production Setup
```hcl
module "prod_node_groups" {
  source = "../../modules/node_groups"

  cluster_name = "prod-cluster"
  subnet_ids   = var.private_subnet_ids

  desired_size = 3
  min_size     = 2
  max_size     = 6

  instance_types = ["t3.large", "t3.xlarge"]
  disk_size      = 50

  labels = {
    Environment = "production"
    Type        = "worker"
  }

  tags = {
    Environment = "production"
    Project     = "main"
  }
}
```

## Related Documentation
- [AWS EKS Node Groups](https://docs.aws.amazon.com/eks/latest/userguide/managed-node-groups.html)
- [Kubernetes Node Management](https://kubernetes.io/docs/concepts/architecture/nodes/)
