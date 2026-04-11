export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
