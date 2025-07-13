# Task A: Enclave-Style Decryption Service

## Overview
This service emulates a Trusted Execution Environment (TEE) using AWS Lambda and KMS for secure "data in use" decryption. It receives an S3 object key, fetches the encrypted blob, decrypts it with KMS, and returns the plaintext securely over HTTPS.

---

## Directory Structure
```
task-A/
├── README.md
├── infra/         # Terraform for AWS resources
├── src/           # Lambda handler code (Node.js)
├── test/          # Test scripts and sample data
```

---

## Prerequisites
- AWS CLI configured with sufficient permissions
- Terraform >= 1.0
- Node.js >= 18.x (for local testing)
- jq, curl, and zip (for packaging/testing)

---

## Setup & Deployment

### 1. Build and Package Lambda
```bash
cd src
npm install aws-sdk
zip -r lambda.zip index.js node_modules/
```

### 2. Deploy Infrastructure
```bash
cd ../infra
terraform init
terraform apply -auto-approve
```
- This will create:
  - S3 bucket (encrypted)
  - KMS key (alias: /solace/decrypt)
  - Lambda function (with least-privilege IAM role)
  - API Gateway endpoint

### 3. Encrypt a Sample Blob
```bash
# Create a sample plaintext file
cd ../test
echo 'This is a sample secret message.' > sample_plaintext.txt

# Encrypt with AWS KMS (replace <KMS_KEY_ID> with your key)
aws kms encrypt \
  --key-id <KMS_KEY_ID> \
  --plaintext fileb://sample_plaintext.txt \
  --output text \
  --query CiphertextBlob | base64 --decode > sample_encrypted_blob

# Upload to S3 (replace <BUCKET_NAME> and <BLOB_KEY> as needed)
aws s3 cp sample_encrypted_blob s3://<BUCKET_NAME>/<BLOB_KEY>
```

---

## Usage

### 1. Find Your API Endpoint
After `terraform apply`, output will show the API Gateway endpoint (e.g., `https://xxxxxx.execute-api.us-east-1.amazonaws.com/decrypt`).

### 2. Test Decryption (Manual)
```bash
curl -X POST <API_URL> \
  -H "Content-Type: application/json" \
  -d '{"blobKey": "<BLOB_KEY>"}'
```

### 3. Test Decryption (Script)
```bash
cd test
chmod +x decrypt_test.sh
./decrypt_test.sh <API_URL> <BLOB_KEY>
```

---

## Environment Variables
- `BUCKET_NAME`: S3 bucket name for encrypted blobs
- `KMS_KEY_ID`: KMS key ID or ARN for decryption

---

## Security Best Practices
- Lambda IAM role is least-privilege (S3 read, KMS decrypt only)
- S3 bucket enforces encryption at rest
- KMS key policy restricts decrypt to Lambda role
- All configuration via environment variables

---

## Cleanup
```bash
cd infra
terraform destroy -auto-approve
```

---

## Troubleshooting
- Ensure Lambda has correct IAM permissions for S3 and KMS
- Check CloudWatch Logs for Lambda errors
- Verify S3 object and KMS key IDs are correct
- API Gateway CORS errors: ensure POST and OPTIONS are allowed

---

## Example
```bash
# Example invocation
./decrypt_test.sh https://xxxxxx.execute-api.us-east-1.amazonaws.com/decrypt my-encrypted-blob
``` 