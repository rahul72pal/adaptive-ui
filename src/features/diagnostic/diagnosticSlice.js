import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sessionId: null,
  status: 'idle', // idle, chatting, completed, skipped
  turn: 1,
  totalTurns: 15,
  messages: [], // { id, sender: 'ai' | 'user', text: string, options?: string[], timestamp: string }
  turnHistory: [], // [{ turn: number, question: string, userAnswer: string, feedback: string }]
  knowledgeProfile: null,
};

const diagnosticSlice = createSlice({
  name: 'diagnostic',
  initialState,
  reducers: {
    startSession: (state, action) => {
      state.sessionId = action.payload.sessionId;
      state.status = 'chatting';
      state.turn = action.payload.turn || 1;
      state.knowledgeProfile = null;
      state.turnHistory = [];
      const firstQ = action.payload.firstQuestion || action.payload.question || "Let's begin your 15-message diagnostic assessment.";
      state.messages = [
        {
          id: 'm_0',
          sender: 'ai',
          text: firstQ,
          options: action.payload.options || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ];
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    recordTurnHistory: (state, action) => {
      const { turn, question, userAnswer, feedback } = action.payload;
      state.turnHistory.push({
        turn: turn || state.turnHistory.length + 1,
        question,
        userAnswer,
        feedback: feedback || 'Assessment recorded by Lumina AI engine.',
      });
    },
    updateTurn: (state, action) => {
      state.turn = action.payload.turn;
      if (action.payload.knowledgeProfile) {
        state.liveProfile = action.payload.knowledgeProfile;
      }
      const qText = action.payload.nextQuestion || action.payload.question;
      if (qText) {
        state.messages.push({
          id: `m_${state.messages.length}`,
          sender: 'ai',
          text: qText,
          options: action.payload.options || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
    },
    completeDiagnostic: (state, action) => {
      state.status = 'completed';
      state.knowledgeProfile = action.payload || state.liveProfile || {
        summary: '15-message diagnostic session complete! Custom concept graph & learning path created.'
      };
    },
    skipDiagnostic: (state) => {
      state.status = 'skipped';
      state.knowledgeProfile = {
        summary: 'Opted out as complete beginner. Learning path starts from absolute fundamentals.'
      };
    },
    resetDiagnostic: (state) => {
      return initialState;
    }
  },
});

export const {
  startSession,
  addMessage,
  recordTurnHistory,
  updateTurn,
  completeDiagnostic,
  skipDiagnostic,
  resetDiagnostic,
} = diagnosticSlice.actions;

export default diagnosticSlice.reducer;
