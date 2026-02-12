import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITicketType extends Document {
  eventId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sold: number;
  startSaleDate?: Date;
  endSaleDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketTypeSchema = new Schema<ITicketType>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, default: 0 },
    quantity: { type: Number, required: true },
    sold: { type: Number, default: 0 },
    startSaleDate: { type: Date },
    endSaleDate: { type: Date },
  },
  { timestamps: true }
);

const TicketType: Model<ITicketType> = mongoose.models.TicketType || mongoose.model<ITicketType>('TicketType', TicketTypeSchema);

export default TicketType;
