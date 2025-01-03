import { Schema, Document } from 'mongoose';

export interface Message extends Document {
  eventId: string;
  eventType: string;
  timestamp: Date;
  payload: Record<string, unknown>;
}

export const MessageSchema = new Schema({
  eventId: { type: String, required: true },
  eventType: { type: String, required: true },
  timestamp: { type: Date, required: true },
  payload: { type: Object, required: true },
});