import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorizeRole } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus
} from '../controllers/applicationController';
import { UserRole, ApplicationStatus } from '../types';

const router = Router();

router.post(
  '/jobs/:jobId/apply',
  authenticate,
  authorizeRole([UserRole.JOB_SEEKER]),
  [
    body('coverLetter').optional().trim(),
    body('resume').optional().trim()
  ],
  handleValidationErrors,
  applyToJob
);

router.get(
  '/my-applications',
  authenticate,
  authorizeRole([UserRole.JOB_SEEKER]),
  getMyApplications
);

router.get(
  '/jobs/:jobId/applications',
  authenticate,
  authorizeRole([UserRole.EMPLOYER]),
  getJobApplications
);

router.put(
  '/:applicationId/status',
  authenticate,
  authorizeRole([UserRole.EMPLOYER]),
  [
    body('status').isIn(Object.values(ApplicationStatus)),
    body('notes').optional().trim()
  ],
  handleValidationErrors,
  updateApplicationStatus
);

export default router;