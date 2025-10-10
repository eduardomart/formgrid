// Export user module components
export { UserService } from './user.service';
export { UserController } from './user.controller';
export { UserRepository } from './user.repository';
export { createUserRoutes } from './user.routes';

// Example usage:
/*
import { createUserRoutes } from './user';
import express from 'express';

const app = express();

// Add user routes
app.use('/api/user', createUserRoutes());

// Available endpoints:
// GET    /api/user/profile - Get current user's profile (protected)
// PUT    /api/user/profile - Update current user's profile (protected)
// GET    /api/user/info - Get current user's basic info (protected)
// DELETE /api/user/profile - Clear current user's profile (protected)
// GET    /api/user/profile/:userId - Get public profile by user ID (public)
*/
