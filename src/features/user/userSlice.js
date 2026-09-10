import { createSlice } from '@reduxjs/toolkit';

const savedToken = localStorage.getItem('adaptive_access_token');
const savedUserStr = localStorage.getItem('adaptive_user_data');
let savedUser = null;
try {
  if (savedUserStr) savedUser = JSON.parse(savedUserStr);
} catch (e) {
  savedUser = null;
}

const savedTopicsStr = localStorage.getItem('adaptive_custom_topics');
let initialTopics = [
  { id: 'javascript', name: 'JavaScript & Web Core', icon: '⚡', description: 'Async JS, Event Loop, Closures, DOM, & Modern ESNext.' },
  { id: 'react', name: 'React & State Architecture', icon: '⚛️', description: 'Hooks, Fiber Reconciler, Redux Toolkit, and TanStack Query.' },
  { id: 'python', name: 'Python Backend & FastAPI', icon: '🐍', description: 'Pydantic schemas, Async IO, Dependency Injection, and ORM.' },
  { id: 'system-design', name: 'Distributed System Design', icon: '🏗️', description: 'Caching, Load Balancing, Microservices, and Consensus.' },
];

try {
  if (savedTopicsStr) {
    const parsed = JSON.parse(savedTopicsStr);
    if (Array.isArray(parsed) && parsed.length > 0) initialTopics = parsed;
  }
} catch (e) {}

const savedCompletedTopicsStr = localStorage.getItem('adaptive_completed_topics');
let initialCompletedTopics = [];
try {
  if (savedCompletedTopicsStr) {
    const parsed = JSON.parse(savedCompletedTopicsStr);
    if (Array.isArray(parsed)) initialCompletedTopics = parsed;
  }
} catch (e) {}

// Read URL hash on initial load
const hashTab = typeof window !== 'undefined' && window.location.hash ? window.location.hash.replace('#/', '').replace('#', '') : null;
const validTabs = ['onboarding', 'diagnostic', 'path', 'workspace', 'analytics'];
const initialActiveTab = validTabs.includes(hashTab) ? hashTab : 'onboarding';

const initialState = {
  userId: savedUser?.id || 'user_lumina_01',
  user: savedUser,
  token: savedToken || null,
  isAuthenticated: !!savedToken,
  isAuthModalOpen: false,
  topics: initialTopics,
  completedTopics: initialCompletedTopics,
  activeTopic: initialTopics[0]?.id || 'javascript',
  targetLevel: 'expert',
  activeTab: initialActiveTab, // onboarding, diagnostic, path, workspace, analytics
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
    setActiveTopic: (state, action) => {
      state.activeTopic = action.payload;
    },
    markTopicDiagnosticCompleted: (state, action) => {
      const topicId = action.payload;
      if (topicId && !state.completedTopics.includes(topicId)) {
        state.completedTopics.push(topicId);
        localStorage.setItem('adaptive_completed_topics', JSON.stringify(state.completedTopics));
      }
    },
    resetTopicDiagnostic: (state, action) => {
      const topicId = action.payload;
      state.completedTopics = state.completedTopics.filter((t) => t !== topicId);
      localStorage.setItem('adaptive_completed_topics', JSON.stringify(state.completedTopics));
    },
    addCustomTopic: (state, action) => {
      const topicName = action.payload.trim();
      if (!topicName) return;
      const topicId = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = state.topics.find((t) => t.id === topicId);
      if (!existing) {
        const newTopic = {
          id: topicId,
          name: topicName,
          icon: '🎓',
          description: `Custom AI-generated learning curriculum for ${topicName}.`,
        };
        state.topics.push(newTopic);
        localStorage.setItem('adaptive_custom_topics', JSON.stringify(state.topics));
      }
      state.activeTopic = topicId;
    },
    setTargetLevel: (state, action) => {
      state.targetLevel = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    openAuthModal: (state) => {
      state.isAuthModalOpen = true;
    },
    closeAuthModal: (state) => {
      state.isAuthModalOpen = false;
    },
    loginSuccess: (state, action) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.userId = user.id;
      state.isAuthenticated = true;
      state.isAuthModalOpen = false;
      state.activeTab = 'onboarding';

      localStorage.setItem('adaptive_access_token', token);
      localStorage.setItem('adaptive_user_data', JSON.stringify(user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.userId = 'user_lumina_01';
      state.isAuthenticated = false;

      localStorage.removeItem('adaptive_access_token');
      localStorage.removeItem('adaptive_user_data');
    },
  },
});

export const {
  setUserId,
  setActiveTopic,
  markTopicDiagnosticCompleted,
  resetTopicDiagnostic,
  addCustomTopic,
  setTargetLevel,
  setActiveTab,
  openAuthModal,
  closeAuthModal,
  loginSuccess,
  logout,
} = userSlice.actions;

export default userSlice.reducer;
