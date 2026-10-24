import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sessionId: null,
  status: 'idle', // idle, chatting, completed, skipped
  turn: 1,
  totalTurns: 15,
  messages: [], // { id, sender: 'ai' | 'user', text: string, options?: string[], userInput?: any, timestamp: string, isStreaming?: boolean }
  turnHistory: [], // [{ turn: number, question: string, userAnswer: string, feedback: string, concept?: string }]
  knowledgeProfile: null, // { [conceptId]: { confidence: number, status: string, feedback?: string } }
  currentConcept: null,
  lastFeedback: null,
  lastEvaluatedConcept: null,
  isStreaming: false,
  streamingStatus: 'idle', // 'idle' | 'evaluating' | 'generating'
};

const diagnosticSlice = createSlice({
  name: 'diagnostic',
  initialState,
  reducers: {
    startSession: (state, action) => {
      state.sessionId = action.payload.sessionId;
      state.status = 'chatting';
      state.turn = action.payload.turn || 1;
      state.knowledgeProfile = action.payload.knowledgeProfile || null;
      state.currentConcept = action.payload.currentConcept || null;
      state.lastFeedback = null;
      state.lastEvaluatedConcept = null;
      state.isStreaming = false;
      state.streamingStatus = 'idle';
      state.turnHistory = [];
      const firstQ = action.payload.firstQuestion || action.payload.question || "Let's begin your 15-message diagnostic assessment.";
      state.messages = [
        {
          id: 'm_0',
          sender: 'ai',
          text: firstQ,
          options: action.payload.options || [],
          userInput: action.payload.user_input || action.payload.userInput || null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ];
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    startStreamingAssistantMessage: (state, action) => {
      state.isStreaming = true;
      state.streamingStatus = action.payload?.status || 'evaluating';
      state.messages.push({
        id: action.payload?.id || `m_${state.messages.length}`,
        sender: 'ai',
        text: '',
        options: [],
        userInput: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStreaming: true,
      });
    },
    setStreamingStatus: (state, action) => {
      state.streamingStatus = action.payload;
    },
    appendStreamToken: (state, action) => {
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.sender === 'ai') {
        lastMsg.text = (lastMsg.text || '') + action.payload;
        lastMsg.isStreaming = true;
      }
    },
    updateLiveEvaluation: (state, action) => {
      const { knowledgeProfile, feedback, currentConcept, lastEvaluatedConcept, turn } = action.payload;
      if (knowledgeProfile) {
        state.knowledgeProfile = knowledgeProfile;
      }
      if (currentConcept) {
        state.currentConcept = currentConcept;
      }
      if (feedback) {
        state.lastFeedback = feedback;
      }
      if (lastEvaluatedConcept) {
        state.lastEvaluatedConcept = lastEvaluatedConcept;
      }
      if (turn) {
        state.turn = turn;
      }
    },
    finishStreamingAssistantMessage: (state, action) => {
      state.isStreaming = false;
      state.streamingStatus = 'idle';
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.sender === 'ai') {
        lastMsg.isStreaming = false;
        if (action.payload?.text) {
          lastMsg.text = action.payload.text;
        }
        if (action.payload?.options) {
          lastMsg.options = action.payload.options;
        }
        if (action.payload?.userInput) {
          lastMsg.userInput = action.payload.userInput;
        }
      }
    },
    recordTurnHistory: (state, action) => {
      const { turn, question, userAnswer, feedback, concept } = action.payload;
      state.turnHistory.push({
        turn: turn || state.turnHistory.length + 1,
        question,
        userAnswer,
        feedback: feedback || 'Assessment recorded by Lumina AI engine.',
        concept: concept || state.lastEvaluatedConcept || null,
      });
    },
    updateTurn: (state, action) => {
      state.turn = action.payload.turn;
      if (action.payload.knowledgeProfile) {
        state.knowledgeProfile = action.payload.knowledgeProfile;
      }
      if (action.payload.currentConcept) {
        state.currentConcept = action.payload.currentConcept;
      }
      if (action.payload.feedback) {
        state.lastFeedback = action.payload.feedback;
      }
      if (action.payload.lastEvaluatedConcept) {
        state.lastEvaluatedConcept = action.payload.lastEvaluatedConcept;
      }
      const qText = action.payload.nextQuestion || action.payload.question;
      if (qText) {
        state.messages.push({
          id: `m_${state.messages.length}`,
          sender: 'ai',
          text: qText,
          options: action.payload.options || [],
          userInput: action.payload.user_input || action.payload.userInput || null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    },
    completeDiagnostic: (state, action) => {
      state.status = 'completed';
      state.isStreaming = false;
      state.streamingStatus = 'idle';
      state.knowledgeProfile = action.payload || state.knowledgeProfile || {
        summary: '15-message diagnostic session complete! Custom concept graph & learning path created.'
      };
    },
    skipDiagnostic: (state) => {
      state.status = 'skipped';
      state.isStreaming = false;
      state.streamingStatus = 'idle';
      state.knowledgeProfile = {
        summary: 'Opted out as complete beginner. Learning path starts from absolute fundamentals.'
      };
    },
    loadExistingSession: (state, action) => {
      const { sessionId, turn, turns_used, is_complete, knowledge_profile, messages, turn_history, current_question, current_concept } = action.payload;
      state.sessionId = sessionId;
      state.status = is_complete ? 'completed' : 'chatting';
      state.turn = turn || turns_used || 1;
      state.knowledgeProfile = knowledge_profile || null;
      state.turnHistory = turn_history || [];
      state.currentConcept = current_concept || null;
      state.isStreaming = false;
      state.streamingStatus = 'idle';

      // Restore last feedback and evaluated concept from turn history or knowledge profile
      if (turn_history && turn_history.length > 0) {
        const lastTurn = turn_history[turn_history.length - 1];
        state.lastFeedback = lastTurn.feedback || null;
        state.lastEvaluatedConcept = lastTurn.concept || null;
      } else if (knowledge_profile && typeof knowledge_profile === 'object') {
        const assessedConcepts = Object.entries(knowledge_profile).filter(
          ([_, val]) => val && val.status && val.status !== 'unassessed' && val.feedback
        );
        if (assessedConcepts.length > 0) {
          const [cName, cVal] = assessedConcepts[assessedConcepts.length - 1];
          state.lastFeedback = cVal.feedback || null;
          state.lastEvaluatedConcept = cName;
        }
      }

      if (messages && messages.length > 0) {
        state.messages = messages;
      } else if (current_question) {
        state.messages = [
          {
            id: 'm_0',
            sender: 'ai',
            text: current_question,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ];
      }
    },
    resetDiagnostic: () => {
      return initialState;
    }
  },
});

export const {
  startSession,
  addMessage,
  startStreamingAssistantMessage,
  setStreamingStatus,
  appendStreamToken,
  updateLiveEvaluation,
  finishStreamingAssistantMessage,
  recordTurnHistory,
  updateTurn,
  completeDiagnostic,
  skipDiagnostic,
  loadExistingSession,
  resetDiagnostic,
} = diagnosticSlice.actions;

export default diagnosticSlice.reducer;

