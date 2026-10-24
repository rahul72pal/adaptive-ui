import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setActiveTopic,
  setActiveTab,
  openAuthModal,
  logout,
  setTargetLanguage,
  setExplanationLanguage
} from '../../features/user/userSlice';
import { useUserTopics } from '../../hooks/useUserTopics';
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
  CheckCircle2,
  Code2,
  Globe,
  ChevronDown,
  Settings
} from 'lucide-react';

export function Header() {
  const dispatch = useDispatch();
  const {
    activeTab,
    activeTopic,
    user,
    isAuthenticated,
    targetLanguage,
    explanationLanguage
  } = useSelector((state) => state.user);
  const { topics, selectOrCreateTopic } = useUserTopics();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  const topicDropdownRef = useRef(null);

  // Close topic dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (topicDropdownRef.current && !topicDropdownRef.current.contains(event.target)) {
        setTopicDropdownOpen(false);
        setShowAddForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'onboarding', label: 'Topics Overview', shortLabel: 'Overview', icon: Compass },
    { id: 'diagnostic', label: '15-Turn AI Chat', shortLabel: 'AI Chat', icon: MessageSquare },
    { id: 'path', label: 'Learning Path', shortLabel: 'Path', icon: Map },
    { id: 'workspace', label: 'Workspace', shortLabel: 'Workspace', icon: BookOpen },
    { id: 'analytics', label: 'Knowledge Profile', shortLabel: 'Profile', icon: BarChart3 },
  ];

  const settingsNavItem = { id: 'settings', label: 'LLM Settings', shortLabel: 'Settings', icon: Settings };

  const currentTopicObj = topics.find((t) => t.id === activeTopic) || {
    id: activeTopic || 'getting-started',
    name: activeTopic ? activeTopic.replace(/[-_]+/g, ' ') : 'Select Topic',
    icon: '🎓',
  };

  const handleTopicClick = async (topic) => {
    dispatch(setActiveTopic(topic.id));
    setTopicDropdownOpen(false);
    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }
    if (topic.is_completed) {
      dispatch(setActiveTab('path'));
    } else {
      dispatch(setActiveTab('onboarding'));
    }
    setMobileMenuOpen(false);
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    const topicName = newTopicName.trim();
    setNewTopicName('');
    setShowAddForm(false);
    setTopicDropdownOpen(false);
    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }
    try {
      const topicData = await selectOrCreateTopic(topicName);
      if (topicData) {
        dispatch(setActiveTopic(topicData.topic_slug));
      }
      dispatch(setActiveTab('onboarding'));
    } catch (err) {
      console.error('Header topic creation failed:', err);
    }
    setMobileMenuOpen(false);
  };

  const handleNavClick = (id) => {
    dispatch(setActiveTab(id));
    setMobileMenuOpen(false);
  };

  const toggleCodingLanguage = () => {
    const nextLang = targetLanguage === 'python' ? 'cpp' : targetLanguage === 'cpp' ? 'js' : 'python';
    dispatch(setTargetLanguage(nextLang));
  };

  const toggleExplanationLanguage = () => {
    const nextExp = explanationLanguage === 'english' ? 'hinglish' : 'english';
    dispatch(setExplanationLanguage(nextExp));
  };

  return (
    <header className="sticky top-0 z-40 bg-[#111114]/95 backdrop-blur-md border-b border-[#222229] px-3 sm:px-6 py-2.5 transition-all shadow-subtle text-[#F4F4F5]">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3 lg:gap-6">
        
        {/* ========================================================= */}
        {/* LEFT: BRAND & TOPIC SELECTOR                              */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 min-w-0">
          {/* Logo & Brand title */}
          <div
            onClick={() => dispatch(setActiveTab('onboarding'))}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            role="button"
            tabIndex={0}
            title="Lumina AI Home"
          >
            <div className="w-9 h-9 rounded-xl bg-[#6558F5] border border-[#8B7CFF]/40 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-[#F4F4F5] tracking-tight group-hover:text-[#8B7CFF] transition-colors whitespace-nowrap">
                  Lumina AI
                </span>
                <Badge variant="ai" size="sm" className="hidden 2xl:inline-flex py-0.5 px-2">
                  <Sparkles className="w-3 h-3 text-[#8B7CFF] mr-1" />
                  Adaptive Platform
                </Badge>
              </div>
              <span className="text-[10px] text-[#71717A] hidden sm:inline whitespace-nowrap">
                Dynamic Curriculum & Assessment
              </span>
            </div>
          </div>

          {/* Desktop Topic Dropdown Pill */}
          <div className="relative hidden md:block shrink-0" ref={topicDropdownRef}>
            <button
              onClick={() => setTopicDropdownOpen(!topicDropdownOpen)}
              className="h-9 px-3 bg-[#16161B] hover:bg-[#1C1C23] border border-[#292932] hover:border-[#49406F] rounded-xl flex items-center gap-1.5 text-xs font-medium text-[#F4F4F5] transition-all shadow-2xs group cursor-pointer"
              title="Switch Learning Topic"
            >
              <span className="text-sm">{currentTopicObj.icon || '🎓'}</span>
              <span className="max-w-[130px] truncate capitalize">
                {currentTopicObj.canonical_topic || currentTopicObj.name}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#71717A] transition-transform duration-200 ${topicDropdownOpen ? 'rotate-180 text-[#8B7CFF]' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {topicDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 bg-[#111114] rounded-2xl border border-[#292932] shadow-elevated p-2 z-50 animate-fadeIn space-y-1">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-[#71717A] uppercase tracking-wider flex items-center justify-between border-b border-[#222229]">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#8B7CFF]" /> Saved Topics
                  </span>
                  <span className="text-[#8B7CFF] font-semibold">{topics.length} total</span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5 py-1">
                  {topics.length > 0 ? (
                    topics.map((t) => {
                      const isSelected = activeTopic === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => handleTopicClick(t)}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#211C38] text-[#8B7CFF] border border-[#49406F]'
                              : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#16161B]'
                          }`}
                        >
                          <span className="text-sm">{t.icon || '🎓'}</span>
                          <span className="truncate flex-1 capitalize">{t.canonical_topic || t.name}</span>
                          {t.is_completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-[#71717A]">
                      No saved topics yet.
                    </div>
                  )}
                </div>

                {/* Add Topic Inside Dropdown */}
                <div className="pt-1.5 border-t border-[#222229]">
                  {showAddForm ? (
                    <form onSubmit={handleAddTopic} className="flex items-center gap-1.5 p-1">
                      <input
                        type="text"
                        autoFocus
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        placeholder="New topic name..."
                        className="w-full text-xs px-2.5 py-1.5 bg-[#16161B] border border-[#292932] rounded-lg text-[#F4F4F5] placeholder:text-[#71717A] focus:outline-none focus:border-[#8B7CFF]"
                      />
                      <button
                        type="submit"
                        disabled={!newTopicName.trim()}
                        className="px-2.5 py-1.5 bg-[#6558F5] hover:bg-[#7568FF] text-white rounded-lg text-xs font-bold disabled:opacity-40 shrink-0 cursor-pointer"
                      >
                        Add
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-[#8B7CFF] hover:bg-[#211C38] transition-colors border border-dashed border-[#49406F] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Custom Topic
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>



        {/* ========================================================= */}
        {/* RIGHT: PREFERENCES & ACCOUNT                              */}
        {/* ========================================================= */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Coding Language Toggle */}
          <button
            onClick={toggleCodingLanguage}
            title="Click to toggle coding language"
            className="hidden sm:flex h-9 px-2.5 bg-[#16161B] hover:bg-[#1C1C23] text-[#F4F4F5] rounded-xl border border-[#292932] hover:border-[#49406F] items-center gap-1.5 text-xs font-medium transition-all shadow-2xs cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-[#8B7CFF]" />
            <span className="whitespace-nowrap">
              {targetLanguage === 'cpp' ? '⚡ C++' : targetLanguage === 'js' ? '🟨 JS' : '🐍 Python'}
            </span>
          </button>

          {/* Explanation Language Toggle */}
          <button
            onClick={toggleExplanationLanguage}
            title="Click to toggle explanation language"
            className="hidden xl:flex h-9 px-2.5 bg-[#16161B] hover:bg-[#1C1C23] text-[#F4F4F5] rounded-xl border border-[#292932] hover:border-[#49406F] items-center gap-1.5 text-xs font-medium transition-all shadow-2xs cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#8B7CFF]" />
            <span className="whitespace-nowrap">
              {explanationLanguage === 'hinglish' ? '🇮🇳 Hinglish' : '🇬🇧 English'}
            </span>
          </button>

          {/* Settings Button */}
          {isAuthenticated && (
            <button
              onClick={() => dispatch(setActiveTab('settings'))}
              title="LLM Configuration"
              className={`hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#211C38] text-[#8B7CFF] border-[#49406F]'
                  : 'bg-[#16161B] text-[#71717A] border-[#292932] hover:text-[#F4F4F5] hover:border-[#49406F]'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* User Account / Auth Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5 bg-[#16161B] p-0.5 rounded-xl border border-[#292932]">
              <div className="flex items-center gap-2 pl-2 pr-2.5 py-1">
                <div className="w-6 h-6 rounded-lg bg-[#6558F5] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-semibold text-[#F4F4F5] hidden sm:inline max-w-[90px] truncate">
                  {user.name}
                </span>
              </div>
              <button
                onClick={() => dispatch(logout())}
                title="Log out"
                className="h-8 w-8 flex items-center justify-center text-[#71717A] hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => dispatch(openAuthModal())}
              className="h-9 px-3.5 bg-[#6558F5] hover:bg-[#7568FF] text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 border border-[#8B7CFF]/40 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden h-9 w-9 flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#16161B] rounded-xl border border-[#292932] transition-all shrink-0 cursor-pointer"
            title="Toggle Navigation Menu"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE DRAWER ACCORDION (Viewports < lg: 1024px)          */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden pt-3 pb-3 border-t border-[#222229] mt-2.5 space-y-4 animate-fadeIn">
          
          {/* 1. Mobile Primary Views */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider px-1 mb-1">
              Main Views
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#211C38] text-[#8B7CFF] border border-[#49406F]'
                        : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#16161B] border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#8B7CFF]' : 'text-[#71717A]'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              {isAuthenticated && (
                <button
                  onClick={() => handleNavClick(settingsNavItem.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                    activeTab === settingsNavItem.id
                      ? 'bg-[#211C38] text-[#8B7CFF] border border-[#49406F]'
                      : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#16161B] border border-transparent'
                  }`}
                >
                  <Settings className={`w-4 h-4 shrink-0 ${activeTab === settingsNavItem.id ? 'text-[#8B7CFF]' : 'text-[#71717A]'}`} />
                  <span>{settingsNavItem.label}</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Mobile Topic Switcher */}
          <div className="space-y-2 pt-2 border-t border-[#222229]">
            <div className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider px-1 flex items-center justify-between">
              <span>Current Topic Focus</span>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-[11px] text-[#8B7CFF] font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Custom
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddTopic} className="flex items-center gap-1.5 py-1">
                <input
                  type="text"
                  autoFocus
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="New topic name..."
                  className="flex-1 text-xs px-3 py-1.5 bg-[#16161B] border border-[#292932] rounded-xl text-[#F4F4F5] placeholder:text-[#71717A] focus:outline-none focus:border-[#8B7CFF]"
                />
                <button
                  type="submit"
                  disabled={!newTopicName.trim()}
                  className="px-3 py-1.5 bg-[#6558F5] text-white rounded-xl text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Add
                </button>
              </form>
            )}

            <div className="grid grid-cols-2 gap-2">
              {topics.slice(0, 6).map((topic) => {
                const isSelected = activeTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicClick(topic)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#211C38] text-[#8B7CFF] border border-[#49406F]'
                        : 'bg-[#16161B] text-[#A1A1AA] hover:text-[#F4F4F5] border border-[#222229]'
                    }`}
                  >
                    <span className="text-base">{topic.icon || '🎓'}</span>
                    <span className="truncate capitalize">{topic.canonical_topic || topic.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Mobile Preferences & Account */}
          <div className="pt-2 border-t border-[#222229] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleCodingLanguage}
                className="h-8 px-2.5 bg-[#16161B] hover:bg-[#1C1C23] text-[#F4F4F5] rounded-lg border border-[#292932] flex items-center gap-1 text-[11px] font-medium cursor-pointer"
              >
                <Code2 className="w-3 h-3 text-[#8B7CFF]" />
                <span>{targetLanguage === 'cpp' ? 'C++' : targetLanguage === 'js' ? 'JS' : 'Python'}</span>
              </button>
              <button
                onClick={toggleExplanationLanguage}
                className="h-8 px-2.5 bg-[#16161B] hover:bg-[#1C1C23] text-[#F4F4F5] rounded-lg border border-[#292932] flex items-center gap-1 text-[11px] font-medium cursor-pointer"
              >
                <Globe className="w-3 h-3 text-[#8B7CFF]" />
                <span>{explanationLanguage === 'hinglish' ? 'Hinglish' : 'English'}</span>
              </button>
            </div>

            {isAuthenticated && (
              <button
                onClick={() => {
                  dispatch(logout());
                  setMobileMenuOpen(false);
                }}
                className="h-8 px-3 flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/60 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
