export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  type: 'personal' | 'team';
  plan?: 'free' | 'business';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: 'admin' | 'member';
}
