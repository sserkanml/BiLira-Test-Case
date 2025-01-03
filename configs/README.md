# Monitoring Configuration Files

## Overview
This directory contains configuration files for Loki and Prometheus monitoring stack used in local development environment.

## Directory Structure
```
configs/
├── prometheus/
│   ├── prometheus.yml       # Main Prometheus configuration
│   └── alert.rules.yml     # Prometheus alerting rules
└── loki/
    └── loki-config.yml     # Loki configuration
```

## Prometheus Configuration

### prometheus.yml
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:3002']

  - job_name: 'producer'
    static_configs:
      - targets: ['producer:3001']

  - job_name: 'consumer'
    static_configs:
      - targets: ['consumer:3000']

  - job_name: 'kafka'
    static_configs:
      - targets: ['kafka-exporter:9308']

  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-exporter:9216']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### alert.rules.yml
```yaml
groups:
  - name: service_alerts
    rules:
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
```

## Loki Configuration

### loki-config.yml
```yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb:
    directory: /tmp/loki/index

  filesystem:
    directory: /tmp/loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
```

## Usage

### Local Development
```bash
# Start Prometheus
docker-compose up prometheus

# Start Loki
docker-compose up loki

# View Prometheus UI
open http://localhost:9090

# View Loki in Grafana
open http://localhost:3000
```

## Metrics and Logs

### Available Metrics
- **API Service**: HTTP requests, response times, errors
- **Producer**: Message production rate, errors
- **Consumer**: Message consumption rate, lag
- **Kafka**: Broker metrics, topic metrics
- **MongoDB**: Operations, connections, latency
- **Redis**: Commands, memory usage, connections

### Log Patterns
```
{container="api"} |= "error"
{container="producer"} |= "kafka"
{container="consumer"} |= "mongodb"
```

## Troubleshooting

### Common Issues

1. **Prometheus Scraping**
   ```bash
   # Check targets
   curl localhost:9090/api/v1/targets

   # Check configuration
   docker-compose exec prometheus promtool check config /etc/prometheus/prometheus.yml
   ```

2. **Loki Issues**
   ```bash
   # Check Loki status
   curl localhost:3100/ready

   # View Loki logs
   docker-compose logs loki
   ```

## Related Documentation
- [Prometheus Configuration](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)
- [Loki Configuration](https://grafana.com/docs/loki/latest/configuration/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
