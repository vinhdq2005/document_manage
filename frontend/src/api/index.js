import { request, uploadForm } from './client';

export const authApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', json: { email, password }, auth: false }),
  me: () => request('/auth/me'),
};

export const documentsApi = {
  list: (params) => request('/documents', { params }),
  get: (id) => request(`/documents/${id}`),
  update: (id, data) => request(`/documents/${id}`, { method: 'PATCH', json: data }),
  remove: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
  download: (id) => request(`/documents/${id}/download`, { blob: true }),
  upload: (fields, file, onProgress) => {
    const form = new FormData();
    form.append('title', fields.title);
    if (fields.description) form.append('description', fields.description);
    if (fields.category) form.append('category', fields.category);
    form.append('file', file);
    return uploadForm('/documents', form, onProgress);
  },
  // Chỉ admin
  adminList: () => request('/admin/documents'),
  grants: (id) => request(`/documents/${id}/grants`),
  grant: (id, userId) => request(`/documents/${id}/grants`, { method: 'POST', json: { user_id: userId } }),
  revoke: (id, userId) => request(`/documents/${id}/grants/${userId}`, { method: 'DELETE' }),
};

export const departmentsApi = {
  list: () => request('/departments'),
  create: (name) => request('/departments', { method: 'POST', json: { name } }),
  update: (id, name) => request(`/departments/${id}`, { method: 'PATCH', json: { name } }),
};

export const usersApi = {
  list: () => request('/users'),
  create: (data) => request('/users', { method: 'POST', json: data }),
  update: (id, data) => request(`/users/${id}`, { method: 'PATCH', json: data }),
};
