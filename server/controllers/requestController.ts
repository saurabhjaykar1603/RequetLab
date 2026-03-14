import { FastifyRequest, FastifyReply } from 'fastify';
import * as requestRepository from '../repositories/requestRepository.ts';
import { RequestEntity } from '../interfaces/request/Request.ts';

export const getRequests = async (request: FastifyRequest<{ Querystring: { collectionId?: string, folderId?: string } }>, reply: FastifyReply) => {
  try {
    const { collectionId, folderId } = request.query;
    let requests: RequestEntity[];
    if (folderId) {
      requests = await requestRepository.getRequestsByFolderId(folderId);
    } else if (collectionId) {
      requests = await requestRepository.getRequestsByCollectionId(collectionId);
    } else {
      requests = await requestRepository.getAllRequests();
    }
    
    // Parse JSON fields
    const parsedRequests = requests.map(r => ({
      ...r,
      headers: r.headers ? JSON.parse(r.headers) : [],
      params: r.params ? JSON.parse(r.params) : [],
      body: r.body ? JSON.parse(r.body) : null,
      auth: r.auth ? JSON.parse(r.auth) : {}
    }));
    
    return parsedRequests;
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const createRequest = async (request: FastifyRequest<{ Body: Partial<RequestEntity> & { collectionId: string } }>, reply: FastifyReply) => {
  try {
    const newRequest = await requestRepository.createRequest(request.body);
    
    if (newRequest) {
      newRequest.headers = newRequest.headers ? JSON.parse(newRequest.headers) : [];
      newRequest.params = newRequest.params ? JSON.parse(newRequest.params) : [];
      newRequest.body = newRequest.body ? JSON.parse(newRequest.body) : null;
      newRequest.auth = newRequest.auth ? JSON.parse(newRequest.auth) : {};
    }
    
    reply.status(201).send(newRequest);
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const updateRequest = async (request: FastifyRequest<{ Params: { id: string }; Body: Partial<RequestEntity> }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const updatedRequest = await requestRepository.updateRequest(id, request.body);
    
    if (updatedRequest) {
      updatedRequest.headers = updatedRequest.headers ? JSON.parse(updatedRequest.headers) : [];
      updatedRequest.params = updatedRequest.params ? JSON.parse(updatedRequest.params) : [];
      updatedRequest.body = updatedRequest.body ? JSON.parse(updatedRequest.body) : null;
      updatedRequest.auth = updatedRequest.auth ? JSON.parse(updatedRequest.auth) : {};
    }
    
    return updatedRequest;
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const deleteRequest = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    await requestRepository.deleteRequest(id);
    return { success: true, id };
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};
