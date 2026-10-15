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
      className={`bg-[#111114] border-r border-[#222229] p-4 space-y-6 flex flex-col justify-between shrink-0 shadow-subtle min-h-[calc(100vh-65px)] transition-all duration-300 text-[#F4F4F5] ${
        isCollapsed ? 'w-16 items-center' : 'w-full lg:w-72'
      }`}
    >
      <div className="w-full space-y-6">
        {/* Collapse / Expand Toggle Button */}
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider">Navigation Panel</span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-1.5 text-[#71717A] hover:text-[#8B7CFF] hover:bg-[#16161B] rounded-xl transition-all mx-auto lg:mx-0 cursor-pointer"
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* User Profile Card */}
        <div className={`rounded-2xl bg-[#16161B] border border-[#292932] ${isCollapsed ? 'p-2 text-center' : 'p-3.5 space-y-3'}`}>
          {isAuthenticated && user ? (
            <div className={`flex items-center justify-between gap-3 ${isCollapsed ? 'flex-col' : ''}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#6558F5] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-[#F4F4F5] truncate">{user.name || 'Learner'}</div>
                    <div className="text-[10px] text-[#71717A] truncate">{user.email}</div>
                  </div>
                )}
              </div>

              <button
                onClick={() => dispatch(logout())}
                title="Logout"
                className="p-1.5 text-[#71717A] hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-all shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {!isCollapsed && (
                <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                  <User className="w-4 h-4 text-[#8B7CFF]" />
                  <span>Guest Learner</span>
                </div>
              )}
              <button
                onClick={() => dispatch(openAuthModal())}
                className={`bg-[#6558F5] text-white rounded-xl font-bold hover:bg-[#7568FF] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                  isCollapsed ? 'p-2 text-xs' : 'w-full py-2 px-3 text-xs'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                {!isCollapsed && 'Sign In / Register'}
              </button>
            </div>
          )}
        </div>

        {/* Learning Modules Section */}
        <div className="space-y-2">
          {!isCollapsed && (
            <div className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider px-2 flex items-center justify-between">
              <span>Learning Modules</span>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-[#8B7CFF] hover:underline flex items-center gap-1 font-bold lowercase text-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> add
              </button>
            </div>
          )}

          {showAddForm && !isCollapsed && (
            <form onSubmit={handleAddTopic} className="px-2 pt-1 flex gap-1.5">
              <input
                type="text"
                autoFocus
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Topic name..."
                className="flex-1 bg-[#16161B] border border-[#292932] rounded-xl px-3 py-1.5 text-xs text-[#F4F4F5] placeholder:text-[#71717A] focus:outline-none focus:border-[#8B7CFF]"
              />
              <button
                type="submit"
                disabled={!newTopicName.trim()}
                className="bg-[#6558F5] text-white px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                Add
              </button>
            </form>
          )}

          <div className="space-y-1">
            {topics.map((t) => {
              const isSelected = activeTopic === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectModule(t.id)}
                  title={t.name}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#211C38] text-[#8B7CFF] border border-[#49406F] shadow-xs'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#16161B] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{t.icon || '🎓'}</span>
                    {!isCollapsed && <span className="truncate">{t.name}</span>}
                  </div>
                  {!isCollapsed && isSelected && (
                    <ChevronRight className="w-3.5 h-3.5 text-[#8B7CFF] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Concept Graph Outline */}
        {nodes.length > 0 && !isCollapsed && (
          <div className="space-y-2 pt-2 border-t border-[#222229]">
            <div className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider px-2">
              Concept Nodes ({masteredCount}/{nodes.length})
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {nodes.map((node) => {
                const isSelected = node.concept_id === selectedNodeId;
                const isMastered = node.status === 'mastered' || node.status === 'known';
                const isLocked = node.status === 'locked';

                return (
                  <button
                    key={node.concept_id}
                    onClick={() => !isLocked && handleSelectNode(node.concept_id)}
                    disabled={isLocked}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all text-left ${
                      isLocked
                        ? 'opacity-40 text-[#52525B] cursor-not-allowed'
                        : isSelected
                        ? 'bg-[#211C38] text-[#8B7CFF] border border-[#49406F] font-bold shadow-xs'
                        : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#16161B]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isMastered ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-[#52525B] shrink-0" />
                      ) : (
                        <BookOpen className="w-3.5 h-3.5 text-[#8B7CFF] shrink-0" />
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

      {/* Progress Footer */}
      {!isCollapsed && (
        <div className="p-3.5 rounded-2xl bg-[#16161B] border border-[#292932] space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#A1A1AA]">
            <span>Path Completion</span>
            <span className="text-[#8B7CFF] font-bold">{overallProgress}%</span>
          </div>
          <ProgressBar progress={overallProgress} />
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
