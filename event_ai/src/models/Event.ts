import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEvent extends Document {
  name: string;
  slug: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  venue?: string;
  organizationId: mongoose.Types.ObjectId;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    venue: { type: String },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    status: { 
      type: String, 
      enum: ['DRAFT', 'PUBLISHED', 'CANCELLED'], 
      default: 'DRAFT' 
    },
  },
  { timestamps: true }
);

const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
