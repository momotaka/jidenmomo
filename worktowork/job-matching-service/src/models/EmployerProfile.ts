import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEmployerProfile extends Document {
  userId: Types.ObjectId;
  companyName: string;
  companyDescription?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  logo?: string;
  location: string;
  founded?: number;
  socialMedia?: {
    linkedIn?: string;
    twitter?: string;
    facebook?: string;
  };
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const employerProfileSchema = new Schema<IEmployerProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companyDescription: String,
  industry: String,
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
  },
  website: String,
  logo: String,
  location: {
    type: String,
    required: true
  },
  founded: Number,
  socialMedia: {
    linkedIn: String,
    twitter: String,
    facebook: String
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model<IEmployerProfile>('EmployerProfile', employerProfileSchema);