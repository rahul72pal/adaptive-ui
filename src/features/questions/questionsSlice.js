import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentQuestion: null,
  userAnswer: '',
  attemptResult: null,
  isSubmitting: false,
  nodeCompleted: false,
  currentQuestionCount: 1,
  targetQuestionCount: 5,
  difficulty: 3,
};

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload;
      state.userAnswer = action.payload?.initial_code || '';
      state.attemptResult = null;
      state.isSubmitting = false;
    },
    setUserAnswer: (state, action) => {
      state.userAnswer = action.payload;
    },
    setAttemptResult: (state, action) => {
      state.attemptResult = action.payload;
      state.isSubmitting = false;
      if (action.payload?.current_question_count) {
        state.currentQuestionCount = action.payload.current_question_count;
      }
      if (action.payload?.target_question_count) {
        state.targetQuestionCount = action.payload.target_question_count;
      }
      if (action.payload?.next_difficulty) {
        state.difficulty = action.payload.next_difficulty;
      }
      if (action.payload?.passed && action.payload?.is_concept_completed) {
        state.nodeCompleted = true;
      } else {
        state.nodeCompleted = false;
      }
    },
    setNextQuestion: (state, action) => {
      state.currentQuestion = action.payload;
      state.userAnswer = action.payload?.initial_code || '';
      if (state.attemptResult?.next_question_count) {
        state.currentQuestionCount = state.attemptResult.next_question_count;
      } else {
        state.currentQuestionCount = state.currentQuestionCount + 1;
      }
      state.attemptResult = null;
      state.isSubmitting = false;
    },
    setIsSubmitting: (state, action) => {
      state.isSubmitting = action.payload;
    },
    setDifficulty: (state, action) => {
      state.difficulty = action.payload;
    },
    setNodeCompleted: (state, action) => {
      state.nodeCompleted = action.payload !== undefined ? action.payload : true;
    },
    resetBatchProgress: (state) => {
      state.currentQuestion = null;
      state.userAnswer = '';
      state.attemptResult = null;
      state.isSubmitting = false;
      state.nodeCompleted = false;
      state.currentQuestionCount = 1;
      state.targetQuestionCount = 5;
      state.difficulty = 3;
    },
    resetQuestionState: () => {
      return initialState;
    }
  },
});

export const {
  setCurrentQuestion,
  setUserAnswer,
  setAttemptResult,
  setNextQuestion,
  setIsSubmitting,
  setDifficulty,
  setNodeCompleted,
  resetBatchProgress,
  resetQuestionState,
} = questionsSlice.actions;

export default questionsSlice.reducer;

