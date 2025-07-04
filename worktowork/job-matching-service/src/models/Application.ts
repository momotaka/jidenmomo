import mongoose, { Document, Schema, Types } from 'mongoose';
import { ApplicationStatus } from '../types';

export interface IApplication extends Document {
  jobId: Types.ObjectId;
  jobSeekerId: Types.ObjectId;
  employerId: Types.ObjectId;
  coverLetter?: string;
  resume?: string;
  status: ApplicationStatus;
  notes?: string;
  appliedAt: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>({
  jobId: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  jobSeekerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverLetter: String,
  resume: String,
  status: {
    type: String,
    enum: Object.values(ApplicationStatus),
    default: ApplicationStatus.PENDING
  },
  notes: String,
  appliedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date
}, {
  timestamps: true
});

applicationSchema.index({ jobId: 1, jobSeekerId: 1 }, { unique: true });
applicationSchema.index({ jobSeekerId: 1, status: 1 });
applicationSchema.index({ employerId: 1, status: 1 });

export default mongoose.model<IApplication>('Application', applicationSchema);