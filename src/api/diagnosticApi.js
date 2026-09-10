import { apiClient } from './client';

export const diagnosticApi = {
  startDiagnostic: async ({ topic }) => {
    try {
      // FastAPI StartDiagnosticSchema accepts ONLY { topic: str }
      const data = await apiClient.post('/diagnostic/start', { topic }, { timeout: 60000 });
      return {
        session_id: data.session_id,
        status: data.is_complete ? 'completed' : 'active',
        current_turn: data.turns_used || 1,
        total_turns: 15,
        question: data.current_question || data.first_question || data.question,
        options: data.options || [],
        is_complete: data.is_complete || false,
        knowledge_profile: data.knowledge_profile || null,
      };
    } catch (err) {
      console.error('[diagnosticApi.startDiagnostic] API Error:', err);
      throw err;
    }
  },

  answerDiagnostic: async ({ session_id, answer, turn = 1 }) => {
    try {
      // FastAPI AnswerDiagnosticSchema accepts { session_id: str, answer: str }
      const data = await apiClient.post('/diagnostic/answer', { session_id, answer }, { timeout: 60000 });
      const currentTurn = data.turns_used || (turn + 1);
      const isComplete = Boolean(data.is_complete || data.status === 'completed' || currentTurn >= 15);

      return {
        session_id: data.session_id || session_id,
        status: isComplete ? 'completed' : 'active',
        current_turn: currentTurn,
        total_turns: 15,
        question: data.current_question || data.next_question || data.question,
        options: data.options || [],
        is_complete: isComplete,
        knowledge_profile: data.knowledge_profile || null,
      };
    } catch (err) {
      console.error('[diagnosticApi.answerDiagnostic] API Error:', err);
      throw err;
    }
  },

  optOutDiagnostic: async (session_id) => {
    try {
      return await apiClient.post('/diagnostic/opt-out', { session_id });
    } catch (err) {
      console.error('[diagnosticApi.optOutDiagnostic] API Error:', err);
      throw err;
    }
  },

  getDiagnosticState: async (session_id) => {
    try {
      return await apiClient.get(`/diagnostic/${session_id}`);
    } catch (err) {
      console.error('[diagnosticApi.getDiagnosticState] API Error:', err);
      throw err;
    }
  }
};
