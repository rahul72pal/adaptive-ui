import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab } from './features/user/userSlice';
import { Header } from './components/layout/Header';
import { AuthModal } from './features/auth/AuthModal';
import { OnboardingView } from './features/onboarding/OnboardingView';
import { DiagnosticChatView } from './features/diagnostic/DiagnosticChatView';
import { LearningPathView } from './features/learning/LearningPathView';
import { LearningWorkspaceView } from './features/learning/LearningWorkspaceView';
import { KnowledgeProfileView } from './features/analytics/KnowledgeProfileView';

const VALID_TABS = ['onboarding', 'diagnostic', 'path', 'workspace', 'analytics'];

export function App() {
  const dispatch = useDispatch();
  const { activeTab } = useSelector((state) => state.user);

  // Sync Redux activeTab -> URL hash
  useEffect(() => {
    if (activeTab && VALID_TABS.includes(activeTab)) {
      const currentHash = window.location.hash.replace('#/', '').replace('#', '');
      if (currentHash !== activeTab) {
        window.location.hash = `#/${activeTab}`;
      }
    }
  }, [activeTab]);

  // Sync URL hash -> Redux activeTab on browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash && VALID_TABS.includes(hash) && hash !== activeTab) {
        dispatch(setActiveTab(hash));
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab, dispatch]);

  return (
    <div className="min-h-screen bg-[#f8f6fb] flex flex-col font-sans text-ink-primary selection:bg-brand-100 selection:text-brand-900">
      {/* Global Animated Header with Topic Tabs & Navigation */}
      <Header />

      {/* Main Full-Width Content Screen View */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        {activeTab === 'onboarding' && <OnboardingView />}
        {activeTab === 'diagnostic' && <DiagnosticChatView />}
        {activeTab === 'path' && <LearningPathView />}
        {activeTab === 'workspace' && <LearningWorkspaceView />}
        {activeTab === 'analytics' && <KnowledgeProfileView />}
      </main>

      {/* Global Authentication Modal */}
      <AuthModal />
    </div>
  );
}

export default App;
