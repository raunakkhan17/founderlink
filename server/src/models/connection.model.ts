import { Schema, model, Document, Types } from 'mongoose';

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface IConnection extends Document {
  _id: Types.ObjectId;
  founderId: Types.ObjectId;
  investorId: Types.ObjectId;
  startupId: Types.ObjectId;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ConnectionSchema = new Schema<IConnection>(
  {
    founderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Founder ID is required'],
      index: true,
    },
    investorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Investor ID is required'],
      index: true,
    },
    startupId: {
      type: Schema.Types.ObjectId,
      ref: 'Startup',
      required: [true, 'Startup ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'declined', 'blocked'],
        message: '{VALUE} is not a valid connection status',
      },
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: prevents duplicate connection between founder, investor, and startup
ConnectionSchema.index({ founderId: 1, investorId: 1, startupId: 1 }, { unique: true });
ConnectionSchema.index({ founderId: 1, investorId: 1 });
ConnectionSchema.index({ startupId: 1, status: 1 });

export const Connection = model<IConnection>('Connection', ConnectionSchema);

