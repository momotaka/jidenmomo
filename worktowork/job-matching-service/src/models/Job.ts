import mongoose, { Document, Schema, Types } from 'mongoose';
import { JobType, JobStatus } from '../types';

export interface IJob extends Document {
  employerId: Types.ObjectId;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  jobType: JobType;
  location: string;
  isRemote: boolean;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    isNegotiable?: boolean;
  };
  benefits?: string[];
  applicationDeadline?: Date;
  status: JobStatus;
  viewCount: number;
  applicationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>({
  employerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  responsibilities: [String],
  skills: [String],
  jobType: {
    type: String,
    enum: Object.values(JobType),
    required: true
  },
  location: {
    type: String,
    required: true
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  salary: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'USD' },
    isNegotiable: { type: Boolean, default: false }
  },
  benefits: [String],
  applicationDeadline: Date,
  status: {
    type: String,
    enum: Object.values(JobStatus),
    default: JobStatus.ACTIVE
  },
  viewCount: {
    type: Number,
    default: 0
  },
  applicationCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ employerId: 1 });

export default mongoose.model<IJob>('Job', jobSchema);