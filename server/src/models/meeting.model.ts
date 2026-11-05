import { Schema, model, Document, Types } from 'mongoose';

export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export interface IMeeting extends Document {
  _id: Types.ObjectId;
  connectionId: Types.ObjectId;
  title: string;
  scheduledAt: Date;
  roomName: string;
  createdBy: Types.ObjectId;
  status: MeetingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    connectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Connection',
      required: [true, 'Connection ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [200, 'Title must be under 200 characters'],
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled time is required'],
    },
    roomName: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'CreatedBy user ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
        message: '{VALUE} is not a valid meeting status',
      },
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MeetingSchema.index({ connectionId: 1, scheduledAt: 1 });
MeetingSchema.index({ createdBy: 1, scheduledAt: 1 });

export const Meeting = model<IMeeting>('Meeting', MeetingSchema);
