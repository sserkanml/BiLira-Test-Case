resource "aws_ssm_parameter" "mongodb_root_password" {
  name  = "/dev/mongodb/root-password"
  type  = "SecureString"
  value = "0d4bFINojjD6MJ"
}

resource "aws_ssm_parameter" "mongodb_username" {
  name  = "/dev/mongodb/username"
  type  = "SecureString"
  value = "bilira"
}

resource "aws_ssm_parameter" "mongodb_password" {
  name  = "/dev/mongodb/password"
  type  = "SecureString"
  value = "0d4bFINojjD6MJ"
}

resource "aws_ssm_parameter" "mongodb_database" {
  name  = "/dev/mongodb/database"
  type  = "SecureString"
  value = "user-events"
}



