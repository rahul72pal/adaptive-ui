import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  batchQuestions: [],
  batchIndex: 0,
  currentRound: 1,
  totalRounds: 5,
  questionsPerRound: 3,
  totalNodeQuestions: 15,
  totalBatchQuestions: 3,
  currentQuestion: null,
  userAnswer: '',
  attemptResult: null,
  isSubmitting: false,
  nodeCompleted: false,
};

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    setQuestionBatch: (state, action) => {
      const questions = action.payload || [];
      state.batchQuestions = questions;
      state.totalBatchQuestions = questions.length || 3;
      state.batchIndex = 0;
      state.currentQuestion = questions[0] || null;
      state.userAnswer = questions[0]?.initial_code || '';
      state.attemptResult = null;
      state.nodeCompleted = false;
      state.isSubmitting = false;
    },
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload;
      state.userAnswer = action.payload?.initial_code || '';
      state.attemptResult = null;
    },
    setUserAnswer: (state, action) => {
      state.userAnswer = action.payload;
    },
    setAttemptResult: (state, action) => {
      state.attemptResult = action.payload;
      state.isSubmitting = false;
    },
    setIsSubmitting: (state, action) => {
      state.isSubmitting = action.payload;
    },
    nextBatchQuestion: (state) => {
      if (state.batchIndex < state.batchQuestions.length - 1) {
        state.batchIndex += 1;
        state.currentQuestion = state.batchQuestions[state.batchIndex];
        state.userAnswer = state.currentQuestion?.initial_code || '';
        state.attemptResult = null;
      } else {
        // Reached end of current mini-batch round
        if (state.currentRound < state.totalRounds) {
          state.currentRound += 1;
          state.batchIndex = 0;
          state.batchQuestions = [];
          state.currentQuestion = null;
          state.userAnswer = '';
          state.attemptResult = null;
          state.isSubmitting = false;
        } else {
          state.nodeCompleted = true;
        }
      }
    },
    resetBatchProgress: (state) => {
      state.batchQuestions = [];
      state.batchIndex = 0;
      state.currentRound = 1;
      state.currentQuestion = null;
      state.userAnswer = '';
      state.attemptResult = null;
      state.nodeCompleted = false;
      state.isSubmitting = false;
    },
    setNodeCompleted: (state, action) => {
      state.nodeCompleted = action.payload !== undefined ? action.payload : true;
    },
    resetQuestionState: () => {
      return initialState;
    }
  },
});

export const {
  setQuestionBatch,
  setCurrentQuestion,
  setUserAnswer,
  setAttemptResult,
  setIsSubmitting,
  nextBatchQuestion,
  resetBatchProgress,
  setNodeCompleted,
  resetQuestionState,
} = questionsSlice.actions;

export default questionsSlice.reducer;
