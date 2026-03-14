import * as requestRepository from '../models/requestRepository.js';

export const getRequests = async (request, reply) => {
  try {
    const { collectionId, folderId } = request.query || {};
    let requests;
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
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

export const createRequest = async (request, reply) => {
  try {
    const newRequest = await requestRepository.createRequest(request.body);
    
    newRequest.headers = JSON.parse(newRequest.headers);
    newRequest.params = JSON.parse(newRequest.params);
    newRequest.body = newRequest.body ? JSON.parse(newRequest.body) : null;
    newRequest.auth = JSON.parse(newRequest.auth);
    
    reply.status(201).send(newRequest);
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

export const updateRequest = async (request, reply) => {
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
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};

export const deleteRequest = async (request, reply) => {
  try {
    const { id } = request.params;
    await requestRepository.deleteRequest(id);
    return { success: true, id };
  } catch (error) {
    reply.status(500).send({ error: error.message });
  }
};
