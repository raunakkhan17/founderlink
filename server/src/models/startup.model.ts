import { Schema, model, Document, Types } from 'mongoose';

export type StartupStage = 'idea' | 'mvp' | 'seed' | 'growth';
export type StartupStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface ITeamMember {
  name: string;
  role: string;
  avatarUrl?: string;
  linkedinUrl?: string;
}

export interface IStartup extends Document {
  _id: Types.ObjectId;
  founderId: Types.ObjectId;
  name: string;
  tagline?: string;
  problem?: string;
  solution?: string;
  market?: string;
  industry: string;
  stage: StartupStage;
  fundingAsk?: number;
  equityOffered?: number;
  team: ITeamMember[];
  status: StartupStatus;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    name: {
      type: String,
      required: [true, 'Team member name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Team member role is required'],
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    linkedinUrl: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const StartupSchema = new Schema<IStartup>(
  {
    founderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Founder ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Startup name is required'],
      trim: true,
      maxlength: [150, 'Startup name must be under 150 characters'],
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: [250, 'Tagline must be under 250 characters'],
    },
    problem: {
      type: String,
      trim: true,
    },
    solution: {
      type: String,
      trim: true,
    },
    market: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true,
    },
    stage: {
      type: String,
      enum: {
        values: ['idea', 'mvp', 'seed', 'growth'],
        message: '{VALUE} is not a valid startup stage',
      },
      required: [true, 'Stage is required'],
    },
    fundingAsk: {
      type: Number,
      min: [0, 'Funding ask cannot be negative'],
    },
    equityOffered: {
      type: Number,
      min: [0, 'Equity offered cannot be negative'],
      max: [100, 'Equity offered cannot exceed 100%'],
    },
    team: {
      type: [TeamMemberSchema],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'pending', 'approved', 'rejected'],
        message: '{VALUE} is not a valid startup status',
      },
      default: 'draft',
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: [0, 'Views count cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index: industry, stage, status
StartupSchema.index({ industry: 1, stage: 1, status: 1 });

export const Startup = model<IStartup>('Startup', StartupSchema);

