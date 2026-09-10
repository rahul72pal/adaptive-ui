import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTopic, addCustomTopic, setActiveTab, openAuthModal, logout } from '../../features/user/userSlice';
import { useDiagnostic } from '../../hooks/useDiagnostic';
import { Badge } from '../ui/Badge';
import {
  Sparkles,
  Map,
  MessageSquare,
  Compass,
  BarChart3,
  BookOpen,
  Plus,
  LogIn,
  LogOut,
  Menu,
  X,
  Layers,
  CheckCircle2
} from 'lucide-react';

export function Header() {
  const dispatch = useDispatch();
  const { activeTab, activeTopic, topics = [], completedTopics = [], user, isAuthenticated } = useSelector((state) => state.user);
  const { startDiagnostic } = useDiagnostic();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  const navItems = [
    { id: 'onboarding', label: 'Topics & Overview', icon: Compass },
    { id: 'diagnostic', label: '15-Turn AI Chat', icon: MessageSquare },
    { id: 'path', label: 'Learning Path', icon: Map },
    { id: 'workspace', label: 'Workspace', icon: BookOpen },
    { id: 'analytics', label: 'Knowledge Profile', icon: BarChart3 },
  ];

  const handleTopicClick = (topicId) => {
    dispatch(setActiveTopic(topicId));
    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }
    // If diagnostic chat for this topic is already completed, open Learning Path directly!
    if (completedTopics.includes(topicId)) {
      dispatch(setActiveTab('path'));
    } else {
      startDiagnostic();
    }
    setMobileMenuOpen(false);
  };

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    const topicName = newTopicName.trim();
    dispatch(addCustomTopic(topicName));
    setNewTopicName('');
    setShowAddForm(false);
    if (isAuthenticated) {
      startDiagnostic();
    } else {
      dispatch(openAuthModal());
    }
    setMobileMenuOpen(false);
  };

  const handleNavClick = (id) => {
    dispatch(setActiveTab(id));
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-surface-variant px-4 lg:px-8 py-2.5 transition-all shadow-subtle">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand & AI Engine Badge */}
        <div
          onClick={() => dispatch(setActiveTab('onboarding'))}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-btn flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-ink-primary tracking-tight group-hover:text-brand-700 transition-colors">
                Lumina AI
              </h1>
              <Badge variant="ai" size="sm" className="hidden xl:inline-flex">
                <Sparkles className="w-3 h-3 text-brand-600" />
                Adaptive Platform
              </Badge>
            </div>
            <p className="text-[11px] text-ink-muted hidden sm:block">
              Dynamic Curriculum & Assessment
            </p>
          </div>
        </div>

        {/* Desktop Topic Selector Tabs */}
        <div className="hidden lg:flex items-center gap-1.5 bg-surface-container/70 p-1.5 rounded-2xl border border-surface-variant max-w-xl overflow-x-auto">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider px-2 flex items-center gap-1 shrink-0">
            <Layers className="w-3 h-3 text-brand-600" />
            Topics:
          </span>
          
          {topics.map((topic) => {
            const isSelected = activeTopic === topic.id;
            const isCompleted = completedTopics.includes(topic.id);

            return (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm scale-[1.02]'
                    : 'text-ink-primary hover:bg-white hover:text-brand-700'
                }`}
              >
                <span>{topic.icon || '🎓'}</span>
                <span>{topic.name}</span>
                {isCompleted && <CheckCircle2 className={`w-3 h-3 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`} />}
              </button>
            );
          })}

          {/* Add Custom Topic Inline Trigger */}
          {showAddForm ? (
            <form onSubmit={handleAddTopic} className="flex items-center gap-1 shrink-0 px-1">
              <input
                type="text"
                autoFocus
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Topic name..."
                className="w-28 text-xs px-2 py-1 bg-white border border-brand-300 rounded-lg text-ink-primary focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={!newTopicName.trim()}
                className="p-1 bg-brand-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-ink-muted hover:text-ink-primary p-0.5 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-brand-700 hover:bg-brand-50 transition-all whitespace-nowrap border border-dashed border-brand-300 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Custom
            </button>
          )}
        </div>

        {/* Right Navigation & User Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Main Navigation Tabs */}
          <nav className="hidden md:flex items-center bg-surface-container/60 p-1 rounded-xl border border-surface-variant">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-brand-700 shadow-sm border border-brand-200 font-bold'
                      : 'text-ink-secondary hover:text-ink-primary hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-600' : 'text-ink-muted'}`} />
                  <span className="hidden xl:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Account / Auth */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-200 rounded-xl">
                <div className="w-6 h-6 rounded-lg gradient-btn flex items-center justify-center font-bold text-xs text-white">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-bold text-brand-900 hidden sm:inline">{user.name}</span>
              </div>
              <button
                onClick={() => dispatch(logout())}
                title="Log out"
                className="flex items-center gap-1 px-2.5 py-1.5 text-ink-secondary hover:text-rose-600 hover:bg-rose-50 border border-surface-variant hover:border-rose-200 rounded-xl text-xs font-semibold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => dispatch(openAuthModal())}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-ink-primary hover:bg-surface-container rounded-xl transition-all"
            title="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Animated Mobile Drawer Menu (Topics + Navigation) */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-3 pb-3 border-t border-surface-variant mt-2 space-y-4 animate-fadeIn">
          
          {/* Mobile Topic Selector */}
          <div className="space-y-2 px-1">
            <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider flex items-center justify-between">
              <span>Select Topic Focus</span>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-[11px] text-brand-700 font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Custom
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddTopic} className="flex items-center gap-1 py-1">
                <input
                  type="text"
                  autoFocus
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="New custom topic..."
                  className="flex-1 text-xs px-3 py-1.5 bg-surface-container border border-brand-300 rounded-xl text-ink-primary"
                />
                <button
                  type="submit"
                  disabled={!newTopicName.trim()}
                  className="px-3 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  Start
                </button>
              </form>
            )}

            <div className="grid grid-cols-2 gap-2">
              {topics.map((topic) => {
                const isSelected = activeTopic === topic.id;
                const isCompleted = completedTopics.includes(topic.id);

                return (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicClick(topic.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-surface-container text-ink-primary hover:bg-brand-50'
                    }`}
                  >
                    <span className="text-base">{topic.icon || '🎓'}</span>
                    <span className="truncate">{topic.name}</span>
                    {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile View Navigation Links */}
          <div className="space-y-1 pt-2 border-t border-surface-variant">
            <div className="text-[11px] font-bold text-ink-muted uppercase tracking-wider px-1 mb-1">
              Views
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 border border-brand-200 font-bold'
                      : 'text-ink-primary hover:bg-surface-container'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-ink-muted'}`} />
                  {item.label}
                </button>
              );
            })}
            {isAuthenticated && (
              <button
                onClick={() => {
                  dispatch(logout());
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-left text-rose-600 hover:bg-rose-50 transition-all border border-rose-100 mt-2"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
