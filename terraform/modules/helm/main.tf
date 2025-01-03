

resource "helm_release" "release" {
  name             = var.release_name
  chart           = var.chart
  repository      = var.repository
  version         = var.chart_version
  namespace       = var.namespace
  create_namespace = var.create_namespace

  values = [
    yamlencode(var.values)
  ]
}

data "aws_eks_cluster" "cluster" {
  name = var.cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = var.cluster_name
}