import { apiClient } from './client';

export const selectOrCreateTopicApi = async (topicPayload) => {
  // Support both legacy string parameter and structured { topic, category_id }
  const payload = typeof topicPayload === 'string'
    ? { topic: topicPayload }
    : { topic: topicPayload.topic_id || topicPayload.topic, category_id: topicPayload.category_id };
  return await apiClient.post('/topics/select', payload);
};

export const getCatalogCategoriesApi = async () => {
  return await apiClient.get('/topics/categories');
};

export const getCatalogTopicsApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.category_id) query.append('category_id', params.category_id);
  if (params.kind) query.append('kind', params.kind);
  if (params.assessment_mode) query.append('assessment_mode', params.assessment_mode);
  if (params.level) query.append('level', params.level);
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', params.page);
  if (params.page_size) query.append('page_size', params.page_size);

  const qs = query.toString();
  return await apiClient.get(`/topics/catalog${qs ? `?${qs}` : ''}`);
};

export const getCatalogTopicByIdApi = async (topicId) => {
  return await apiClient.get(`/topics/catalog/${topicId}`);
};

export const resolveTopicApi = async ({ topic, category_id = null }) => {
  const query = new URLSearchParams({ topic });
  if (category_id) query.append('category_id', category_id);
  return await apiClient.get(`/topics/resolve?${query.toString()}`);
};

export const getUserTopicsApi = async () => {
  return await apiClient.get('/topics/user');
};

export const setTopicModeApi = async ({ topic, mode_choice, diagnostic_session_id = null, category_id = null }) => {
  return await apiClient.post('/topics/mode', { topic, mode_choice, diagnostic_session_id, category_id });
};

export const deleteUserTopicApi = async (topicSlug) => {
  return await apiClient.delete(`/topics/user/${topicSlug}`);
};
