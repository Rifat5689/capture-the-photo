import 'dotenv/config';
import fs from 'fs';
import { uploadPhotoToR2 } from './src/services/cloudflareStorage.js';

async function test() {
  try {
    const buffer = Buffer.from('test image content');
    console.log('Uploading...');
    const url = await uploadPhotoToR2(buffer, 'test.jpg', 'image/jpeg');
    console.log('Success:', url);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
