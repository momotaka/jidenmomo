import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorizeRole } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getEmployerJobs
} from '../controllers/jobController';
import { UserRole, JobType } from '../types';

const router = Router();

router.get('/', getJobs);
router.get('/employer', authenticate, authorizeRole([UserRole.EMPLOYER]), getEmployerJobs);
router.get('/:id', getJobById);

router.post(
  '/',
  authenticate,
  authorizeRole([UserRole.EMPLOYER]),
  [
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('requirements').isArray(),
    body('responsibilities').isArray(),
    body('skills').isArray(),
    body('jobType').isIn(Object.values(JobType)),
    body('location').notEmpty().trim(),
    body('isRemote').optional().isBoolean(),
    body('salary.min').optional().isNumeric(),
    body('salary.max').optional().isNumeric(),
    body('applicationDeadline').optional().isISO8601()
  ],
  handleValidationErrors,
  createJob
);

router.put(
  '/:id',
  authenticate,
  authorizeRole([UserRole.EMPLOYER]),
  handleValidationErrors,
  updateJob
);

router.delete(
  '/:id',
  authenticate,
  authorizeRole([UserRole.EMPLOYER]),
  deleteJob
);

export default router;