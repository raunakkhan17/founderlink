import { Schema, model, Document, Types } from 'mongoose';

export interface IMetric extends Document {
  _id: Types.ObjectId;
  startupId: Types.ObjectId;
  month: string;
  revenue: number;
  activeUsers: number;
  fundsUsed: number;
  milestone?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MetricSchema = new Schema<IMetric>(
  {
    startupId: {
      type: Schema.Types.ObjectId,
      ref: 'Startup',
      required: [true, 'Startup ID is required'],
      index: true,
    },
    month: {
      type: String,
      required: [true, 'Month is required'],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format'],
      trim: true,
    },
    revenue: {
      type: Number,
      default: 0,
      min: [0, 'Revenue cannot be negative'],
    },
    activeUsers: {
      type: Number,
      default: 0,
      min: [0, 'Active users cannot be negative'],
    },
    fundsUsed: {
      type: Number,
      default: 0,
      min: [0, 'Funds used cannot be negative'],
    },
    milestone: {
      type: String,
      trim: true,
      maxlength: [500, 'Milestone must be under 500 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes must be under 2000 characters'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'CreatedBy user ID is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index: unique metric entry per startup per month
MetricSchema.index({ startupId: 1, month: 1 }, { unique: true });

export const Metric = model<IMetric>('Metric', MetricSchema);
