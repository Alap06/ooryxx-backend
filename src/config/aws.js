const AWS = require('aws-sdk');
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET } = require('./env');

// Configuration AWS
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION
});

const s3 = new AWS.S3();

module.exports = {
  s3,
  bucketName: AWS_S3_BUCKET
};
