export const executeProxy = async (req, res) => {
  try {
    const { url, method, headers, params, body } = req.body;
    const startTime = Date.now();
    
    // Helper to replace {{VAR}} with process.env.VAR
    const replaceEnvVars = (str) => {
      if (!str || typeof str !== 'string') return str;
      return str.replace(/\{\{([^}]+)\}\}/g, (match, p1) => {
        return process.env[p1] !== undefined ? process.env[p1] : match;
      });
    };

    // Construct final URL with params
    let finalUrl = replaceEnvVars(url);
    if (params && Array.isArray(params)) {
      const urlObj = new URL(finalUrl.startsWith('http') ? finalUrl : `http://${finalUrl}`);
      params.forEach(p => {
        if (p.key && p.value) urlObj.searchParams.append(p.key, replaceEnvVars(p.value));
      });
      finalUrl = urlObj.toString();
    }

    const fetchHeaders = new Headers();
    if (headers && Array.isArray(headers)) {
      headers.forEach(h => { 
        if (h.key && h.value) fetchHeaders.append(h.key, replaceEnvVars(h.value));
      });
    }

    const options = {
      method: method || 'GET',
      headers: fetchHeaders,
    };

    if (method !== 'GET' && method !== 'HEAD' && body) {
      if (body.type === 'json' && body.content) {
        options.body = replaceEnvVars(body.content);
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
};
