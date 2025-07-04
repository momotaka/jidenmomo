import { Request, Response } from 'express';
import User from '../models/User';
import JobSeekerProfile from '../models/JobSeekerProfile';
import EmployerProfile from '../models/EmployerProfile';
import { generateToken } from '../utils/jwt';
import { UserRole } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role, firstName, lastName, phone, companyName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const user = new User({
      email,
      password,
      role,
      firstName,
      lastName,
      phone
    });

    await user.save();

    if (role === UserRole.JOB_SEEKER) {
      await JobSeekerProfile.create({ userId: user._id as any });
    } else if (role === UserRole.EMPLOYER) {
      await EmployerProfile.create({
        userId: user._id as any,
        companyName: companyName || `${firstName} ${lastName}`,
        location: 'To be updated'
      });
    }

    const token = generateToken((user._id as any).toString());

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    const token = generateToken((user._id as any).toString());

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};