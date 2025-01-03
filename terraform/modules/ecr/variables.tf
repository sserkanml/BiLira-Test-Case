variable "repository_names" {
  description = "Names of the ECR repositories to create"
  type        = list(string)
}

variable "image_tag_mutability" {
  description = "Image tag mutability setting. Must be one of: MUTABLE or IMMUTABLE"
  type        = string
  default     = "MUTABLE"
}

variable "scan_on_push" {
  description = "Indicates whether images are scanned after being pushed to the repository"
  type        = bool
  default     = true
}

variable "encryption_type" {
  description = "The encryption type to use for the repository. Valid values: AES256 or KMS"
  type        = string
  default     = "AES256"
}

variable "image_retention_count" {
  description = "Number of images to keep in each repository"
  type        = number
  default     = 30
}

variable "allowed_principals" {
  description = "List of AWS principal ARNs allowed to pull images"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to the ECR repository"
  type        = map(string)
  default     = {}
}