import * as requestRepository from '../repositories/requestRepository.js';

export const getRequests = async (req, res) => {
  try {
    const { collectionId, folderId } = req.query;
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
    
    res.json(parsedRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createRequest = async (req, res) => {
  try {
    const newRequest = await requestRepository.createRequest(req.body);
    
    newRequest.headers = JSON.parse(newRequest.headers);
    newRequest.params = JSON.parse(newRequest.params);
    newRequest.body = newRequest.body ? JSON.parse(newRequest.body) : null;
    newRequest.auth = JSON.parse(newRequest.auth);
    
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRequest = await requestRepository.updateRequest(id, req.body);
    
    if (updatedRequest) {
      updatedRequest.headers = updatedRequest.headers ? JSON.parse(updatedRequest.headers) : [];
      updatedRequest.params = updatedRequest.params ? JSON.parse(updatedRequest.params) : [];
      updatedRequest.body = updatedRequest.body ? JSON.parse(updatedRequest.body) : null;
      updatedRequest.auth = updatedRequest.auth ? JSON.parse(updatedRequest.auth) : {};
    }
    
    res.json(updatedRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await requestRepository.deleteRequest(id);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
