import { createSlice } from '@reduxjs/toolkit';

const savedToken = localStorage.getItem('adaptive_access_token');
const savedUserStr = localStorage.getItem('adaptive_user_data');
let savedUser = null;
try {
  if (savedUserStr) savedUser = JSON.parse(savedUserStr);
} catch (e) {
  savedUser = null;
}

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
  topics: [],
  completedTopics: [],
  activeTopic: '',
  targetLevel: 'expert',
  targetLanguage: 'python', // python, cpp, js
  explanationLanguage: 'english', // english, hinglish
  activeTab: initialActiveTab, // onboarding, diagnostic, path, workspace, analytics
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
    setUserTopics: (state, action) => {
      const topicList = action.payload || [];
      state.topics = topicList;
      state.completedTopics = topicList.filter((t) => t.is_completed).map((t) => t.id);
      if (!state.activeTopic && topicList.length > 0) {
        state.activeTopic = topicList[0].id;
      }
    },
    setActiveTopic: (state, action) => {
      state.activeTopic = action.payload;
    },
    removeTopic: (state, action) => {
      const topicId = action.payload;
      state.topics = state.topics.filter((t) => t.id !== topicId);
      state.completedTopics = state.completedTopics.filter((t) => t !== topicId);
      if (state.activeTopic === topicId) {
        state.activeTopic = state.topics[0]?.id || '';
      }
    },
    markTopicDiagnosticCompleted: (state, action) => {
      const topicId = action.payload;
      if (topicId && !state.completedTopics.includes(topicId)) {
        state.completedTopics.push(topicId);
      }
    },
    resetTopicDiagnostic: (state, action) => {
      const topicId = action.payload;
      state.completedTopics = state.completedTopics.filter((t) => t !== topicId);
    },
    addCustomTopic: (state, action) => {
      const topicName = action.payload.trim();
      if (!topicName) return;
      const topicId = topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = state.topics.find((t) => t.id === topicId);
      if (!existing) {
        const newTopic = {
          id: topicId,
          topic_slug: topicId,
          name: topicName,
          canonical_topic: topicName,
          icon: '🎓',
          description: `Custom AI-generated learning curriculum for ${topicName}.`,
          is_completed: false,
        };
        state.topics.push(newTopic);
      }
      state.activeTopic = topicId;
    },
    setTopicModeChoice: (state, action) => {
      const { topicId, modeChoice, sessionId } = action.payload;
      const topic = state.topics.find((t) => t.id === topicId || t.topic_slug === topicId);
      if (topic) {
        topic.mode_choice = modeChoice;
        if (sessionId) topic.diagnostic_session_id = sessionId;
      }
    },
    setTargetLevel: (state, action) => {
      state.targetLevel = action.payload;
    },
    setTargetLanguage: (state, action) => {
      state.targetLanguage = action.payload;
    },
    setExplanationLanguage: (state, action) => {
      state.explanationLanguage = action.payload;
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
      state.topics = [];
      state.completedTopics = [];
      state.activeTopic = '';

      localStorage.setItem('adaptive_access_token', token);
      localStorage.setItem('adaptive_user_data', JSON.stringify(user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.userId = 'user_lumina_01';
      state.isAuthenticated = false;
      state.topics = [];
      state.completedTopics = [];
      state.activeTopic = '';

      localStorage.removeItem('adaptive_access_token');
      localStorage.removeItem('adaptive_user_data');
    },
  },
});

export const {
  setUserId,
  setUserTopics,
  setActiveTopic,
  removeTopic,
  markTopicDiagnosticCompleted,
  resetTopicDiagnostic,
  addCustomTopic,
  setTopicModeChoice,
  setTargetLevel,
  setTargetLanguage,
  setExplanationLanguage,
  setActiveTab,
  openAuthModal,
  closeAuthModal,
  loginSuccess,
  logout,
} = userSlice.actions;

export default userSlice.reducer;
