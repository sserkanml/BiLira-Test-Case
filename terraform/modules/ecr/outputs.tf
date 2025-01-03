output "repository_urls" {
  description = "URLs of the ECR repositories"
  value       = { for name, repo in aws_ecr_repository.main : name => repo.repository_url }
}

output "repository_arns" {
  description = "ARNs of the ECR repositories"
  value       = { for name, repo in aws_ecr_repository.main : name => repo.arn }
}