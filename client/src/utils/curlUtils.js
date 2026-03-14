/**
 * Utility to generate a cURL command from a request object
 */
export const generateCurl = (request) => {
  if (!request || !request.url) return '';

  let curl = `curl --location '${request.url}'`;
  curl += ` \\\n--request ${request.method}`;

  // Headers
  if (request.headers && request.headers.length > 0) {
    request.headers.forEach(h => {
      if (h.key && h.value) {
        curl += ` \\\n--header '${h.key}: ${h.value}'`;
      }
    });
  }

  // Body
  if (request.body && request.body.type === 'json' && request.body.content) {
    curl += ` \\\n--header 'Content-Type: application/json'`;
    curl += ` \\\n--data-raw '${request.body.content.replace(/'/g, "'\\''")}'`;
  }

  return curl;
};

/**
 * Utility to parse a cURL command string into a request state object
 */
export const parseCurl = (curlString) => {
  if (!curlString || !curlString.trim().toLowerCase().startsWith('curl')) {
    return null;
  }

  const result = {
    method: 'GET',
    url: '',
    headers: [],
    body: null,
    params: []
  };

  // Basic regex-based parsing for common curl patterns
  // Note: Handling all edge cases of shell quoting is complex, this is a robust best-effort implementation

  // Extract URL (usually the first non-option argument or after --location / -L)
  const urlMatch = curlString.match(/(?:--location|--url|'|")?\s*((?:https?:\/\/|{{)[^\s'"]+)/i);
  if (urlMatch) {
    result.url = urlMatch[1].replace(/['"]/g, '');
  }

  // Extract Method
  const methodMatch = curlString.match(/(?:-X|--request)\s+['"]?([A-Z]+)['"]?/i);
  if (methodMatch) {
    result.method = methodMatch[1].toUpperCase();
  }

  // Extract Headers
  const headerRegex = /(?:-H|--header)\s+(['"])(.*?)\1/g;
  let match;
  while ((match = headerRegex.exec(curlString)) !== null) {
    const headerStr = match[2];
    const colonIndex = headerStr.indexOf(':');
    if (colonIndex !== -1) {
      const key = headerStr.substring(0, colonIndex).trim();
      const value = headerStr.substring(colonIndex + 1).trim();
      result.headers.push({ key, value, description: '' });
      
      // Auto-detect method if body headers are present
      if (key.toLowerCase() === 'content-type' && result.method === 'GET') {
        // Leave as GET for now, body extraction will confirm
      }
    }
  }

  // Extract Body
  const bodyRegex = /(?:-d|--data|--data-raw|--data-binary)\s+(['"])([\s\S]*?)\1/g;
  const bodyMatch = bodyRegex.exec(curlString);
  if (bodyMatch) {
    const content = bodyMatch[2];
    result.body = {
      type: 'json', // Default to JSON for now
      content: content
    };
    if (result.method === 'GET') result.method = 'POST'; // Common default if body exists
  }

  // Clean up URL if it has params, and populate params tab
  if (result.url.includes('?')) {
    const [baseUrl, queryStr] = result.url.split('?');
    result.url = baseUrl;
    const urlParams = new URLSearchParams(queryStr);
    urlParams.forEach((value, key) => {
      result.params.push({ key, value, description: '' });
    });
  }

  return result;
};
