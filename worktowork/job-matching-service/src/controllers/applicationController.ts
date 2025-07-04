import { Response } from 'express';
import { AuthRequest } from '../types';
import Application from '../models/Application';
import Job from '../models/Job';

export const applyToJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { coverLetter, resume } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const existingApplication = await Application.findOne({
      jobId,
      jobSeekerId: req.userId
    });

    if (existingApplication) {
      res.status(400).json({ error: 'Already applied to this job' });
      return;
    }

    const application = new Application({
      jobId,
      jobSeekerId: req.userId,
      employerId: job.employerId,
      coverLetter,
      resume
    });

    await application.save();
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
};

export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const applications = await Application.find({ jobSeekerId: req.userId })
      .populate('jobId', 'title company location')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

export const getJobApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const job = await Job.findOne({ _id: jobId, employerId: req.userId });
    if (!job) {
      res.status(404).json({ error: 'Job not found or unauthorized' });
      return;
    }

    const applications = await Application.find({ jobId })
      .populate('jobSeekerId', 'firstName lastName email')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    const application = await Application.findOneAndUpdate(
      { _id: applicationId, employerId: req.userId },
      {
        status,
        notes,
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!application) {
      res.status(404).json({ error: 'Application not found or unauthorized' });
      return;
    }

    res.json({ message: 'Application status updated', application });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
};