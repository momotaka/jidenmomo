import { Response } from 'express';
import { AuthRequest } from '../types';
import User from '../models/User';
import JobSeekerProfile from '../models/JobSeekerProfile';
import EmployerProfile from '../models/EmployerProfile';
import { UserRole } from '../types';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let profile;
    if (user.role === UserRole.JOB_SEEKER) {
      profile = await JobSeekerProfile.findOne({ userId: user._id });
    } else if (user.role === UserRole.EMPLOYER) {
      profile = await EmployerProfile.findOne({ userId: user._id });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified
      },
      profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const updateJobSeekerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await JobSeekerProfile.findOneAndUpdate(
      { userId: req.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const updateEmployerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await EmployerProfile.findOneAndUpdate(
      { userId: req.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const addEducation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await JobSeekerProfile.findOneAndUpdate(
      { userId: req.userId },
      { $push: { education: req.body } },
      { new: true }
    );

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({ message: 'Education added successfully', profile });
  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({ error: 'Failed to add education' });
  }
};

export const addExperience = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await JobSeekerProfile.findOneAndUpdate(
      { userId: req.userId },
      { $push: { experience: req.body } },
      { new: true }
    );

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({ message: 'Experience added successfully', profile });
  } catch (error) {
    console.error('Add experience error:', error);
    res.status(500).json({ error: 'Failed to add experience' });
  }
};