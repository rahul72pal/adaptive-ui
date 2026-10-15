import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab, setActiveTopic, logout } from './features/user/userSlice';
import { useDiagnostic } from './hooks/useDiagnostic';
import { Header } from './components/layout/Header';
import { AuthModal } from './features/auth/AuthModal';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { OnboardingView } from './features/onboarding/OnboardingView';
import { DiagnosticChatView } from './features/diagnostic/DiagnosticChatView';
import { LearningPathView } from './features/learning/LearningPathView';
import { LearningWorkspaceView } from './features/learning/LearningWorkspaceView';
import { KnowledgeProfileView } from './features/analytics/KnowledgeProfileView';

export function parseRoute(hashString) {
  const raw = hashString ? hashString.replace(/^#\/?/, '') : '';
  const parts = raw.split('/').filter(Boolean);

  if (parts[0] === 'topic' && parts[1]) {
    const topicSlug = parts[1];
    const subRoute = parts[2] || 'graph';

    if (subRoute === 'diagnostic') {
      const sessionId = parts[3] || null;
      return { activeTab: 'diagnostic', activeTopic: topicSlug, sessionId };
    }
    if (subRoute === 'graph' || subRoute === 'path') {
      return { activeTab: 'path', activeTopic: topicSlug, sessionId: null };
    }
    if (subRoute === 'workspace') {
      return { activeTab: 'workspace', activeTopic: topicSlug, sessionId: null };
    }
    if (subRoute === 'analytics') {
      return { activeTab: 'analytics', activeTopic: topicSlug, sessionId: null };
    }
  }

  if (parts[0] === 'diagnostic') {
    return { activeTab: 'diagnostic', activeTopic: null, sessionId: parts[1] || null };
  }
  if (parts[0] === 'path' || parts[0] === 'graph') {
    return { activeTab: 'path', activeTopic: null, sessionId: null };
  }
  if (parts[0] === 'workspace') {
    return { activeTab: 'workspace', activeTopic: null, sessionId: null };
  }
  if (parts[0] === 'analytics') {
    return { activeTab: 'analytics', activeTopic: null, sessionId: null };
  }

  return { activeTab: 'onboarding', activeTopic: null, sessionId: null };
}

export function buildRouteHash(activeTab, activeTopic, sessionId) {
  if (activeTopic) {
    if (activeTab === 'diagnostic') {
      return sessionId ? `#/topic/${activeTopic}/diagnostic/${sessionId}` : `#/topic/${activeTopic}/diagnostic`;
    }
    if (activeTab === 'path') {
      return `#/topic/${activeTopic}/graph`;
    }
    if (activeTab === 'workspace') {
      return `#/topic/${activeTopic}/workspace`;
    }
    if (activeTab === 'analytics') {
      return `#/topic/${activeTopic}/analytics`;
    }
  }
  if (activeTab && activeTab !== 'onboarding') {
    return sessionId ? `#/${activeTab}/${sessionId}` : `#/${activeTab}`;
  }
  return '#/onboarding';
}

export function App() {
  const dispatch = useDispatch();
  const { activeTab, activeTopic } = useSelector((state) => state.user);
  const { sessionId, loadSession } = useDiagnostic();

  const loadSessionRef = useRef(loadSession);
  useEffect(() => {
    loadSessionRef.current = loadSession;
  }, [loadSession]);

  // Handle browser back/forward or manual hash change in URL
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseRoute(window.location.hash);
      if (parsed.activeTopic && parsed.activeTopic !== activeTopic) {
        dispatch(setActiveTopic(parsed.activeTopic));
      }
      if (parsed.activeTab && parsed.activeTab !== activeTab) {
        dispatch(setActiveTab(parsed.activeTab));
      }
      if (parsed.activeTab === 'diagnostic' && parsed.sessionId && parsed.sessionId !== sessionId) {
        loadSessionRef.current?.(parsed.sessionId);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [dispatch, activeTopic, activeTab, sessionId]);

  // Sync Redux state updates into browser URL hash
  useEffect(() => {
    const targetHash = buildRouteHash(activeTab, activeTopic, sessionId);
    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, '', targetHash);
    }
  }, [activeTab, activeTopic, sessionId]);

  // Global listener for session expiry/unauthorized responses
  useEffect(() => {
    const handleAuthExpired = () => {
      dispatch(logout());
    };
    window.addEventListener('adaptive:auth_unauthorized', handleAuthExpired);
    return () => window.removeEventListener('adaptive:auth_unauthorized', handleAuthExpired);
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col font-sans text-ink-primary selection:bg-[#211C38] selection:text-[#8B7CFF]">
      {/* Global Animated Header with Topic Tabs & Navigation */}
      <Header />

      {/* Main Full-Width Content Screen View Protected by ErrorBoundary */}
      <main className="flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <ErrorBoundary>
          {activeTab === 'onboarding' && <OnboardingView />}
          {activeTab === 'diagnostic' && <DiagnosticChatView />}
          {activeTab === 'path' && <LearningPathView />}
          {activeTab === 'workspace' && <LearningWorkspaceView />}
          {activeTab === 'analytics' && <KnowledgeProfileView />}
        </ErrorBoundary>
      </main>

      {/* Global Authentication Modal */}
      <AuthModal />
    </div>
  );
}

export default App;
