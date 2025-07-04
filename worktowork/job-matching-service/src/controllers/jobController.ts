import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import Job from '../models/Job';
import { JobStatus } from '../types';

export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = new Job({
      ...req.body,
      employerId: req.userId
    });

    await job.save();
    res.status(201).json({ message: 'Job posted successfully', job });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
};

export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      jobType,
      location,
      minSalary,
      maxSalary,
      skills,
      isRemote
    } = req.query;

    const query: any = { status: JobStatus.ACTIVE };

    if (search) {
      query.$text = { $search: search as string };
    }

    if (jobType) {
      query.jobType = jobType;
    }

    if (location) {
      query.location = new RegExp(location as string, 'i');
    }

    if (minSalary || maxSalary) {
      query['salary.min'] = {};
      if (minSalary) query['salary.min'].$gte = Number(minSalary);
      if (maxSalary) query['salary.max'] = { $lte: Number(maxSalary) };
    }

    if (skills) {
      const skillsArray = Array.isArray(skills) ? skills : [skills];
      query.skills = { $in: skillsArray };
    }

    if (isRemote !== undefined) {
      query.isRemote = isRemote === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('employerId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Job.countDocuments(query)
    ]);

    res.json({
      jobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

export const getJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('employerId', 'firstName lastName');

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
};

export const updateJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, employerId: req.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!job) {
      res.status(404).json({ error: 'Job not found or unauthorized' });
      return;
    }

    res.json({ message: 'Job updated successfully', job });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
};

export const deleteJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, employerId: req.userId },
      { status: JobStatus.CLOSED },
      { new: true }
    );

    if (!job) {
      res.status(404).json({ error: 'Job not found or unauthorized' });
      return;
    }

    res.json({ message: 'Job closed successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Failed to close job' });
  }
};

export const getEmployerJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jobs = await Job.find({ employerId: req.userId })
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Get employer jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};