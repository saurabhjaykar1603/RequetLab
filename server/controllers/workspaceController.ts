import { FastifyRequest, FastifyReply } from 'fastify';
import * as workspaceRepository from '../repositories/workspaceRepository.ts';
import * as authRepository from '../repositories/authRepository.ts';

export const createWorkspace = async (request: FastifyRequest<{ Body: { name: string; type?: 'personal' | 'team' } }>, reply: FastifyReply) => {
  try {
    const { name, type } = request.body;
    const userId = (request as any).user.id; 
    const workspace = await workspaceRepository.createWorkspace(name, userId, type);
    return reply.status(201).send(workspace);
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const getUserWorkspaces = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request as any).user.id;
    const workspaces = await workspaceRepository.getUserWorkspaces(userId);
    return workspaces;
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const getWorkspaceMembers = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const members = await workspaceRepository.getWorkspaceMembers(id);
    return members;
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const addMember = async (request: FastifyRequest<{ Params: { id: string }; Body: { email: string; role?: 'admin' | 'member' } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const { email, role } = request.body;
    const inviterId = (request as any).user.id;

    // 1. Check if workspace exists and is a team workspace
    const workspace = await workspaceRepository.findWorkspaceById(id);
    if (!workspace) return reply.status(404).send({ error: 'Workspace not found' });
    if (workspace.type === 'personal') return reply.status(400).send({ error: 'Personal workspaces cannot have additional members' });

    // 2. Check if inviter is admin
    const inviterRole = await workspaceRepository.getMemberRole(id, inviterId);
    if (inviterRole !== 'admin') return reply.status(403).send({ error: 'Only admins can invite members' });

    // 3. Find user by email
    const user = await authRepository.findUserByEmail(email);
    if (!user) return reply.status(404).send({ error: 'User with this email not found' });

    // 4. Create invitation instead of direct membership
    const invitation = await workspaceRepository.createInvitation(id, inviterId, user.id, role || 'member');
    return { success: true, user: { name: user.name, email: user.email }, invitation };
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const getUserInvitations = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request as any).user.id;
    const invitations = await workspaceRepository.getPendingInvitations(userId);
    return invitations;
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const respondToInvitation = async (request: FastifyRequest<{ Params: { id: string }; Body: { status: 'accepted' | 'rejected' } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params; // Invitation ID
    const { status } = request.body;
    const userId = (request as any).user.id;

    const invitation = await workspaceRepository.findInvitationById(id);
    if (!invitation || invitation.inviteeId !== userId) {
      return reply.status(404).send({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return reply.status(400).send({ error: 'Invitation already processed' });
    }

    await workspaceRepository.updateInvitationStatus(id, status);

    if (status === 'accepted') {
      await workspaceRepository.addMemberToWorkspace(invitation.workspaceId, userId, invitation.role);
    }

    return { success: true };
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const removeMember = async (request: FastifyRequest<{ Params: { id: string; userId: string } }>, reply: FastifyReply) => {
  try {
    const { id, userId } = request.params;
    const requesterId = (request as any).user.id;

    // 1. Check if requester is admin
    const requesterRole = await workspaceRepository.getMemberRole(id, requesterId);
    if (requesterRole !== 'admin') {
      return reply.status(403).send({ error: 'Only admins can remove members' });
    }

    // 2. Prevent self-removal
    if (requesterId === userId) {
      return reply.status(400).send({ error: 'Admins cannot remove themselves' });
    }

    // 3. Remove member
    await workspaceRepository.removeMemberFromWorkspace(id, userId);
    return { success: true };
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};

export const deleteWorkspace = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const requesterId = (request as any).user.id;

    // Admin-only check
    const requesterRole = await workspaceRepository.getMemberRole(id, requesterId);
    if (requesterRole !== 'admin') {
      return reply.status(403).send({ error: 'Only admins can delete workspaces' });
    }

    await workspaceRepository.deleteWorkspace(id);
    return reply.status(200).send({ success: true });
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
};
