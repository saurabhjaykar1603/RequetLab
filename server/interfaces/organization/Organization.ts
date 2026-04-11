export type OrganizationPlan = 'free' | 'business';

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  plan: OrganizationPlan;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrganizationMember {
  organizationId: string;
  userId: string;
  role: 'admin' | 'member';
}

export const ORGANIZATION_PLAN_LIMITS: Record<OrganizationPlan, number> = {
  free: 3,
  business: 25,
};
