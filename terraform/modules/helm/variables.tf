variable "cluster_name" {
  type        = string
  description = "Name of the EKS cluster"
}

variable "namespace" {
  type        = string
  description = "Kubernetes namespace to deploy into"
}

variable "create_namespace" {
  type        = bool
  description = "Whether to create the namespace"
  default     = true
}

variable "repository" {
  type        = string
  description = "Helm chart repository URL"
}

variable "chart" {
  type        = string
  description = "Helm chart name"
}

variable "chart_version" {
  type        = string
  description = "Helm chart version"
}

variable "release_name" {
  type        = string
  description = "Helm release name"
}

variable "values" {
  type        = any
  description = "Helm chart values"
  default     = {}
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to resources"
  default     = {}
}

variable "timeout_seconds" {
  description = "Time in seconds to wait for any individual kubernetes operation"
  type        = number
  default     = 300
}