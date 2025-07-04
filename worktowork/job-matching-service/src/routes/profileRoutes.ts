import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorizeRole } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import {
  getProfile,
  updateJobSeekerProfile,
  updateEmployerProfile,
  addEducation,
  addExperience
} from '../controllers/profileController';
import { UserRole } from '../types';

const router = Router();

router.get('/me', authenticate, getProfile);

router.put(
  '/jobseeker',
  authenticate,
  authorizeRole([UserRole.JOB_SEEKER]),
  [
    body('headline').optional().trim(),
    body('summary').optional().trim(),
    body('location').optional().trim(),
    body('skills').optional().isArray(),
    body('isOpenToWork').optional().isBoolean()
  ],
  handleValidationErrors,
  updateJobSeekerProfile
);

router.put(
  '/employer',
  authenticate,
  authorizeRole([UserRole.EMPLOYER]),
  [
    body('companyName').optional().trim(),
    body('companyDescription').optional().trim(),
    body('industry').optional().trim(),
    body('location').optional().trim()
  ],
  handleValidationErrors,
  updateEmployerProfile
);

router.post(
  '/jobseeker/education',
  authenticate,
  authorizeRole([UserRole.JOB_SEEKER]),
  [
    body('institution').notEmpty().trim(),
    body('degree').notEmpty().trim(),
    body('field').notEmpty().trim(),
    body('startDate').isISO8601(),
    body('endDate').optional().isISO8601(),
    body('isOngoing').optional().isBoolean()
  ],
  handleValidationErrors,
  addEducation
);

router.post(
  '/jobseeker/experience',
  authenticate,
  authorizeRole([UserRole.JOB_SEEKER]),
  [
    body('company').notEmpty().trim(),
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('startDate').isISO8601(),
    body('endDate').optional().isISO8601(),
    body('isCurrentJob').optional().isBoolean()
  ],
  handleValidationErrors,
  addExperience
);

export default router;