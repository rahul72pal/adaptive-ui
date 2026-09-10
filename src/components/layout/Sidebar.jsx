import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTopic, addCustomTopic, setActiveTab, openAuthModal, logout } from '../../features/user/userSlice';
import { setSelectedNodeId } from '../../features/learning/learningSlice';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import {
  User,
  LogOut,
  LogIn,
  CheckCircle2,
  Lock,
  ChevronRight,
  Brain,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen
} from 'lucide-react';

export function Sidebar() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, activeTopic, topics = [] } = useSelector((state) => state.user);
  const { nodes = [], selectedNodeId } = useSelector((state) => state.learning);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  const handleSelectModule = (topicId) => {
    dispatch(setActiveTopic(topicId));
    dispatch(setActiveTab('path'));
  };

  const handleSelectNode = (conceptId) => {
    dispatch(setSelectedNodeId(conceptId));
    dispatch(setActiveTab('workspace'));
  };

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    dispatch(addCustomTopic(newTopicName.trim()));
    setNewTopicName('');
    setShowAddForm(false);
    dispatch(setActiveTab('path'));
  };

  const masteredCount = nodes.filter((n) => n.status === 'mastered' || n.status === 'known').length;
  const overallProgress = nodes.length > 0 ? Math.round((masteredCount / nodes.length) * 100) : 0;

  return (
    <aside
      className={`bg-white border-r border-surface-variant p-4 space-y-6 flex flex-col justify-between shrink-0 shadow-subtle min-h-[calc(100vh-65px)] transition-all duration-300 ${
        isCollapsed ? 'w-16 items-center' : 'w-full lg:w-72'
      }`}
    >
      <div className="w-full space-y-6">
        {/* Collapse / Expand Toggle Button */}
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Navigation Panel</span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-1.5 text-ink-muted hover:text-brand-700 hover:bg-surface-container rounded-xl transition-all mx-auto lg:mx-0"
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* User Profile Card */}
        <div className={`rounded-2xl bg-surface-container/70 border border-surface-variant ${isCollapsed ? 'p-2 text-center' : 'p-3.5 space-y-3'}`}>
          {isAuthenticated && user ? (
            <div className={`flex items-center justify-between gap-3 ${isCollapsed ? 'flex-col' : ''}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl gradient-btn flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-ink-primary truncate">{user.name || 'Learner'}</div>
                    <div className="text-[10px] text-ink-muted truncate">{user.email}</div>
                  </div>
                )}
              </div>

              <button
                onClick={() => dispatch(logout())}
                title="Logout"
                className="p-1.5 text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {!isCollapsed && (
                <div className="flex items-center gap-2 text-xs text-ink-secondary">
                  <User className="w-4 h-4 text-brand-600" />
                  <span>Guest Learner</span>
                </div>
              )}
              <button
                onClick={() => dispatch(openAuthModal())}
                className={`bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                  isCollapsed ? 'p-2 text-xs' : 'w-full py-2 px-3 text-xs'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                {!isCollapsed && 'Sign In / Register'}
              </button>
            </div>
          )}
        </div>

        {/* Learning Modules Section (Full Height without max-h truncation) */}
        <div className="space-y-2">
          {!isCollapsed && (
            <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider px-2 flex items-center justify-between">
              <span>Learning Modules</span>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-[10px] text-brand-700 hover:text-brand-900 font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Custom
              </button>
            </div>
          )}

          {/* Inline Custom Topic Input Form */}
          {showAddForm && !isCollapsed && (
            <form onSubmit={handleAddTopic} className="px-1 py-1 space-y-2">
              <input
                type="text"
                autoFocus
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Topic name (e.g. Golang)..."
                className="w-full text-xs px-3 py-2 bg-surface-container border border-brand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-ink-primary"
              />
              <div className="flex items-center gap-1">
                <button
                  type="submit"
                  disabled={!newTopicName.trim()}
                  className="flex-1 py-1 px-2 bg-brand-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  Add Topic
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="py-1 px-2 text-ink-muted text-xs hover:text-ink-primary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Modules List taking full fluid height */}
          <div className="space-y-1">
            {topics.map((mod) => {
              const isSelected = activeTopic === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => handleSelectModule(mod.id)}
                  title={mod.name}
                  className={`w-full flex items-center rounded-xl text-xs font-medium transition-all ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-between p-2.5'
                  } ${
                    isSelected
                      ? 'bg-brand-50 text-brand-900 border border-brand-200 shadow-sm font-semibold'
                      : 'text-ink-primary hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{mod.icon || '🎓'}</span>
                    {!isCollapsed && <span className="truncate capitalize">{mod.name}</span>}
                  </div>
                  {!isCollapsed && isSelected && <ChevronRight className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Concept Nodes Quick Jump List */}
        {!isCollapsed && nodes && nodes.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-surface-variant">
            <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider px-2 flex items-center justify-between">
              <span>Concept Sequence</span>
              <span className="text-[10px] text-brand-700 font-semibold">{overallProgress}%</span>
            </div>

            <ProgressBar progress={overallProgress} height="h-1.5" className="px-2" />

            <div className="space-y-1 pt-1">
              {nodes.map((node) => {
                const isSelected = node.concept_id === selectedNodeId;
                const isMastered = node.status === 'mastered' || node.status === 'known';
                const isLocked = node.status === 'locked';

                return (
                  <button
                    key={node.concept_id}
                    disabled={isLocked}
                    onClick={() => handleSelectNode(node.concept_id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-all ${
                      isLocked
                        ? 'opacity-50 text-ink-muted cursor-not-allowed'
                        : isSelected
                        ? 'bg-brand-600 text-white font-semibold shadow-sm'
                        : 'text-ink-primary hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isMastered ? (
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`} />
                      ) : isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white animate-ping' : 'bg-brand-600'}`} />
                      )}
                      <span className="truncate">{node.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer System Status */}
      {!isCollapsed && (
        <div className="pt-3 border-t border-surface-variant space-y-2">
          <Badge variant="ai" size="sm" className="w-full justify-center">
            <Brain className="w-3.5 h-3.5 text-brand-600" />
            Deterministic Engine v1.0
          </Badge>
        </div>
      )}
    </aside>
  );
}
