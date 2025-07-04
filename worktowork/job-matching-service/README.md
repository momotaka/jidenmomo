# Job Matching Service

A job matching platform that connects job seekers with employers.

## Features

- User authentication (job seekers and employers)
- Job seeker profiles with education and experience
- Employer profiles with company information
- Job posting and management
- Job search and filtering
- Application submission and tracking
- Messaging between users (basic structure implemented)

## Tech Stack

- Node.js with TypeScript
- Express.js
- MongoDB with Mongoose
- JWT authentication
- bcrypt for password hashing

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/job-matching
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRE=30d
```

3. Run in development mode:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Profile
- GET `/api/profile/me` - Get current user profile
- PUT `/api/profile/jobseeker` - Update job seeker profile
- PUT `/api/profile/employer` - Update employer profile
- POST `/api/profile/jobseeker/education` - Add education
- POST `/api/profile/jobseeker/experience` - Add experience

### Jobs
- GET `/api/jobs` - Get all jobs (with filters)
- GET `/api/jobs/:id` - Get job by ID
- POST `/api/jobs` - Create new job (employer only)
- PUT `/api/jobs/:id` - Update job (employer only)
- DELETE `/api/jobs/:id` - Close job (employer only)
- GET `/api/jobs/employer` - Get employer's jobs

### Applications
- POST `/api/applications/jobs/:jobId/apply` - Apply to job
- GET `/api/applications/my-applications` - Get job seeker's applications
- GET `/api/applications/jobs/:jobId/applications` - Get job applications (employer)
- PUT `/api/applications/:applicationId/status` - Update application status