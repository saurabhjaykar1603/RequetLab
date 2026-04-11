export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatarUrl?: string;
  jobTitle?: string;
  company?: string;
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
