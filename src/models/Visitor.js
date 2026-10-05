import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  newspaperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Newspaper' },
  linkId: { type: String, required: true },
  sessionId: { type: String, required: true },
  photoUrl: { type: String },
  permissionStatus: { type: String, enum: ['granted', 'denied'], required: true },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  }
}, { timestamps: true });

const Visitor = mongoose.model('Visitor', visitorSchema);
export default Visitor;
