import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  ticketTypeId: mongoose.Types.ObjectId;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ticketTypeId: { type: Schema.Types.ObjectId, ref: 'TicketType', required: true },
    status: { 
      type: String, 
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED'], 
      default: 'PENDING' 
    },
    qrCode: { type: String },
  },
  { timestamps: true }
);

const Registration: Model<IRegistration> = mongoose.models.Registration || mongoose.model<IRegistration>('Registration', RegistrationSchema);

export default Registration;
