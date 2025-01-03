data "aws_eks_cluster" "cluster" {
  name       = module.eks.cluster_name
  depends_on = [module.eks]
}

data "aws_eks_cluster_auth" "cluster" {
  name       = module.eks.cluster_name
  depends_on = [module.eks]
}


provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}

module "vpc" {
  source = "../../modules/vpc"

  vpc_name     = "eks-vpc"
  vpc_cidr     = "10.0.0.0/16"
  cluster_name = local.cluster_name

  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]

  tags = local.tags
}

module "eks" {
  source = "../../modules/eks"

  cluster_name    = local.cluster_name
  cluster_version = "1.27"

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  tags = local.tags
}

module "eks_blueprints_addons" {
  source = "aws-ia/eks-blueprints-addons/aws"

  cluster_name      = local.cluster_name
  cluster_endpoint  = module.eks.cluster_endpoint
  cluster_version   = "1.27"
  oidc_provider_arn = module.eks.oidc_provider_arn

  eks_addons = {
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  depends_on = [module.eks]
}

module "node_groups" {
  source = "../../modules/node_groups"

  cluster_name = module.eks.cluster_name
  subnet_ids   = module.vpc.private_subnet_ids

  desired_size = 2
  min_size     = 1
  max_size     = 4

  instance_types = ["t3.medium"]

  tags = local.tags
}

locals {
  cluster_name = "bilira-eks-cluster"
  tags = {
    Environment = "dev"
    Terraform   = "true"
    Project     = "eks-demo"
  }
}

module "ecr" {
  source = "../../modules/ecr"

  repository_names = [
    "bilira-producer",
    "bilira-consumer",
    "bilira-api",
    "helm-charts-producer"
  ]

  allowed_principals = [
    data.aws_caller_identity.current.account_id
  ]

  image_retention_count = 30
  scan_on_push          = false
  encryption_type       = "AES256"


  tags = local.tags
}

module "mongodb" {
  source       = "../../modules/helm"
  depends_on   = [module.eks]
  cluster_name = module.eks.cluster_name
  namespace    = "default"

  repository    = "https://charts.bitnami.com/bitnami"
  chart         = "mongodb"
  chart_version = "13.9.4"
  release_name  = "mongodb"

  values = {
    auth = {
      enabled = false
    }
    persistence = {
      enabled      = true
      size         = "10Gi"
      storageClass = "gp2"
      annotations = {
        "volume.beta.kubernetes.io/storage-class" = "gp2"
      }
    }
    resources = {
      requests = {
        cpu    = "250m"
        memory = "512Mi"
      }
      limits = {
        cpu    = "500m"
        memory = "1Gi"
      }
    }
  }

  tags = local.tags
}

data "aws_ssm_parameter" "mongodb_root_password" {
  name = "/dev/mongodb/root-password"
}

data "aws_ssm_parameter" "mongodb_username" {
  name = "/dev/mongodb/username"
}

data "aws_ssm_parameter" "mongodb_password" {
  name = "/dev/mongodb/password"
}

data "aws_ssm_parameter" "mongodb_database" {
  name = "/dev/mongodb/database"
}

module "kafka" {
  source     = "../../modules/helm"
  depends_on = [module.eks]

  cluster_name = module.eks.cluster_name
  namespace    = "default"

  repository      = "https://charts.bitnami.com/bitnami"
  chart           = "kafka"
  chart_version   = "26.6.1"
  release_name    = "kafka"
  timeout_seconds = 600

  values = {
    replicaCount = 1
    kraft = {
      enabled = true
    }
    zookeeper = {
      enabled = false
    }
    controller = {
      replicaCount = 1
    }
    listeners = {
      client = {
        name          = "PLAINTEXT"
        protocol      = "PLAINTEXT"
        containerPort = 9092
      }
      controller = {
        name          = "CONTROLLER"
        protocol      = "PLAINTEXT"
        containerPort = 9093
      }
    }
    extraConfig = <<-EOT
      node.id=0
      process.roles=controller,broker
      controller.listener.names=CONTROLLER
      listeners=PLAINTEXT://:9092,CONTROLLER://:9093
      controller.quorum.voters=0@kafka-controller-0.kafka-controller-headless.default.svc.cluster.local:9093
      listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      advertised.listeners=PLAINTEXT://kafka.default.svc.cluster.local:9092
      auto.create.topics.enable=true
      inter.broker.listener.name=PLAINTEXT
      controller.quorum.election.backoff.max.ms=1000
      controller.quorum.election.timeout.ms=1000
      controller.quorum.fetch.timeout.ms=1000
      offsets.topic.replication.factor=1
      transaction.state.log.replication.factor=1
      transaction.state.log.min.isr=1
      group.initial.rebalance.delay.ms=0
      num.partitions=3
    EOT
    persistence = {
      enabled      = true
      size         = "8Gi"
      storageClass = "gp2"
    }
  }

  tags = local.tags
}

module "redis" {
  source     = "../../modules/helm"
  depends_on = [module.eks]

  cluster_name = module.eks.cluster_name
  namespace    = "default"

