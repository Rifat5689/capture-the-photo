import AWS from 'aws-sdk';
import crypto from 'crypto';
import path from 'path';

const s3 = new AWS.S3({
  endpoint: `https://${process.env.CLOUD_STORAGE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.CLOUD_STORAGE_ACCESS_KEY,
  secretAccessKey: process.env.CLOUD_STORAGE_SECRET_KEY,
  signatureVersion: 'v4',
  region: 'auto',
});

export const uploadPhotoToR2 = async (fileBuffer, originalName, mimetype) => {
  const fileExtension = path.extname(originalName) || '.jpg';
  const fileName = `visitors/${crypto.randomBytes(16).toString('hex')}${fileExtension}`;

  const params = {
    Bucket: process.env.CLOUD_STORAGE_BUCKET,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimetype,
  };

  try {
    await s3.upload(params).promise();
    const publicBase = (process.env.CLOUD_STORAGE_PUBLIC_URL || '').replace(/\/$/, '');
    if (publicBase) return `${publicBase}/${fileName}`;
    const backendBase = (process.env.BACKEND_URL && !process.env.BACKEND_URL.includes('localhost')
      ? process.env.BACKEND_URL
      : 'https://capture-gdg9brfzhvg0gxeh.centralindia-01.azurewebsites.net').replace(/\/$/, '');
    return `${backendBase}/api/media/${fileName}`;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error('Image upload failed');
  }
};

export const getObjectFromR2 = (key) =>
  s3.getObject({ Bucket: process.env.CLOUD_STORAGE_BUCKET, Key: key }).promise();

export const deletePhotoFromR2 = async (photoUrl) => {
  try {
    const keyMatch = photoUrl.match(/(visitors\/[^?#]+)/);
    if (!keyMatch) return false;

    const params = {
      Bucket: process.env.CLOUD_STORAGE_BUCKET,
      Key: keyMatch[1],
    };

    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error("Error deleting from R2:", error);
    return false;
  }
};
