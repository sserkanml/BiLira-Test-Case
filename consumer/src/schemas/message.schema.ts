import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Message extends Document {
  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({
    type: Date,
    required: true,
  
  })
  timestamp: Date;

  @Prop({ required: true, type: Object })
  payload: Record<string, any>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
