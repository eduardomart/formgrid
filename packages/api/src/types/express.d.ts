import { Request } from 'express';
import { AuthRequest } from '../presentation/middleware/auth';

// Re-export AuthRequest for convenience
export { AuthRequest };

// Extend Express Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
            };
        }
    }
}
