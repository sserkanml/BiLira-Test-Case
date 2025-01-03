# Development Environment Documentation

## Overview
This document outlines the development environment setup for our microservices architecture running on AWS EKS.

## Architecture Components

### Infrastructure
- **AWS EKS**: Kubernetes cluster running version 1.27
- **VPC**: Custom VPC (CIDR: 10.0.0.0/16)
- **Node Groups**: t3.medium instances (min: 1, max: 4)

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
     KAFKA_CLIENT_ID: api
     KAFKA_TOPIC: user-events
     MONGO_URI: mongodb://mongodb.default.svc.cluster.local:27017/user-events
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
     KAFKA_CLIENT_ID: producer
     KAFKA_TOPIC: user-events
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
     KAFKA_CLIENT_ID: consumer
     KAFKA_TOPIC: user-events
     KAFKA_GROUP_ID: consumer-group
     MONGO_URI: mongodb://mongodb.default.svc.cluster.local:27017/user-events
     LOKI_HOST: http://loki.default.svc.cluster.local:3100
     ```

### Infrastructure Services

1. **Kafka**
   - Version: Bitnami Chart 26.6.1
   - Mode: KRaft (No Zookeeper)
   - Topics: user-events
   - Ports: 9092 (PLAINTEXT), 9093 (CONTROLLER)
   - Single Node Setup

2. **MongoDB**
   - Version: Bitnami Chart 13.9.4
   - Authentication: Disabled
   - Storage: 10Gi GP2
   - Port: 27017

3. **Redis**
   - Version: Bitnami Chart 18.6.1
   - Mode: Standalone
   - Authentication: Disabled
   - Storage: 8Gi GP2
   - Port: 6379

4. **Monitoring Stack**
   - Prometheus (kube-prometheus-stack)
   - Grafana (External Access)
   - Loki (with Promtail)
   - Exporters:
     - Redis Exporter
     - MongoDB Exporter
     - Kafka Exporter

## Local Development

### Prerequisites
1. AWS CLI configured
2. kubectl installed
3. Helm v3
4. Docker Desktop
5. Node.js v20
6. pnpm

### Getting Started
1. Clone the repository:
   ```bash
   git clone https://github.com/sserkanml/your-repo.git
   cd your-repo
   ```

2. Configure AWS CLI:
   ```bash
   aws configure
   ```

3. Connect to EKS:
   ```bash
   aws eks update-kubeconfig --region eu-central-1 --name bilira-eks-cluster
   ```

4. Build and Push Docker Images:
   ```bash
   # Build and push API
   cd api
   docker build -t bilira-api .
   docker tag bilira-api:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/bilira-api:latest
   docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/bilira-api:latest

   # Similar steps for producer and consumer
   ```

### Deployment
1. Apply Infrastructure:
   ```bash
   cd terraform/environments/dev
   terraform init
   terraform plan
   terraform apply -target=aws_ssm_parameter.mongodb_root_password \
               -target=aws_ssm_parameter.mongodb_username \
               -target=aws_ssm_parameter.mongodb_password \
               -target=aws_ssm_parameter.mongodb_database
   terraform apply
   ```

2. Verify Deployment:
   ```bash
   kubectl get pods
   kubectl get svc
   ```

## Monitoring & Debugging

### Access Points
- Grafana: http://<grafana-lb>:80 (admin/admin123)
- Prometheus: http://<prometheus-lb>:9090
- API Endpoint: http://<api-lb>:3002

### Useful Commands
```bash
# View logs
kubectl logs -f deployment/api
kubectl logs -f deployment/producer
kubectl logs -f deployment/consumer

# Port forwarding
kubectl port-forward svc/api 3002:3002
kubectl port-forward svc/prometheus-grafana 8080:80

# Check metrics
kubectl top pods
```

## Common Issues & Solutions

### Kafka Connection Issues
- Check Kafka broker status: `kubectl exec -it kafka-0 -- kafka-topics.sh --list --bootstrap-server localhost:9092`
- Verify correct broker URL in environment variables

### MongoDB Connection Issues
- Verify MongoDB is running: `kubectl get pods | grep mongodb`
- Check MongoDB logs: `kubectl logs -f mongodb-0`

### Redis Connection Issues
- Check Redis master status: `kubectl exec -it redis-master-0 -- redis-cli ping`
- Verify Redis service: `kubectl get svc | grep redis`

## Development Workflow
1. Make code changes locally
2. Build and push Docker images
3. Update Helm values if needed
4. Apply changes with Terraform
5. Verify deployment and test functionality


