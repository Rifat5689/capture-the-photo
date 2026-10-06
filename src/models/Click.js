import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema({
  newspaperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Newspaper' },
  linkId: { type: String, required: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String }
}, { timestamps: true });

const Click = mongoose.model('Click', clickSchema);
export default Click;
