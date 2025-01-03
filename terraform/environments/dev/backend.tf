terraform {
  backend "s3" {
    bucket         = "bilira-terraform-state"    
    key            = "dev/eks/terraform.tfstate"
    region         = "eu-central-1"                     
    encrypt        = true
  }
}