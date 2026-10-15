import { apiClient } from './client';

export const selectOrCreateTopicApi = async (topic) => {
  return await apiClient.post('/topics/select', { topic });
};

export const getUserTopicsApi = async () => {
  return await apiClient.get('/topics/user');
};

export const setTopicModeApi = async ({ topic, mode_choice, diagnostic_session_id = null }) => {
  return await apiClient.post('/topics/mode', { topic, mode_choice, diagnostic_session_id });
};

export const deleteUserTopicApi = async (topicSlug) => {
  return await apiClient.delete(`/topics/user/${topicSlug}`);
};
