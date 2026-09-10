import { apiClient } from './client';

export const progressApi = {
  getProgress: async ({ user_id, topic }) => {
    try {
      return await apiClient.get(`/progress/${user_id}/${topic.toLowerCase()}`);
    } catch (err) {
      console.error('[progressApi.getProgress] API Error:', err);
      throw err;
    }
  }
};
