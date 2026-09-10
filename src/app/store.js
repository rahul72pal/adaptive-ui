import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../features/user/userSlice';
import diagnosticReducer from '../features/diagnostic/diagnosticSlice';
import learningReducer from '../features/learning/learningSlice';
import questionsReducer from '../features/questions/questionsSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    diagnostic: diagnosticReducer,
    learning: learningReducer,
    questions: questionsReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
