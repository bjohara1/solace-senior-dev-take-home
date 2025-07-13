// AWS Lambda handler for Enclave-Style Decryption Service
const AWS = require('aws-sdk');

// Initialize AWS SDK clients
const s3 = new AWS.S3();
const kms = new AWS.KMS();

// Environment variables
const BUCKET_NAME = process.env.BUCKET_NAME;
const KMS_KEY_ID = process.env.KMS_KEY_ID;

exports.handler = async (event) => {
  // Enable CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Parse POST body
    const body = JSON.parse(event.body);
    const blobKey = body.blobKey;
    if (!blobKey) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing blobKey' }),
      };
    }

    // Fetch encrypted blob from S3
    const s3Object = await s3.getObject({
      Bucket: BUCKET_NAME,
      Key: blobKey,
    }).promise();
    const encryptedBlob = s3Object.Body;

    // Decrypt blob with KMS
    const decryptResult = await kms.decrypt({
      CiphertextBlob: encryptedBlob,
      KeyId: KMS_KEY_ID, // Optional: can be omitted if ciphertext encodes key
    }).promise();
    const plaintext = decryptResult.Plaintext.toString('utf-8');

    // Return plaintext in JSON
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ plaintext }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
}; 