  repository      = "https://charts.bitnami.com/bitnami"
  chart           = "redis"
  chart_version   = "18.6.1"
  release_name    = "redis"
  timeout_seconds = 600

  values = {
    architecture = "standalone"
    auth = {
      enabled = false
    }
    master = {
      persistence = {
        enabled      = true
        size         = "8Gi"
        storageClass = "gp2"
      }
      resources = {
        requests = {
          memory = "256Mi"
          cpu    = "100m"
        }
        limits = {
          memory = "512Mi"
          cpu    = "250m"
        }
      }
    }
  }

  tags = local.tags
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

module "prometheus" {
  source     = "../../modules/helm"
  depends_on = [module.eks]

  cluster_name = module.eks.cluster_name
  namespace    = "default"

  repository    = "https://prometheus-community.github.io/helm-charts"
  chart         = "kube-prometheus-stack"
  chart_version = "48.3.1"
  release_name  = "prometheus"

  values = {
    prometheus = {
      prometheusSpec = {
        serviceMonitorSelectorNilUsesHelmValues = false
        serviceMonitorSelector = {}
        podMonitorSelector = {}
      }
      service = {
        type = "LoadBalancer"
        annotations = {
          "service.beta.kubernetes.io/aws-load-balancer-scheme" = "internet-facing"
          "service.beta.kubernetes.io/aws-load-balancer-type"   = "nlb"
          "service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled" = "true"
          "service.beta.kubernetes.io/aws-load-balancer-connection-idle-timeout" = "60"
        }
        ports = {
          "http-web" = {
            port = 9090
            targetPort = 9090
            protocol = "TCP"
          }
        }
        externalTrafficPolicy = "Local"
        loadBalancerSourceRanges = ["0.0.0.0/0"]
      }
    }
    grafana = {
      enabled = true
      service = {
        type = "LoadBalancer"
        annotations = {
          "service.beta.kubernetes.io/aws-load-balancer-scheme" = "internet-facing"
          "service.beta.kubernetes.io/aws-load-balancer-type"   = "nlb"
        }
      }
      adminPassword = "admin123"
    }
  }

  tags = local.tags
}

module "redis_exporter" {
  source     = "../../modules/helm"
  depends_on = [module.redis]

  cluster_name = module.eks.cluster_name
  namespace    = "default"

  repository    = "https://prometheus-community.github.io/helm-charts"
  chart         = "prometheus-redis-exporter"
  chart_version = "5.6.0"
  release_name  = "redis-exporter"

  values = {
    redisAddress = "redis://redis-master.default.svc.cluster.local:6379"
    serviceMonitor = {
      enabled = true
      namespace = "default"
      interval = "30s"
      scrapeTimeout = "10s"
      labels = {
        release = "prometheus"
      }
    }
  }

  tags = local.tags
}

module "mongodb_exporter" {
  source     = "../../modules/helm"
  depends_on = [module.mongodb]

  cluster_name = module.eks.cluster_name
  namespace    = "default"

  repository    = "https://prometheus-community.github.io/helm-charts"
  chart         = "prometheus-mongodb-exporter"
  chart_version = "3.4.0"
  release_name  = "mongodb-exporter"

  values = {
    mongodb = {
      uri = "mongodb://mongodb.default.svc.cluster.local:27017/admin"
    }
    serviceMonitor = {
      enabled = true
      namespace = "default"
      interval = "30s"
      scrapeTimeout = "10s"
      additionalLabels = {
        release = "prometheus"
      }
    }
    service = {
      port = 9216
      annotations = {
        "prometheus.io/scrape" = "true"
        "prometheus.io/port"   = "9216"
      }
    }
  }

  tags = local.tags
}

module "kafka_exporter" {
  source     = "../../modules/helm"
  depends_on = [module.kafka]

  cluster_name = module.eks.cluster_name
  namespace    = "default"

  repository    = "https://prometheus-community.github.io/helm-charts"
  chart         = "prometheus-kafka-exporter"
  chart_version = "2.0.0"
  release_name  = "kafka-exporter"

  values = {
    kafkaServer = ["kafka.default.svc.cluster.local:9092"]
    serviceMonitor = {
      enabled = true
      namespace = "default"
      interval = "30s"
      scrapeTimeout = "10s"
      additionalLabels = {
        release = "prometheus"
      }
    }
    service = {
      annotations = {
        "prometheus.io/scrape" = "true"
        "prometheus.io/port"   = "9308"
      }
    }
  }

  tags = local.tags
}

module "loki" {
  source     = "../../modules/helm"
  depends_on = [module.eks]

  cluster_name = module.eks.cluster_name
  namespace    = "default"

  repository    = "https://grafana.github.io/helm-charts"
  chart         = "loki-stack"
  chart_version = "2.9.11"
  release_name  = "loki"

  values = {
    loki = {
      persistence = {
        enabled          = true
        size             = "10Gi"
        storageClassName = "gp2"
      }
    }
    promtail = {
      enabled = true
      config = {
        lokiAddress = "http://loki:3100/loki/api/v1/push"
      }
    }
  }

