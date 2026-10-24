import { apiClient } from './client';

export const llmConfigApi = {
  getConfig: async () => apiClient.get('/user/llm-config'),

  saveConfig: async (payload) => apiClient.put('/user/llm-config', payload),

  deleteConfig: async () => apiClient.delete('/user/llm-config'),
};
