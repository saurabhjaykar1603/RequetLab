/**
 * Replaces placeholders like {{variable}} with their values from environment or globals.
 */
export const replaceVars = (str, activeEnv, globals) => {
  if (!str || typeof str !== 'string') return str;
  
  let res = str;
  // Match {{variable_name}}
  const regex = /{{(.*?)}}/g;
  res = res.replace(regex, (match, key) => {
    const trimmedKey = key.trim();
    // Priority: Active Env > Globals
    if (activeEnv && activeEnv.variables && activeEnv.variables[trimmedKey] !== undefined) {
      return activeEnv.variables[trimmedKey];
    }
    if (globals && globals[trimmedKey] !== undefined) {
      return globals[trimmedKey];
    }
    return match; // Return as is if not found
  });

  return res;
};

/**
 * Resolves all variables within a request object.
 * Returns a new request object with replaced values.
 */
export const resolveRequestVariables = (request, activeEnv, globals) => {
  if (!request) return null;

  const subUrl = replaceVars(request.url, activeEnv, globals);
  const subHeaders = (request.headers || []).map(h => ({ 
    ...h, 
    value: replaceVars(h.value, activeEnv, globals) 
  }));
  const subParams = (request.params || []).map(p => ({ 
    ...p, 
    value: replaceVars(p.value, activeEnv, globals) 
  }));
  
  let subBody = request.body;
  if (typeof request.body === 'string') {
    subBody = replaceVars(request.body, activeEnv, globals);
  } else if (typeof request.body === 'object' && request.body !== null) {
    if (request.body.type === 'json' && request.body.content) {
      subBody = { ...request.body, content: replaceVars(request.body.content, activeEnv, globals) };
    } else if (request.body.type === 'form-data' && Array.isArray(request.body.content)) {
      subBody = {
        ...request.body,
        content: request.body.content.map(f => ({ ...f, value: replaceVars(f.value, activeEnv, globals) }))
      };
    }
  }

  return {
    ...request,
    url: subUrl,
    headers: subHeaders,
    params: subParams,
    body: subBody
  };
};
