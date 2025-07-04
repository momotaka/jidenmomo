import { Router } from 'express';
import { body } from 'express-validator';
import { register, login } from '../controllers/authController';
import { handleValidationErrors } from '../middleware/validation';
import { UserRole } from '../types';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(Object.values(UserRole)),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('phone').optional().isMobilePhone('any'),
    body('companyName').optional().trim()
  ],
  handleValidationErrors,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  handleValidationErrors,
  login
);

export default router;