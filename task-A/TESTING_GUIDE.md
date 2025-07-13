# Task A Testing Guide

## Deliverable Status: ✅ **COMPLETE**

### What's Included:
- ✅ Lambda handler (`src/index.js`) - Receives blobKey, fetches from S3, decrypts with KMS
- ✅ Infrastructure as Code (`infra/main.tf`) - Terraform for Lambda, KMS, S3, API Gateway
- ✅ Security Best Practices - Least-privilege IAM, encryption at rest, environment variables
- ✅ Testing Scripts - `decrypt_test.sh` and `setup_test_data.sh`
- ✅ README with detailed setup/deployment instructions

---

## How to Test That It's Complete and Correct

### Step 1: Verify File Structure
```bash
cd task-A
tree
# Should show:
# ├── README.md
# ├── infra/
# │   └── main.tf
# ├── src/
# │   ├── index.js
# │   └── package.json
# └── test/
#     ├── decrypt_test.sh
#     ├── setup_test_data.sh
#     └── sample_plaintext.txt
```

### Step 2: Validate Code Quality
```bash
# Check Lambda handler has all required functionality
grep -n "blobKey\|S3\|KMS\|CORS" src/index.js

# Check Terraform has all required resources
grep -n "lambda\|kms\|s3\|api_gateway" infra/main.tf

# Check security practices
grep -n "encryption\|policy\|role" infra/main.tf
```

### Step 3: Deploy and Test End-to-End

#### 3a. Package Lambda
```bash
cd src
npm install
zip -r lambda.zip index.js node_modules/
```

#### 3b. Deploy Infrastructure
```bash
cd ../infra
terraform init
terraform apply -auto-approve
```

#### 3c. Get Output Values
```bash
terraform output
# Note: api_gateway_url, s3_bucket_name, kms_key_id
```

#### 3d. Set Up Test Data
```bash
cd ../test
./setup_test_data.sh <API_URL> <S3_BUCKET> <KMS_KEY_ID>
```

#### 3e. Test Decryption
```bash
./decrypt_test.sh <API_URL> test-encrypted-blob
# Expected: {"plaintext": "This is a sample secret message..."}
```

---

## Verification Checklist

### ✅ Lambda Implementation
- [ ] Receives `blobKey` via HTTP POST
- [ ] Fetches encrypted blob from S3
- [ ] Decrypts with AWS KMS
- [ ] Returns `{ plaintext: string }`
- [ ] Has proper CORS headers
- [ ] Handles errors gracefully

### ✅ Infrastructure as Code
- [ ] Lambda function with appropriate memory/timeout
- [ ] KMS key with alias `/solace/decrypt`
- [ ] KMS policy restricts use to Lambda role only
- [ ] S3 bucket with encryption at rest
- [ ] API Gateway for public invocation
- [ ] Least-privilege IAM roles

### ✅ Security Best Practices
- [ ] Environment variables for configuration
- [ ] S3 bucket policy allows Lambda read
- [ ] KMS key policy restricts decrypt to Lambda
- [ ] No hardcoded secrets
- [ ] Proper error handling (no info leakage)

### ✅ Testing
- [ ] Sample encrypted blob provided
- [ ] `decrypt_test.sh` script works
- [ ] End-to-end flow demonstrated
- [ ] README has clear instructions

---

## Expected Test Results

### Successful Decryption:
```json
{
  "plaintext": "This is a sample secret message for testing the decryption service."
}
```

### Error Cases:
```json
{"error": "Missing blobKey"}
{"error": "Access Denied"}
{"error": "Object not found"}
```

---

## Common Issues & Solutions

### Issue: Lambda can't access S3
**Solution**: Check IAM role has `s3:GetObject` permission for the specific bucket

### Issue: Lambda can't decrypt with KMS
**Solution**: Check KMS key policy allows Lambda role to decrypt

### Issue: API Gateway returns 403
**Solution**: Check Lambda permission allows API Gateway invocation

### Issue: CORS errors in browser
**Solution**: Verify CORS headers are set correctly in Lambda response

---

## Performance Validation

### Lambda Configuration:
- Memory: 256MB (sufficient for decrypt + small compute)
- Timeout: 10 seconds (adequate for S3 + KMS operations)

### Expected Response Times:
- Cold start: < 2 seconds
- Warm invocation: < 500ms
- S3 fetch: < 1 second
- KMS decrypt: < 500ms

---

## Security Validation

### IAM Principle of Least Privilege:
- Lambda role only has `s3:GetObject` on specific bucket
- Lambda role only has `kms:Decrypt` on specific key
- No admin or overly broad permissions

### Encryption:
- S3 bucket enforces encryption at rest
- KMS key is used for all decryption
- No plaintext secrets in code or config

### Network Security:
- HTTPS enforced via API Gateway
- CORS properly configured
- No direct Lambda invocation (only via API Gateway)

---

## Final Verification Command
```bash
# Complete end-to-end test
cd task-A
./test/setup_test_data.sh $(terraform -chdir=infra output -raw api_gateway_url) $(terraform -chdir=infra output -raw s3_bucket_name) $(terraform -chdir=infra output -raw kms_key_id)
./test/decrypt_test.sh $(terraform -chdir=infra output -raw api_gateway_url) test-encrypted-blob
```

**If this works, the deliverable is complete and correct!** ✅ 