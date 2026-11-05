import { Schema, model, Document, Types } from 'mongoose';

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected';

export interface IAccessRequest extends Document {
  _id: Types.ObjectId;
  investorId: Types.ObjectId;
  documentId: Types.ObjectId;
  startupId: Types.ObjectId;
  status: AccessRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AccessRequestSchema = new Schema<IAccessRequest>(
  {
    investorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Investor ID is required'],
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Document ID is required'],
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
        values: ['pending', 'approved', 'rejected'],
        message: '{VALUE} is not a valid access request status',
      },
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Unique index to prevent duplicate access requests from same investor for same document
AccessRequestSchema.index({ investorId: 1, documentId: 1 }, { unique: true });
AccessRequestSchema.index({ startupId: 1, status: 1 });

export const AccessRequest = model<IAccessRequest>('AccessRequest', AccessRequestSchema);