  tags = local.tags
}

resource "null_resource" "push_producer_image" {
  depends_on = [module.ecr]

  provisioner "local-exec" {
    command = <<-EOT
      AWS_REGION=${data.aws_region.current.name}
      AWS_ACCOUNT_ID=${data.aws_caller_identity.current.id}

      aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

      cd ../../../producer
      docker build -t bilira-producer .

      docker tag bilira-producer:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/bilira-producer:latest
      docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/bilira-producer:latest
    EOT
  }

  triggers = {
    docker_file = filemd5("../../../producer/Dockerfile")
    source_dir  = sha256(join("", [for f in fileset("../../../producer/src", "**"): filemd5("../../../producer/src/${f}")]))
  }
}

module "producer" {
  source = "../../modules/helm"
  depends_on = [ 
    module.kafka, 
    module.loki,
    null_resource.push_producer_image
  ]
  
  cluster_name = module.eks.cluster_name
  namespace    = "default"
  
  repository   = null 
  chart        = "../../../k8s/helm/producer"  
  release_name = "producer"
  chart_version = "1.0.0"
  values = {
    image = {
      repository = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/bilira-producer"
      tag        = "latest"
    }
    metrics = {
      enabled = true
      path = "/metrics"
      port = 3001
    }
    env = {
      KAFKA_BROKER_URL = "kafka.default.svc.cluster.local:9092"
      KAFKA_CLIENT_ID = "producer"
      KAFKA_TOPIC = "user-events"
      LOKI_HOST = "http://loki.default.svc.cluster.local:3100"
    }
  }

  tags = local.tags
}

resource "null_resource" "push_consumer_image" {
  depends_on = [module.ecr]

  provisioner "local-exec" {
    command = <<-EOT
      # Environment variables
      AWS_REGION=${data.aws_region.current.name}
      AWS_ACCOUNT_ID=${data.aws_caller_identity.current.id}

      # ECR login
      aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

      # Build consumer image
      cd ../../../consumer
      docker build -t bilira-consumer .

      # Tag and push
      docker tag bilira-consumer:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/bilira-consumer:latest
      docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/bilira-consumer:latest
    EOT
  }

  triggers = {
    docker_file = filemd5("../../../consumer/Dockerfile")
    source_dir  = sha256(join("", [for f in fileset("../../../consumer/src", "**"): filemd5("../../../consumer/src/${f}")]))
  }
}

module "consumer" {
  source = "../../modules/helm"
  depends_on = [ 
    module.kafka, 
    module.loki, 
    module.mongodb,
    null_resource.push_consumer_image  
  ]
  
  cluster_name = module.eks.cluster_name
  namespace    = "default"
  
  repository   = null
  chart        = "../../../k8s/helm/consumer"
  release_name = "consumer"
  chart_version = "1.0.2"

  values = {
    image = {
      repository = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/bilira-consumer"
      tag        = "latest"
    }
    metrics = {
      enabled = true
      path = "/metrics"
      port = 3000
    }
    env = {
      KAFKA_BROKER_URL = "kafka.default.svc.cluster.local:9092"
      KAFKA_CLIENT_ID = "consumer"
      KAFKA_TOPIC = "user-events"
      KAFKA_GROUP_ID = "consumer-group"
      MONGO_URI = "mongodb://mongodb.default.svc.cluster.local:27017/user-events?authSource=admin"
      LOKI_HOST = "http://loki.default.svc.cluster.local:3100"
    }
  }

  tags = local.tags
}

resource "null_resource" "push_api_image" {
  depends_on = [module.ecr]

  provisioner "local-exec" {
    command = <<-EOT
      AWS_REGION=${data.aws_region.current.name}
      AWS_ACCOUNT_ID=${data.aws_caller_identity.current.id}

      aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

      cd ../../../api
      docker build -t bilira-api .

      docker tag bilira-api:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/bilira-api:latest
      docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/bilira-api:latest
    EOT
  }

  triggers = {
    docker_file = filemd5("../../../api/Dockerfile")
    source_dir  = sha256(join("", [for f in fileset("../../../api/src", "**"): filemd5("../../../api/src/${f}")]))
  }
}

module "api" {
  source = "../../modules/helm"
  depends_on = [ 
    module.kafka, 
    module.mongodb,
    module.redis,
    module.loki,
    null_resource.push_api_image
  ]
  
  cluster_name = module.eks.cluster_name
  namespace    = "default"
  
  repository   = null
  chart        = "../../../k8s/helm/api"
  release_name = "api"
  chart_version = "1.0.1"

  values = {
    image = {
      repository = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/bilira-api"
      tag        = "latest"
    }
    metrics = {
      enabled = true
      path = "/metrics"
      port = 3002
    }
    env = {
      PORT = "3002"
      KAFKA_BROKER_URL = "kafka.default.svc.cluster.local:9092"
      KAFKA_CLIENT_ID = "api"
      KAFKA_TOPIC = "user-events"
      MONGO_URI = "mongodb://mongodb.default.svc.cluster.local:27017/user-events?authSource=admin"
      REDIS_HOST = "redis-master.default.svc.cluster.local"
      REDIS_PORT = "6379"
      LOKI_HOST = "http://loki.default.svc.cluster.local:3100"
    }
  }

  tags = local.tags
}




