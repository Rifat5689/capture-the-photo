import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// We will use local paths to import, so we can run this directly
import { uploadPhotoToR2 } from './src/services/cloudflareStorage.js';
import Newspaper from './src/models/Newspaper.js';

const IMAGE_PATH = 'C:\\Users\\Rifat\\.gemini\\antigravity-ide\\brain\\a968025d-10e2-42e7-b2b4-46a73f2936b5\\bangabandhu_news_cover_1791221763430.png';

async function createBangabandhuNews() {
  try {
    // 1. Connect to MongoDB
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Database connected successfully!');

    // 2. Upload the generated image
    console.log('Uploading high-quality image to R2...');
    let coverImageUrl = '';
    
    if (fs.existsSync(IMAGE_PATH)) {
      const fileBuffer = fs.readFileSync(IMAGE_PATH);
      coverImageUrl = await uploadPhotoToR2(fileBuffer, 'bangabandhu-historical.png', 'image/png');
      console.log('Image uploaded! URL:', coverImageUrl);
    } else {
      console.log('Local AI generated image not found, using a fallback realistic placeholder...');
      coverImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Sheikh_Mujibur_Rahman_in_1950.jpg'; // fallback
    }

    // 3. Create the Newspaper Entry in Bengali
    console.log('Creating professional news article...');
    
    const linkId = crypto.randomBytes(4).toString('hex');
    
    const article = {
      title: 'জাতির পিতা বঙ্গবন্ধু শেখ মুজিবুর রহমান',
      headline: '৭ই মার্চের ঐতিহাসিক ভাষণ: যে ডাক বদলে দিয়েছিল একটি জাতির ভাগ্য',
      summary: '১৯৭১ সালের ৭ই মার্চ রেসকোর্স ময়দানে বঙ্গবন্ধু শেখ মুজিবুর রহমানের দেওয়া সেই ঐতিহাসিক ভাষণ আজও বাঙালি জাতিকে অনুপ্রেরণা জোগায়। ইউনেস্কো কর্তৃক স্বীকৃত এই ভাষণটি বিশ্ব ইতিহাসের অন্যতম শ্রেষ্ঠ ভাষণ।',
      content: '১৯৭১ সালের ৭ই মার্চ তৎকালীন রেসকোর্স ময়দানে (বর্তমান সোহরাওয়ার্দী উদ্যান) বাঙালি জাতির অবিসংবাদিত নেতা, জাতির পিতা বঙ্গবন্ধু শেখ মুজিবুর রহমান এক ঐতিহাসিক ভাষণ প্রদান করেন। ১৮ মিনিট স্থায়ী এই ভাষণে তিনি পূর্ব পাকিস্তানের বাঙালিদের স্বাধীনতা সংগ্রামের জন্য প্রস্তুত হওয়ার আহ্বান জানান। \n\nতাঁর উদাত্ত কণ্ঠে ঘোষিত "এবারের সংগ্রাম আমাদের মুক্তির সংগ্রাম, এবারের সংগ্রাম স্বাধীনতার সংগ্রাম" আপামর জনসাধারণকে মহান মুক্তিযুদ্ধে ঝাঁপিয়ে পড়তে উদ্বুদ্ধ করেছিল। এই ভাষণটি কেবল বাংলাদেশের মানুষের জন্যই নয়, বরং সারা বিশ্বের স্বাধীনতাকামী মানুষের জন্য এক চিরন্তন অনুপ্রেরণার উৎস। ২০১৭ সালের ৩০শে অক্টোবর ইউনেস্কো এই ভাষণটিকে "মেমোরি অফ দ্য ওয়ার্ল্ড ইন্টারন্যাশনাল রেজিস্টার"-এ অন্তর্ভুক্ত করে বিশ্ব প্রামাণ্য ঐতিহ্য হিসেবে স্বীকৃতি প্রদান করে।\n\nবঙ্গবন্ধুর এই দূরদর্শী দিকনির্দেশনা ও বলিষ্ঠ নেতৃত্বই অবশেষে ১৯৭১ সালের ১৬ই ডিসেম্বর বাঙালি জাতিকে এনে দেয় কাঙ্ক্ষিত বিজয়। আজকের নতুন প্রজন্মের কাছে এই ভাষণ ও বঙ্গবন্ধুর আদর্শ পৌঁছে দেওয়া আমাদের নৈতিক দায়িত্ব।',
      author: 'নিজস্ব প্রতিবেদক',
      source: 'জাতীয় আর্কাইভ',
      coverImage: coverImageUrl,
      status: 'published',
      linkId: linkId
    };

    const newspaper = await Newspaper.create(article);
    console.log('\n=======================================');
    console.log('✅ SUCCESS! Newspaper Created!');
    console.log(`Title: ${newspaper.headline}`);
    console.log(`Link ID: ${newspaper.linkId}`);
    console.log('=======================================');
    console.log(`\n➡️  Go to your Admin Dashboard to copy the share link, or share this directly:`);
    console.log(`${process.env.BACKEND_URL || 'http://localhost:5000/api'}/visitor/${newspaper.linkId}/share?frontendUrl=https://capture-f5c1a.web.app`);

  } catch (error) {
    console.error('Error creating news:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    process.exit(0);
  }
}

createBangabandhuNews();
