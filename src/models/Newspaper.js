import mongoose from 'mongoose';

const newspaperSchema = new mongoose.Schema({
  title: { type: String, required: true },
  headline: { type: String, required: true },
  coverImage: { type: String },
  articleImages: [{ type: String }],
  summary: { type: String },
  content: { type: String },
  author: { type: String },
  source: { type: String },
  publicationDate: { type: Date, default: Date.now },
  linkId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' }
}, { timestamps: true });

const Newspaper = mongoose.model('Newspaper', newspaperSchema);
export default Newspaper;
