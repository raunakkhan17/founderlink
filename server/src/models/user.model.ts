import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'founder' | 'investor' | 'admin';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface IInvestorProfile {
  interests: string[];
  ticketMin?: number;
  ticketMax?: number;
  pastInvestments: string[];
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isEmailVerified: boolean;
  verificationStatus: VerificationStatus;
  isSuspended: boolean;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  location?: string;
  investorProfile?: IInvestorProfile;
  createdAt: Date;
  updatedAt: Date;
}

const InvestorProfileSchema = new Schema<IInvestorProfile>(
  {
    interests: {
      type: [String],
      default: [],
    },
    ticketMin: {
      type: Number,
      min: [0, 'Minimum ticket size must be non-negative'],
    },
    ticketMax: {
      type: Number,
      min: [0, 'Maximum ticket size must be non-negative'],
    },
    pastInvestments: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name must be under 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: {
        values: ['founder', 'investor', 'admin'],
        message: '{VALUE} is not a valid user role',
      },
      required: [true, 'Role is required'],
      default: 'founder',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: '{VALUE} is not a valid verification status',
      },
      default: 'pending',
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: [160, 'Headline must be under 160 characters'],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [2000, 'Bio must be under 2000 characters'],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location must be under 100 characters'],
    },
    investorProfile: {
      type: InvestorProfileSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// Indexes
UserSchema.index({ role: 1 });
UserSchema.index({ verificationStatus: 1 });

export const User = model<IUser>('User', UserSchema);
