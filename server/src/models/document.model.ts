import { Schema, model, Document, Types } from 'mongoose';

export type DocumentType = 'patent' | 'legal' | 'pitchdeck' | 'financial' | 'other';
export type AccessLevel = 'public' | 'locked' | 'approved_only';

export interface IDocument extends Document {
  _id: Types.ObjectId;
  startupId: Types.ObjectId;
  type: DocumentType;
  title: string;
  fileUrl: string;
  accessLevel: AccessLevel;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    startupId: {
      type: Schema.Types.ObjectId,
      ref: 'Startup',
      required: [true, 'Startup ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['patent', 'legal', 'pitchdeck', 'financial', 'other'],
        message: '{VALUE} is not a valid document type',
      },
      required: [true, 'Document type is required'],
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [200, 'Title must be under 200 characters'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
    },
    accessLevel: {
      type: String,
      enum: {
        values: ['public', 'locked', 'approved_only'],
        message: '{VALUE} is not a valid access level',
      },
      default: 'locked',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DocumentSchema.index({ startupId: 1, accessLevel: 1 });
DocumentSchema.index({ type: 1 });

export const DocumentModel = model<IDocument>('Document', DocumentSchema);
