import { FastifyReply, FastifyRequest } from 'fastify';
import { OrganizationPlan } from '../interfaces/organization/Organization.ts';
import * as authRepository from '../repositories/authRepository.ts';
import * as organizationRepository from '../repositories/organizationRepository.ts';

const isValidPlan = (plan: string): plan is OrganizationPlan => {
  return plan === 'free' || plan === 'business';
};

export const createOrganization = async (
  request: FastifyRequest<{ Body: { name: string; plan?: OrganizationPlan } }>,
  reply: FastifyReply
) => {
  try {
    const userId = (request as any).user.id as string;
    const { name, plan } = request.body;

    if (!name || !name.trim()) {
      return reply.status(400).send({ error: 'Organization name is required' });
    }

    await organizationRepository.cleanupExtraOrganizationsForOwner(userId);

    const existingOwnedOrganization = await organizationRepository.findOrganizationByOwnerId(userId);
    if (existingOwnedOrganization) {
      return reply.status(400).send({
        error: 'You can create only one organization per account',
      });
    }

    const selectedPlan = plan && isValidPlan(plan) ? plan : 'free';
    const organization = await organizationRepository.createOrganization(name.trim(), userId, selectedPlan);

    return reply.status(201).send({
      ...organization,
      seatLimit: organizationRepository.getPlanSeatLimit(selectedPlan),
      memberCount: 1,
      role: 'admin',
    });
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const getUserOrganizations = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request as any).user.id as string;
    await organizationRepository.cleanupExtraOrganizationsForOwner(userId);
    const organizations = await organizationRepository.getUserOrganizations(userId);

    return organizations.map((organization) => ({
      ...organization,
      seatLimit: organizationRepository.getPlanSeatLimit(organization.plan),
    }));
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const getOrganizationMembers = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const organizationId = request.params.id;
    const userId = (request as any).user.id as string;

    const role = await organizationRepository.getOrganizationMemberRole(organizationId, userId);
    if (!role) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    const members = await organizationRepository.getOrganizationMembers(organizationId);
    return members;
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const addOrganizationMember = async (
  request: FastifyRequest<{ Params: { id: string }; Body: { email: string; role?: 'admin' | 'member' } }>,
  reply: FastifyReply
) => {
  try {
    const organizationId = request.params.id;
    const requesterId = (request as any).user.id as string;
    const { email, role } = request.body;

    const organization = await organizationRepository.findOrganizationById(organizationId);
    if (!organization) {
      return reply.status(404).send({ error: 'Organization not found' });
    }

    const requesterRole = await organizationRepository.getOrganizationMemberRole(organizationId, requesterId);
    if (requesterRole !== 'admin') {
      return reply.status(403).send({ error: 'Only organization admins can add members' });
    }

    if (!email || !email.trim()) {
      return reply.status(400).send({ error: 'Email is required' });
    }

    const user = await authRepository.findUserByEmail(email.trim().toLowerCase());
    if (!user) {
      return reply.status(404).send({ error: 'User with this email not found' });
    }

    const existingRole = await organizationRepository.getOrganizationMemberRole(organizationId, user.id);
    if (existingRole) {
      return reply.status(400).send({ error: 'User is already a member of this organization' });
    }

    const memberCount = await organizationRepository.countOrganizationMembers(organizationId);
    const seatLimit = organizationRepository.getPlanSeatLimit(organization.plan);

    if (memberCount >= seatLimit) {
      return reply.status(400).send({
        error: `The ${organization.plan} plan allows up to ${seatLimit} members. Upgrade your plan to add more users.`,
      });
    }

    const nextRole = role === 'admin' ? 'admin' : 'member';
    await organizationRepository.addMemberToOrganization(organizationId, user.id, nextRole);

    return reply.status(201).send({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      role: nextRole,
      memberCount: memberCount + 1,
      seatLimit,
    });
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const updateOrganizationPlan = async (
  request: FastifyRequest<{ Params: { id: string }; Body: { plan: OrganizationPlan } }>,
  reply: FastifyReply
) => {
  try {
    const organizationId = request.params.id;
    const userId = (request as any).user.id as string;
    const { plan } = request.body;

    if (!plan || !isValidPlan(plan)) {
      return reply.status(400).send({ error: 'Invalid plan. Use free or business.' });
    }

    const existingOrganization = await organizationRepository.findOrganizationById(organizationId);
    if (!existingOrganization) {
      return reply.status(404).send({ error: 'Organization not found' });
    }

    const requesterRole = await organizationRepository.getOrganizationMemberRole(organizationId, userId);
    if (requesterRole !== 'admin') {
      return reply.status(403).send({ error: 'Only organization admins can change the plan' });
    }

    const organization = await organizationRepository.updateOrganizationPlan(organizationId, plan, userId);
    if (!organization) {
      return reply.status(404).send({ error: 'Organization not found' });
    }

    return {
      ...organization,
      seatLimit: organizationRepository.getPlanSeatLimit(plan),
    };
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};
