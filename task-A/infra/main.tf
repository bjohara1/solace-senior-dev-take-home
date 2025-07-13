# Terraform configuration for Enclave-Style Decryption Service

provider "aws" {
  region = var.aws_region
}

# S3 bucket for encrypted blobs
resource "aws_s3_bucket" "encrypted_blobs" {
  bucket = var.s3_bucket_name
  force_destroy = true

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

# KMS key for decryption
resource "aws_kms_key" "decrypt_key" {
  description             = "KMS key for Solace decryption Lambda"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  policy                  = data.aws_iam_policy_document.kms_policy.json
}

resource "aws_kms_alias" "decrypt_alias" {
  name          = "alias/solace/decrypt"
  target_key_id = aws_kms_key.decrypt_key.key_id
}

# Lambda IAM role
resource "aws_iam_role" "lambda_exec" {
  name = "solace-lambda-exec-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# Lambda function
resource "aws_lambda_function" "decrypt_lambda" {
  function_name = "solace-decrypt-lambda"
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  role          = aws_iam_role.lambda_exec.arn
  filename      = "../src/lambda.zip" # Placeholder, update with actual zip path
  memory_size   = 256
  timeout       = 10
  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.encrypted_blobs.bucket
      KMS_KEY_ID  = aws_kms_key.decrypt_key.key_id
    }
  }
}

# API Gateway
resource "aws_apigatewayv2_api" "lambda_api" {
  name          = "solace-decrypt-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id             = aws_apigatewayv2_api.lambda_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.decrypt_lambda.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "lambda_route" {
  api_id    = aws_apigatewayv2_api.lambda_api.id
  route_key = "POST /decrypt"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_stage" "lambda_stage" {
  api_id      = aws_apigatewayv2_api.lambda_api.id
  name        = "$default"
  auto_deploy = true
}

# IAM policies and assume role docs
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "kms_policy" {
  statement {
    actions   = ["kms:Decrypt"]
    resources = ["*"]
    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.lambda_exec.arn]
    }
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.decrypt_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lambda_api.execution_arn}/*/*"
}

# Attach policies to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Custom S3 policy for specific bucket
resource "aws_iam_policy" "lambda_s3_policy" {
  name        = "lambda-s3-read-policy"
  description = "Policy for Lambda to read from specific S3 bucket"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.encrypted_blobs.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_s3_policy.arn
}

# Custom KMS policy for decrypt only
resource "aws_iam_policy" "lambda_kms_policy" {
  name        = "lambda-kms-decrypt-policy"
  description = "Policy for Lambda to decrypt with KMS key"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.decrypt_key.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_kms" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_kms_policy.arn
}

# Outputs
output "api_gateway_url" {
  description = "API Gateway URL for the decrypt endpoint"
  value       = "${aws_apigatewayv2_stage.lambda_stage.invoke_url}/decrypt"
}

output "s3_bucket_name" {
  description = "S3 bucket name for encrypted blobs"
  value       = aws_s3_bucket.encrypted_blobs.bucket
}

output "kms_key_id" {
  description = "KMS key ID for decryption"
  value       = aws_kms_key.decrypt_key.key_id
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for encrypted blobs"
  type        = string
  default     = "solace-encrypted-blobs"
} 