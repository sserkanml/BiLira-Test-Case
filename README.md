# Microservices Application

## Overview
This project consists of multiple microservices running in Docker containers, including API, Producer, Consumer services along with supporting infrastructure like Kafka, MongoDB, Redis, and monitoring stack (Prometheus, Grafana, Loki).

## Architecture

### Services
- **API Service**: REST API service (Port: 3002)
- **Producer Service**: Kafka message producer
- **Consumer Service**: Kafka message consumer
- **MongoDB**: Database service (Port: 27017)
- **Kafka**: Message broker (Ports: 9092, 9093, 9094)
- **Redis**: In-memory cache (Port: 6379)

### Monitoring Stack
- **Prometheus**: Metrics collection (Port: 9090)
- **Grafana**: Visualization (Port: 3005)
- **Loki**: Log aggregation (Port: 3100)

### Exporters
- **MongoDB Exporter**: MongoDB metrics (Port: 9216)
- **Kafka Exporter**: Kafka metrics (Port: 9308)
- **Redis Exporter**: Redis metrics (Port: 9121)

## Prerequisites
- Docker
- Docker Compose
- Git

## Quick Start

1. **Setup Secret Files**
   ```bash
   # Create secrets directory
   mkdir -p secrets

   # Create required secret files
   echo "bilira" > secrets/mongo-init-db-username.txt
   echo "password123" > secrets/mongo-init-db-password.txt
   echo "user-events" > secrets/mongo-init-db-database.txt
   echo "mongodb://bilira:password123@mongo:27017/user-events?authSource=admin" > secrets/mongo-uri.txt
   echo "admin123" > secrets/grafana-admin-password.txt
   ```

2. **Start Services**
   ```bash
   # Start all services
   docker-compose up -d

   # Start specific service
   docker-compose up -d api

   # Start with logs
   docker-compose up
   ```

3. **Check Services**
   ```bash
   # Check running containers
   docker-compose ps

   # Check logs
   docker-compose logs -f api
   ```

## Service Configuration

### Networks
- **mongo-network**: MongoDB related services
- **kafka-network**: Kafka related services
- **prometheus-network**: Monitoring services
- **loki-network**: Logging services
- **redis-network**: Redis related services

### Volumes
- **kafka-data**: Kafka persistence
- **mongo-data**: MongoDB persistence
- **grafana-data**: Grafana persistence
- **loki-data**: Loki persistence
- **redis-data**: Redis persistence

### Environment Variables

#### API Service
```env
MONGO_URI_FILE=/run/secrets/mongo-uri
LOKI_HOST=http://loki:3100
REDIS_HOST=redis:6379
```

#### Consumer Service
```env
KAFKA_BROKER_URL=kafka:9092
KAFKA_CLIENT_ID=consumer
KAFKA_TOPIC=user-events
KAFKA_GROUP_ID=consumer-group
MONGO_URI_FILE=/run/secrets/mongo-uri
LOKI_HOST=http://loki:3100
```

#### Producer Service
```env
KAFKA_BROKER_URL=kafka:9092
KAFKA_CLIENT_ID=producer
KAFKA_TOPIC=user-events
LOKI_HOST=http://loki:3100
```

## Service Dependencies

```mermaid
graph TD
    A[API] --> B[MongoDB]
    A --> C[Redis]
    A --> D[Kafka]
    E[Producer] --> D
    F[Consumer] --> B
    F --> D
    G[Prometheus] --> A
    G --> E
    G --> F
    H[Grafana] --> G
    H --> I[Loki]
    A --> I
    E --> I
    F --> I
```

## Monitoring

### Prometheus
- URL: http://localhost:9090
- Metrics available for all services
- Custom alerts configured

### Grafana
- URL: http://localhost:3005
- Default credentials:
  - Username: admin
  - Password: admin123

### Loki
- URL: http://localhost:3100
- Integrated with Grafana
- Collects logs from all services

## Troubleshooting

### Common Issues

1. **Service Won't Start**
   ```bash
   # Check logs
   docker-compose logs <service-name>

   # Check configuration
   docker-compose config

   # Restart service
   docker-compose restart <service-name>
   ```

2. **Network Issues**
   ```bash
   # List networks
   docker network ls

   # Inspect network
   docker network inspect <network-name>
   ```

3. **Volume Issues**
   ```bash
   # List volumes
   docker volume ls

   # Clean volumes
   docker-compose down -v
   ```

### Health Checks
```bash
# MongoDB
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"

# Kafka
docker-compose exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092

# Redis
docker-compose exec redis redis-cli ping
```

## Maintenance

### Backup
```bash
# Backup MongoDB
docker-compose exec mongo mongodump --out /dump

# Backup Redis
docker-compose exec redis redis-cli save
```

### Cleanup
```bash
# Stop and remove containers
docker-compose down

# Remove volumes
docker-compose down -v

# Remove all unused containers
docker system prune
```

## Related Documentation
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Redis Documentation](https://redis.io/documentation)
