export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

function getToken() {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleRes(res) {
  const text = await res.text().catch(() => '');
  const payload = text ? parseSafeJson(text) : {};
  if (!res.ok) {
    const message = payload && payload.message ? payload.message : (payload.error || res.statusText || 'API error');
    throw new Error(message);
  }
  return payload || {};
}

function parseSafeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function buildUrl(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) {
      v.forEach(item => url.searchParams.append(k, item));
    } else {
      url.searchParams.append(k, String(v));
    }
  });
  return url.toString();
}

export const api = {
  auth: {
    register: (data) =>
      fetch(buildUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleRes),

    login: (data) =>
      fetch(buildUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleRes),

    me: () =>
      fetch(buildUrl('/auth/me'), {
        headers: { ...authHeaders() },
      }).then(handleRes),

    googleLogin: (token) =>
      fetch(buildUrl('/auth/google-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).then(handleRes),
  },

  projects: {
    list: ({ page = 1, limit = 50, q, status } = {}) =>
      fetch(buildUrl('/projects', { page, limit, q, status }), { headers: { ...authHeaders() } }).then(handleRes),

    create: (data) =>
      fetch(buildUrl('/projects'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data),
      }).then(handleRes),

    get: (id) =>
      fetch(buildUrl(`/projects/${id}`), { headers: { ...authHeaders() } }).then(handleRes),

    update: (id, data) =>
      fetch(buildUrl(`/projects/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data),
      }).then(handleRes),

    remove: (id) =>
      fetch(buildUrl(`/projects/${id}`), {
        method: 'DELETE',
        headers: { ...authHeaders() },
      }).then(handleRes),
  },

  tasks: {
    list: (params = {}) =>
      fetch(buildUrl('/tasks', params), { headers: { ...authHeaders() } }).then(handleRes),

    create: (data) =>
      fetch(buildUrl('/tasks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data),
      }).then(handleRes),

    get: (id) =>
      fetch(buildUrl(`/tasks/${id}`), { headers: { ...authHeaders() } }).then(handleRes),

    update: (id, data) =>
      fetch(buildUrl(`/tasks/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data),
      }).then(handleRes),

    remove: (id) =>
      fetch(buildUrl(`/tasks/${id}`), {
        method: 'DELETE',
        headers: { ...authHeaders() },
      }).then(handleRes),
  },

  dashboard: {
    overview: () => fetch(buildUrl('/dashboard/overview'), { headers: { ...authHeaders() } }).then(handleRes),
    stats: () => fetch(buildUrl('/dashboard/stats'), { headers: { ...authHeaders() } }).then(handleRes),
  },

  comments: {
    list: (taskId) =>
      fetch(buildUrl('/comments', { task: taskId }), { headers: { ...authHeaders() } }).then(handleRes),

    create: (data) =>
      fetch(buildUrl('/comments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data),
      }).then(handleRes),

    remove: (id) =>
      fetch(buildUrl(`/comments/${id}`), {
        method: 'DELETE',
        headers: { ...authHeaders() },
      }).then(handleRes),
  },
};
