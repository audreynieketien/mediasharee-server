// Express Request type augmentation
import { IUserDocument } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
      };
      user?: IUserDocument;
    }
  }
}

export {};
