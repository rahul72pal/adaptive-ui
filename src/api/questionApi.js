import { apiClient } from './client';

export const questionApi = {
  generateQuestion: async ({ topic, concept_id = 'fundamentals', concept_type = 'conceptual', difficulty = 3 }) => {
    try {
      const selectedTopic = (topic || 'javascript').toLowerCase();
      return await apiClient.post('/questions/generate', {
        topic: selectedTopic,
        concept_id,
        concept_type,
        difficulty,
      });
    } catch (err) {
      console.error('[questionApi.generateQuestion] API Error:', err);
      throw err;
    }
  },

  getQuestionBatch: async ({ topic, concept_id = 'fundamentals', concept_type = 'conceptual', difficulty = 3, count = 3 }) => {
    try {
      const selectedTopic = (topic || 'javascript').toLowerCase();
      return await apiClient.post('/questions/batch', {
        topic: selectedTopic,
        concept_id,
        concept_type,
        difficulty,
        count,
      });
    } catch (err) {
      console.error('[questionApi.getQuestionBatch] API Error:', err);
      throw err;
    }
  },

  submitAttempt: async ({ topic, concept_id = 'fundamentals', question_id, answer, difficulty = 1 }) => {
    try {
      const selectedTopic = (topic || 'javascript').toLowerCase();
      return await apiClient.post('/attempts/submit', {
        question_id,
        concept_id,
        topic: selectedTopic,
        difficulty: typeof difficulty === 'number' ? difficulty : 3,
        answer: String(answer),
      });
    } catch (err) {
      console.error('[questionApi.submitAttempt] API Error:', err);
      throw err;
    }
  }
};
