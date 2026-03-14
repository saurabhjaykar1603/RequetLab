import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { runQuery, getQuery, getSingleQuery } from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- COLLECTIONS ---

app.get('/api/collections', async (req, res) => {
  try {
    const collections = await getQuery('SELECT * FROM collections ORDER BY createdAt DESC');
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/collections', async (req, res) => {
  try {
    const { name, userId } = req.body;
    const id = uuidv4();
    await runQuery('INSERT INTO collections (id, name, userId) VALUES (?, ?, ?)', [id, name, userId || '']);
    const newCollection = await getSingleQuery('SELECT * FROM collections WHERE id = ?', [id]);
    res.status(201).json(newCollection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    await runQuery('UPDATE collections SET name = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [name, id]);
    const updatedCollection = await getSingleQuery('SELECT * FROM collections WHERE id = ?', [id]);
    res.json(updatedCollection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery('DELETE FROM collections WHERE id = ?', [id]);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- FOLDERS ---

app.get('/api/folders', async (req, res) => {
  try {
    const { collectionId } = req.query;
    let folders;
    if (collectionId) {
      folders = await getQuery('SELECT * FROM folders WHERE collectionId = ? ORDER BY createdAt ASC', [collectionId]);
    } else {
      folders = await getQuery('SELECT * FROM folders ORDER BY createdAt ASC');
    }
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/folders', async (req, res) => {
  try {
    const { name, collectionId } = req.body;
    const id = uuidv4();
    await runQuery('INSERT INTO folders (id, name, collectionId) VALUES (?, ?, ?)', [id, name, collectionId]);
    const newFolder = await getSingleQuery('SELECT * FROM folders WHERE id = ?', [id]);
    res.status(201).json(newFolder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/folders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    await runQuery('UPDATE folders SET name = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [name, id]);
    const updatedFolder = await getSingleQuery('SELECT * FROM folders WHERE id = ?', [id]);
    res.json(updatedFolder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/folders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery('DELETE FROM folders WHERE id = ?', [id]);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- REQUESTS ---

app.get('/api/requests', async (req, res) => {
  try {
    const { collectionId, folderId } = req.query;
    let requests;
    if (folderId) {
      requests = await getQuery('SELECT * FROM requests WHERE folderId = ? ORDER BY createdAt ASC', [folderId]);
    } else if (collectionId) {
      requests = await getQuery('SELECT * FROM requests WHERE collectionId = ? AND (folderId IS NULL OR folderId = "") ORDER BY createdAt ASC', [collectionId]);
    } else {
      requests = await getQuery('SELECT * FROM requests ORDER BY createdAt ASC');
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
});

app.post('/api/requests', async (req, res) => {
  try {
    const { name, method, url, headers, body, params, auth, preRequestScript, testScript, folderId, collectionId } = req.body;
    const id = uuidv4();
    
    const headersStr = headers ? JSON.stringify(headers) : JSON.stringify([]);
    const paramsStr = params ? JSON.stringify(params) : JSON.stringify([]);
    const bodyStr = body ? JSON.stringify(body) : null;
    const authStr = auth ? JSON.stringify(auth) : JSON.stringify({});

    await runQuery(
      `INSERT INTO requests (id, name, method, url, headers, body, params, auth, preRequestScript, testScript, folderId, collectionId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, method || 'GET', url || '', headersStr, bodyStr, paramsStr, authStr, preRequestScript || '', testScript || '', folderId || null, collectionId]
    );
    
    const newRequest = await getSingleQuery('SELECT * FROM requests WHERE id = ?', [id]);
    newRequest.headers = JSON.parse(newRequest.headers);
    newRequest.params = JSON.parse(newRequest.params);
    newRequest.body = newRequest.body ? JSON.parse(newRequest.body) : null;
    newRequest.auth = JSON.parse(newRequest.auth);
    
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, method, url, headers, body, params, auth, preRequestScript, testScript, folderId, collectionId } = req.body;
    
    const updates = [];
    const values = [];
    
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (method !== undefined) { updates.push('method = ?'); values.push(method); }
    if (url !== undefined) { updates.push('url = ?'); values.push(url); }
    if (headers !== undefined) { updates.push('headers = ?'); values.push(JSON.stringify(headers)); }
    if (body !== undefined) { updates.push('body = ?'); values.push(body ? JSON.stringify(body) : null); }
    if (params !== undefined) { updates.push('params = ?'); values.push(JSON.stringify(params)); }
    if (auth !== undefined) { updates.push('auth = ?'); values.push(JSON.stringify(auth)); }
    if (preRequestScript !== undefined) { updates.push('preRequestScript = ?'); values.push(preRequestScript); }
    if (testScript !== undefined) { updates.push('testScript = ?'); values.push(testScript); }
    if (folderId !== undefined) { updates.push('folderId = ?'); values.push(folderId); }
    if (collectionId !== undefined) { updates.push('collectionId = ?'); values.push(collectionId); }
    
    if (updates.length > 0) {
      updates.push('updatedAt = CURRENT_TIMESTAMP');
      values.push(id);
      await runQuery(`UPDATE requests SET ${updates.join(', ')} WHERE id = ?`, values);
    }
    
    const updatedRequest = await getSingleQuery('SELECT * FROM requests WHERE id = ?', [id]);
    
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
});

app.delete('/api/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runQuery('DELETE FROM requests WHERE id = ?', [id]);
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ENVIRONMENTS ---

app.get('/api/environments', async (req, res) => {
  try {
    const environments = await getQuery('SELECT * FROM environments ORDER BY createdAt DESC');
    res.json(environments.map(e => ({
      ...e,
      variables: e.variables ? JSON.parse(e.variables) : {}
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/environments', async (req, res) => {
  try {
    const { name, variables } = req.body;
    const id = uuidv4();
    await runQuery(
      'INSERT INTO environments (id, name, variables) VALUES (?, ?, ?)',
      [id, name, variables ? JSON.stringify(variables) : JSON.stringify({})]
    );
    const newEnv = await getSingleQuery('SELECT * FROM environments WHERE id = ?', [id]);
    newEnv.variables = JSON.parse(newEnv.variables);
    res.status(201).json(newEnv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PROXY EXECUTION ---

app.post('/api/proxy', async (req, res) => {
  try {
    const { url, method, headers, params, body } = req.body;
    const startTime = Date.now();
    
    // Construct final URL with params
    let finalUrl = url;
    if (params && Array.isArray(params)) {
      const urlObj = new URL(url.startsWith('http') ? url : `http://${url}`);
      params.forEach(p => {
        if (p.key && p.value) urlObj.searchParams.append(p.key, p.value);
      });
      finalUrl = urlObj.toString();
    }

    const fetchHeaders = new Headers();
    if (headers && Array.isArray(headers)) {
      headers.forEach(h => { 
        if (h.key && h.value) fetchHeaders.append(h.key, h.value);
      });
    }

    const options = {
      method: method || 'GET',
      headers: fetchHeaders,
    };

    if (method !== 'GET' && method !== 'HEAD' && body) {
      if (body.type === 'json' && body.content) {
        options.body = body.content;
        if (!fetchHeaders.has('Content-Type')) {
          fetchHeaders.append('Content-Type', 'application/json');
        }
      }
    }

    const response = await fetch(finalUrl, options);
    const endTime = Date.now();
    
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const bodyText = await response.text();
    let parsedBody = bodyText;
    try { 
      parsedBody = JSON.parse(bodyText); 
    } catch(e) {}

    res.json({
      status: response.status,
      statusText: response.statusText,
      time: endTime - startTime,
      size: bodyText.length,
      headers: responseHeaders,
      data: parsedBody
    });
  } catch (error) {
    const time = Date.now() - (req.body._startTime || Date.now());
    res.json({
      status: 0,
      statusText: 'Error',
      time,
      size: 0,
      headers: {},
      data: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
