import { Schema, model, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  connectionId: Types.ObjectId;
  senderId: Types.ObjectId;
  text?: string;
  attachmentUrl?: string;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    connectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Connection',
      required: [true, 'Connection ID is required'],
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    attachmentUrl: {
      type: String,
      trim: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index: messages(connectionId, createdAt)
MessageSchema.index({ connectionId: 1, createdAt: 1 });

export const Message = model<IMessage>('Message', MessageSchema);
