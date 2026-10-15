import { apiClient } from './client';

export const diagnosticApi = {
  startDiagnostic: async ({ topic }) => {
    try {
      const data = await apiClient.post('/diagnostic/start', { topic }, { timeout: 180000 });
      return {
        session_id: data.session_id,
        status: data.is_complete ? 'completed' : 'active',
        current_turn: data.turn || data.turns_used || 1,
        total_turns: 15,
        question: data.current_question || data.first_question || data.question,
        options: data.options || [],
        is_complete: data.is_complete || false,
        knowledge_profile: data.knowledge_profile || null,
        messages: data.messages || [],
        turn_history: data.turn_history || [],
        is_resumed: data.is_resumed || false
      };
    } catch (err) {
      console.error('[diagnosticApi.startDiagnostic] API Error:', err);
      throw err;
    }
  },

  answerDiagnostic: async ({ session_id, answer, turn = 1, input_id = null }, onToken = null) => {
    const { streamFetch } = await import('./streamClient');
    return new Promise((resolve, reject) => {
      let evaluatedData = {};
      let questionTokens = [];
      let receivedInput = null;

      streamFetch(
        '/diagnostic/answer/stream',
        { session_id, answer, input_id },
        (data) => {
          if (!data) return;

          if (data.event === 'evaluated') {
            evaluatedData = {
              session_id,
              status: data.is_complete ? 'completed' : 'active',
              current_turn: data.turn,
              total_turns: 15,
              is_complete: data.is_complete,
              knowledge_profile: data.knowledge_profile,
              feedback: data.feedback || null,
              last_evaluated_concept: data.current_concept || data.concept || null,
            };
          } else if (data.event === 'text_delta') {
            questionTokens.push(data.delta);
            if (onToken) onToken(data.delta);
          } else if (data.event === 'question_token') {
            questionTokens.push(data.delta);
            if (onToken) onToken(data.delta);
          } else if (data.event === 'user_input') {
            receivedInput = data.input;
          } else if (data.event === 'message_end' || data.event === 'question_complete' || data.event === 'complete') {
            const currentTurn = data.payload?.turn || data.turn || evaluatedData.current_turn || (turn + 1);
            const isComplete = Boolean(
              (data.payload && data.payload.is_complete) ||
              data.is_complete ||
              evaluatedData.is_complete ||
              currentTurn >= 15
            );
            resolve({
              session_id: data.payload?.session_id || data.session_id || session_id,
              status: isComplete ? 'completed' : (data.status === 'awaiting_user' ? 'awaiting_user' : 'active'),
              current_turn: currentTurn,
              total_turns: 15,
              question: data.payload?.current_question || data.current_question || questionTokens.join('') || 'Diagnostic Question',
              options: data.options || (receivedInput && receivedInput.options ? receivedInput.options.map(o => o.label || o.text || o) : []),
              user_input: receivedInput || data.payload?.user_input || null,
              input_id: receivedInput?.input_id || data.payload?.input_id || null,
              is_complete: isComplete,
              knowledge_profile: data.payload?.knowledge_profile || data.knowledge_profile || evaluatedData.knowledge_profile || null,
              feedback: evaluatedData.feedback || data.payload?.feedback || data.feedback || null,
              last_evaluated_concept: evaluatedData.last_evaluated_concept || data.payload?.last_evaluated_concept || data.payload?.current_concept || null,
              turn_history: data.payload?.turn_history || data.turn_history || null,
            });
          } else if (data.event === 'error') {
            reject(new Error(data.message || 'Diagnostic stream error'));
          }
        },
        (err) => reject(err)
      );
    });
  },

  answerDiagnosticStream: async ({ session_id, answer, input_id = null }, onEvent, onError) => {
    const { streamFetch } = await import('./streamClient');
    return streamFetch(
      '/diagnostic/answer/stream',
      { session_id, answer, input_id },
      onEvent,
      onError
    );
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
  },

  getActiveDiagnosticSession: async (topic) => {
    try {
      return await apiClient.get(`/diagnostic/active/${topic}`);
    } catch (err) {
      console.error('[diagnosticApi.getActiveDiagnosticSession] API Error:', err);
      throw err;
    }
  }
};
