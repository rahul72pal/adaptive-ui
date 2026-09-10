import { apiClient } from './client';

export const learningApi = {
  generatePath: async ({ topic, target_level = 'expert', diagnostic_session_id = null }) => {
    try {
      // FastAPI GeneratePathSchema accepts { topic: str, target_level: str, diagnostic_session_id: Optional[str] }
      return await apiClient.post('/learning/generate-path', {
        topic: topic.toLowerCase(),
        target_level: target_level.toLowerCase(),
        diagnostic_session_id: diagnostic_session_id || null,
      }, { timeout: 60000 });
    } catch (err) {
      console.error('[learningApi.generatePath] API Error:', err);
      throw err;
    }
  },

  getLearningPath: async ({ user_id, topic }) => {
    try {
      return await apiClient.get(`/learning/${user_id}/${topic.toLowerCase()}`);
    } catch (err) {
      console.error('[learningApi.getLearningPath] API Error:', err);
      throw err;
    }
  },

  reteachConcept: async ({ topic, concept_id, strategies_tried = [], consecutive_failures = 1 }) => {
    try {
      return await apiClient.post('/learning/reteach', {
        topic: topic.toLowerCase(),
        concept_id,
        strategies_tried,
        consecutive_failures,
      });
    } catch (err) {
      console.error('[learningApi.reteachConcept] API Error:', err);
      throw err;
    }
  }
};
