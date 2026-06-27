const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const env = require('../config/env');

const s3 = new S3Client({
  region: env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID || 'mock',
    secretAccessKey: env.S3_SECRET_ACCESS_KEY || 'mock',
  },
  ...(env.S3_ENDPOINT && { endpoint: env.S3_ENDPOINT }),
  forcePathStyle: true,
});

const BUCKET = env.S3_BUCKET || 'lottrace-attachments';

const generatePresignedUploadUrl = async (key, contentType, expiresIn = 3600) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return await getSignedUrl(s3, command, { expiresIn });
};

const generatePresignedDownloadUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn });
};

const uploadBuffer = async (key, buffer, contentType) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3.send(command);
  return key;
};

module.exports = {
  s3,
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  uploadBuffer,
};
