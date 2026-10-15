import { apiClient } from './client';

export const learningApi = {
  generatePath: async ({ topic, target_level = 'expert', diagnostic_session_id = null, language = 'python', explanation_language = 'english' }) => {
    try {
      // FastAPI GeneratePathSchema accepts { topic: str, target_level: str, diagnostic_session_id: Optional[str], language: Optional[str], explanation_language: Optional[str] }
      return await apiClient.post('/learning/generate-path', {
        topic: topic.toLowerCase(),
        target_level: target_level.toLowerCase(),
        diagnostic_session_id: diagnostic_session_id || null,
        language,
        explanation_language,
      }, { timeout: 180000 });
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

  completeLevel: async ({ learning_path_id }) => {
    try {
      return await apiClient.post('/learning/complete-level', {
        learning_path_id,
      });
    } catch (err) {
      console.error('[learningApi.completeLevel] API Error:', err);
      throw err;
    }
  },

  completeNode: async ({ topic, concept_id, learning_path_id = null }) => {
    try {
      return await apiClient.post('/learning/complete-node', {
        topic: topic.toLowerCase(),
        concept_id,
        learning_path_id: learning_path_id || null,
        graph_id: learning_path_id || null,
      });
    } catch (err) {
      console.error('[learningApi.completeNode] API Error:', err);
      throw err;
    }
  },

  getLesson: async ({ topic, concept_id, level = 'beginner', pattern = 'none', prerequisites = [], language = 'python', explanation_language = 'english' }) => {
    try {
      return await apiClient.post('/learning/lesson', {
        topic: topic.toLowerCase(),
        concept_id,
        level,
        pattern,
        prerequisites,
        language,
        explanation_language,
      });
    } catch (err) {
      console.error('[learningApi.getLesson] REST Error:', err);
      throw err;
    }
  },

  getLessonOverview: async ({ topic, concept_id, level = 'beginner', pattern = 'none', prerequisites = [], language = 'python', explanation_language = 'english' }) => {
    try {
      return await apiClient.post('/learning/lesson/overview', {
        topic: topic.toLowerCase(),
        concept_id,
        level,
        pattern,
        prerequisites,
        language,
        explanation_language,
      });
    } catch (err) {
      console.error('[learningApi.getLessonOverview] REST Error:', err);
      throw err;
    }
  },

  getLessonDeepDive: async ({ topic, concept_id, level = 'beginner', pattern = 'none', prerequisites = [], language = 'python', explanation_language = 'english' }) => {
    try {
      return await apiClient.post('/learning/lesson/deep-dive', {
        topic: topic.toLowerCase(),
        concept_id,
        level,
        pattern,
        prerequisites,
        language,
        explanation_language,
      });
    } catch (err) {
      console.error('[learningApi.getLessonDeepDive] REST Error:', err);
      throw err;
    }
  },

  getLessonStream: async ({ topic, concept_id, level = 'beginner', pattern = 'none', prerequisites = [], language = 'python', explanation_language = 'english', force_regenerate = false }, onEvent, onError) => {
    const { streamFetch } = await import('./streamClient');
    return streamFetch(
      '/learning/lesson/stream',
      {
        topic: topic.toLowerCase(),
        concept_id,
        level,
        pattern,
        prerequisites,
        language,
        explanation_language,
        force_regenerate,
      },
      onEvent,
      onError
    );
  },

  regenerateLessonStream: async ({ topic, concept_id, level = 'beginner', pattern = 'none', prerequisites = [], language = 'python', explanation_language = 'english' }, onEvent, onError) => {
    const { streamFetch } = await import('./streamClient');
    return streamFetch(
      '/learning/lesson/regenerate/stream',
      {
        topic: topic.toLowerCase(),
        concept_id,
        level,
        pattern,
        prerequisites,
        language,
        explanation_language,
        force_regenerate: true,
      },
      onEvent,
      onError
    );
  },

  regenerateLesson: async ({ topic, concept_id, level = 'beginner', pattern = 'none', prerequisites = [], language = 'python', explanation_language = 'english' }) => {
    try {
      return await apiClient.post('/learning/lesson/regenerate', {
        topic: topic.toLowerCase(),
        concept_id,
        level,
        pattern,
        prerequisites,
        language,
        explanation_language,
        force_regenerate: true,
      });
    } catch (err) {
      console.error('[learningApi.regenerateLesson] API Error:', err);
      throw err;
    }
  },

  submitCheckpointAnswer: async ({ topic, concept_id, input_id, answer }) => {
    try {
      return await apiClient.post('/learning/lesson/checkpoint-answer', {
        topic: topic.toLowerCase(),
        concept_id,
        input_id,
        answer,
      });
    } catch (err) {
      console.error('[learningApi.submitCheckpointAnswer] API Error:', err);
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
  },

  verifyPractice: async ({ user_id, topic, concept_id, passed }) => {
    try {
      return await apiClient.post('/learning/verify-practice', {
        user_id,
        topic: topic.toLowerCase(),
        concept_id,
        passed,
      });
    } catch (err) {
      console.error('[learningApi.verifyPractice] API Error:', err);
      throw err;
    }
  }
};

