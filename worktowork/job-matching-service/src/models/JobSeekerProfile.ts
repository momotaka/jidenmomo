import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEducation {
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  isOngoing: boolean;
}

export interface IExperience {
  company: string;
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  isCurrentJob: boolean;
}

export interface IJobSeekerProfile extends Document {
  userId: Types.ObjectId;
  headline?: string;
  summary?: string;
  location?: string;
  skills: string[];
  education: IEducation[];
  experience: IExperience[];
  resume?: string;
  portfolio?: string;
  linkedIn?: string;
  github?: string;
  preferredJobTypes: string[];
  preferredLocations: string[];
  expectedSalary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  isOpenToWork: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const educationSchema = new Schema<IEducation>({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  field: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  isOngoing: { type: Boolean, default: false }
});

const experienceSchema = new Schema<IExperience>({
  company: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  isCurrentJob: { type: Boolean, default: false }
});

const jobSeekerProfileSchema = new Schema<IJobSeekerProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  headline: String,
  summary: String,
  location: String,
  skills: [String],
  education: [educationSchema],
  experience: [experienceSchema],
  resume: String,
  portfolio: String,
  linkedIn: String,
  github: String,
  preferredJobTypes: [String],
  preferredLocations: [String],
  expectedSalary: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'USD' }
  },
  isOpenToWork: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IJobSeekerProfile>('JobSeekerProfile', jobSeekerProfileSchema);