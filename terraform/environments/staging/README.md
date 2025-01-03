# Staging Environment Documentation

## Overview
This document outlines the staging environment setup, which mirrors our production environment with minimal differences.

## Architecture Components

### Infrastructure
- **AWS EKS**: Kubernetes cluster running version 1.27
- **VPC**: Custom VPC (CIDR: 10.0.0.0/16)
- **Node Groups**: t3.medium instances (min: 1, max: 2)

### Microservices
1. **API Service**
   - Port: 3002
   - Dependencies:
     - MongoDB (no auth)
     - Redis (no auth)
     - Kafka
   - External Access: LoadBalancer
   - Environment Variables:
     ```
     PORT: 3002
     KAFKA_BROKER_URL: kafka.default.svc.cluster.local:9092
     KAFKA_CLIENT_ID: api-staging
     KAFKA_TOPIC: user-events-staging
     MONGO_URI: mongodb://mongodb.default.svc.cluster.local:27017/user-events-staging
     REDIS_HOST: redis-master.default.svc.cluster.local
     REDIS_PORT: 6379
     LOKI_HOST: http://loki.default.svc.cluster.local:3100
     ```

2. **Producer Service**
   - Port: 3001
   - Dependencies: Kafka
   - Cron Schedule: Every 3 seconds
   - Environment Variables:
     ```
     KAFKA_BROKER_URL: kafka.default.svc.cluster.local:9092
     KAFKA_CLIENT_ID: producer-staging
     KAFKA_TOPIC: user-events-staging
     LOKI_HOST: http://loki.default.svc.cluster.local:3100
     ```

3. **Consumer Service**
   - Port: 3000
   - Dependencies:
     - MongoDB (no auth)
     - Kafka
   - Environment Variables:
     ```
     KAFKA_BROKER_URL: kafka.default.svc.cluster.local:9092
     KAFKA_CLIENT_ID: consumer-staging
     KAFKA_TOPIC: user-events-staging
     KAFKA_GROUP_ID: consumer-group-staging
     MONGO_URI: mongodb://mongodb.default.svc.cluster.local:27017/user-events-staging
     LOKI_HOST: http://loki.default.svc.cluster.local:3100
     ```

### Infrastructure Services

1. **Kafka**
   - Version: Bitnami Chart 26.6.1
   - Mode: KRaft (No Zookeeper)
   - Topics: user-events-staging
   - Single Node Setup
   - Smaller resource allocation than production

2. **MongoDB**
   - Version: Bitnami Chart 13.9.4
   - Authentication: Disabled
   - Storage: 5Gi GP2
   - Smaller resource allocation than production

3. **Redis**
   - Version: Bitnami Chart 18.6.1
   - Mode: Standalone
   - Authentication: Disabled
   - Storage: 5Gi GP2
   - Smaller resource allocation than production

4. **Monitoring Stack**
   - Prometheus (kube-prometheus-stack)
   - Grafana (External Access)
   - Loki (with Promtail)
   - Exporters enabled for all services

## Deployment Process

### Prerequisites
1. AWS CLI configured with staging credentials
2. kubectl configured for staging cluster
3. Helm v3
4. Access to staging ECR repositories

### Deployment Steps
1. Update kubeconfig:
   ```bash
   aws eks update-kubeconfig --region eu-central-1 --name bilira-eks-cluster-staging
   ```

2. Deploy Infrastructure:
   ```bash
   cd terraform/environments/staging
   terraform init
   terraform apply
   ```

3. Verify Deployment:
   ```bash
   kubectl get pods
   kubectl get svc
   ```

## Testing & Validation

### Integration Tests
```bash
# Run integration test suite
npm run test:integration:staging

# Test Kafka connectivity
kubectl exec -it kafka-0 -- kafka-topics.sh --list --bootstrap-server localhost:9092
```

### Load Testing
```bash
# Run k6 load tests
k6 run load-tests/staging.js
```

### Monitoring
- Grafana Dashboard: http://<grafana-staging-lb>
- Prometheus: http://<prometheus-staging-lb>
- API Endpoint: http://<api-staging-lb>

## Key Differences from Production

1. **Resource Allocation**
   - Smaller node count
   - Lower resource limits
   - Reduced storage sizes

2. **Configuration**
   - Different database names
   - Staging-specific Kafka topics
   - Unique client IDs

3. **Monitoring**
   - Shorter retention periods
   - More verbose logging
   - Additional debug metrics

## Maintenance

### Regular Tasks
1. Clean up test data weekly
2. Rotate logs every 3 days
3. Update staging with latest dev changes

### Debugging
```bash
# Get logs from services
kubectl logs -f deployment/api
kubectl logs -f deployment/producer
kubectl logs -f deployment/consumer

# Check resource usage
kubectl top pods
kubectl top nodes
```

## Best Practices

1. **Testing**
   - Always test changes in staging before production
   - Use realistic test data
   - Run full integration tests

2. **Deployment**
   - Use rolling updates
   - Maintain version parity with production
   - Document all configuration changes

3. **Monitoring**
   - Check metrics after deployments
   - Monitor resource usage
   - Review error logs regularly

## Rollback Procedures

1. **Quick Rollback**
   ```bash
   # Rollback deployment
   kubectl rollout undo deployment/<service-name>
   
   # Verify rollback
   kubectl rollout status deployment/<service-name>
   ```

2. **Full Environment Rollback**
   ```bash
   # Switch to previous terraform workspace
   terraform workspace select previous
   terraform apply
   ```

## Notes
- Staging environment is reset weekly
- Test data is not persistent
- Monitoring alerts are less sensitive
- Auto-scaling is limited compared to production
