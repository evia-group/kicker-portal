import { Request } from 'express';

export interface RequestUser {
  id: string;
  name: string;
  isAdmin: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}
