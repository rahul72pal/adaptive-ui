import { apiClient } from './client';
import { streamFetch } from './streamClient';

export const questionApi = {
  /**
   * Generates or retrieves a single question non-streamingly in one API request.
   * Endpoint: POST /api/questions/generate
   */
  generateQuestion: async ({ topic, concept_id = 'fundamentals', concept_type = 'conceptual', difficulty = 3, language = 'python', explanation_language = 'english' }) => {
    try {
      const selectedTopic = (topic || 'javascript').toLowerCase();
      const payload = {
        topic: selectedTopic,
        concept_id,
        concept_type,
        difficulty: typeof difficulty === 'number' ? difficulty : 3,
        language,
        explanation_language,
      };
      return await apiClient.post('/questions/generate', payload);
    } catch (err) {
      console.error('[questionApi.generateQuestion] API Error:', err);
      throw err;
    }
  },

  /**
   * Streams a question through the split tool pipeline.
   * Events: message_start | token | question_ready | meta | test_cases |
   *         complete | cached | error
   * Endpoint: POST /api/questions/generate/stream
   */
  generateQuestionStream: async (
    { topic, concept_id = 'fundamentals', concept_type = 'conceptual', difficulty = 3, language = 'python', explanation_language = 'english' },
    onEvent,
    onError
  ) => {
    const payload = {
      topic: (topic || 'javascript').toLowerCase(),
      concept_id,
      concept_type,
      difficulty: typeof difficulty === 'number' ? difficulty : 3,
      language,
      explanation_language,
    };
    return streamFetch('/questions/generate/stream', payload, onEvent, onError);
  },

  /**
   * Legacy compatibility wrapper for non-streaming question generation.
   */
  getQuestionStream: async (params, onEvent, onError) => {
    try {
      const question = await questionApi.generateQuestion(params);
      if (onEvent) {
        onEvent({ event: 'complete', question });
      }
      return question;
    } catch (err) {
      if (onError) onError?.(err);
      throw err;
    }
  },

  getQuestionBatch: async ({ topic, concept_id = 'fundamentals', concept_type = 'conceptual', difficulty = 3, count = 3, language = 'python', explanation_language = 'english' }) => {
    try {
      const selectedTopic = (topic || 'javascript').toLowerCase();
      return await apiClient.post('/questions/batch', {
        topic: selectedTopic,
        concept_id,
        concept_type,
        difficulty,
        count,
        language,
        explanation_language,
      });
    } catch (err) {
      console.error('[questionApi.getQuestionBatch] API Error:', err);
      throw err;
    }
  },

  submitAttempt: async ({
    topic,
    concept_id = 'fundamentals',
    question_id,
    answer,
    difficulty = 1,
    current_question_count = 1,
    target_question_count = 3,
    test_run_count = 0,
    test_cases_passed = null,
    total_test_cases = null,
    language = 'python',
    explanation_language = 'english',
  }) => {
    try {
      const selectedTopic = (topic || 'javascript').toLowerCase();
      return await apiClient.post('/attempts/submit', {
        question_id,
        concept_id,
        topic: selectedTopic,
        difficulty: typeof difficulty === 'number' ? difficulty : 3,
        answer: String(answer),
        current_question_count,
        target_question_count,
        test_run_count,
        test_cases_passed,
        total_test_cases,
        language,
        explanation_language,
      });
    } catch (err) {
      console.error('[questionApi.submitAttempt] API Error:', err);
      throw err;
    }
  }
};


