# Production Environment Documentation

## Overview
This document outlines the production environment setup for our microservices architecture running on AWS EKS.

## Architecture Components

### Infrastructure
- **AWS EKS**: Kubernetes cluster running version 1.27
- **VPC**: Custom VPC with private and public subnets
- **Node Groups**: t3.medium instances with autoscaling (min: 1, max: 4)

### Microservices
1. **API Service**
   - Port: 3002
   - Dependencies: MongoDB, Redis, Kafka
   - External Access: Yes (LoadBalancer)
   - Metrics: Prometheus enabled (/metrics)

2. **Producer Service**
   - Port: 3001
   - Dependencies: Kafka
   - Metrics: Prometheus enabled (/metrics)
   - Cron Job: Every 3 seconds

3. **Consumer Service**
   - Port: 3000
   - Dependencies: MongoDB, Kafka
   - Metrics: Prometheus enabled (/metrics)

### Infrastructure Services
1. **Kafka**
   - Version: Latest Bitnami Chart
   - Mode: KRaft (No Zookeeper)
   - Topics: user-events
   - Port: 9092

2. **MongoDB**
   - Version: 13.9.4 Bitnami Chart
   - Authentication: Disabled
   - Persistence: 10Gi GP2 storage

3. **Redis**
   - Version: 18.6.1 Bitnami Chart
   - Mode: Standalone
   - Authentication: Disabled
   - Persistence: 8Gi GP2 storage

4. **Monitoring Stack**
   - Prometheus
   - Grafana (External Access)
   - Loki for logging
   - Exporters:
     - Redis Exporter
     - MongoDB Exporter
     - Kafka Exporter

## Deployment Process

### Prerequisites
1. AWS CLI configured
2. kubectl installed
3. Helm 3.x installed
4. Access to ECR repositories

### Deployment Steps
1. Infrastructure Setup:

```bash
aws eks update-kubeconfig --region eu-central-1 --name bilira-eks-cluster
kubectl get nodes
```

2. Verify Cluster Access:
```bash
kubectl get pods
kubectl get svc
```

## Monitoring

### Metrics
- Prometheus endpoint: http://<prometheus-lb>/
- Grafana dashboard: http://<grafana-lb>/
- Default metrics path: /metrics

### Logging
- Loki for centralized logging
- Log format: JSON
- Retention: 7 days

## Scaling

### Horizontal Pod Autoscaling
- API: 1-5 replicas
- Producer: 1-3 replicas
- Consumer: 1-3 replicas

### Node Autoscaling
- Min nodes: 1
- Max nodes: 4
- Scale based on CPU/Memory

## Backup & Recovery

### MongoDB Backup
- Daily automated backups
- Retention: 7 days
- Stored in S3

### Redis Backup
- RDB snapshots every 6 hours
- Persistence enabled

## Security

### Network Security
- Private subnets for workloads
- Public subnets for load balancers
- Security groups for service isolation

### Access Control
- RBAC enabled
- Service accounts for pods
- AWS IAM integration

## Troubleshooting

### Common Commands
```bash
# Check pod logs
kubectl logs -f <pod-name>

# Check pod details
kubectl describe pod <pod-name>

# Check service endpoints
kubectl get endpoints

# Check metrics
kubectl top pods
kubectl top nodes
```

### Health Checks
- API: /api/health
- Kafka: Check broker status
- MongoDB: Check replica status
- Redis: Check master status

## Maintenance

### Regular Tasks
1. Monitor resource usage
2. Review logs for errors
3. Update security patches
4. Backup verification
5. Performance optimization

### Updates
1. Use rolling updates
2. Test in staging first
3. Maintain version compatibility
4. Document changes

## Contact
- DevOps Team: devops@company.com
- On-call Support: +1-xxx-xxx-xxxx

## Additional Resources
- Internal Wiki
- AWS Documentation
- Kubernetes Documentation
- Monitoring Dashboards
```

This documentation provides a comprehensive overview of the production environment, including architecture, deployment, monitoring, scaling, security, and maintenance procedures.
