import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTopic, setTargetLevel, setActiveTab, openAuthModal, setTargetLanguage, setExplanationLanguage } from '../user/userSlice';
import { skipDiagnostic } from '../diagnostic/diagnosticSlice';
import { useUserTopics } from '../../hooks/useUserTopics';
import { useLearningPath } from '../../hooks/useLearningPath';
import { useDiagnostic } from '../../hooks/useDiagnostic';
import { TopicChoiceModal } from './TopicChoiceModal';
import { DsaTopicSearchPicker } from './DsaTopicSearchPicker';
import { Skeleton } from '../../components/ui/Skeleton';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Brain,
  PlusCircle,
  Search,
  Play,
  Map,
  Trash2,
  BookOpen,
  Code2,
  Globe,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react';

export function OnboardingView() {
  const dispatch = useDispatch();
  const { activeTopic, isAuthenticated, targetLanguage, explanationLanguage } = useSelector((state) => state.user);
  const {
    topics,
    selectOrCreateTopic,
    deleteTopic,
    isLoading: isTopicsLoading,
    error: topicsError,
    clearError,
    fetchTopics
  } = useUserTopics();
  const { generatePath, isGenerating } = useLearningPath();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTopicData, setModalTopicData] = useState(null);

  const { startDiagnosticAsync } = useDiagnostic();

  const codingLanguages = [
    { id: 'python', label: 'Python', icon: '🐍' },
    { id: 'cpp', label: 'C++', icon: '⚡' },
    { id: 'js', label: 'JavaScript', icon: '🟨' },
  ];

  const userLanguages = [
    { id: 'english', label: 'English', icon: '🇬🇧' },
    { id: 'hinglish', label: 'Hinglish', icon: '🇮🇳' },
  ];

  const handleSelectTopicCard = async (topic) => {
    dispatch(setActiveTopic(topic.id));
    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }

    if (topic.is_completed || topic.mode_choice === 'beginner') {
      dispatch(setActiveTab('path'));
      return;
    }

    if (topic.mode_choice === 'diagnostic') {
      try {
        await startDiagnosticAsync(topic.topic_id || topic.canonical_topic || topic.name || topic.id);
      } catch (err) {
        console.error('Failed to start diagnostic chat session:', err);
      }
      return;
    }

    try {
      const topicArg = topic.topic_id
        ? { topic_id: topic.topic_id, category_id: topic.category_id, name: topic.canonical_topic || topic.name }
        : (topic.canonical_topic || topic.name || topic.id);
      const topicData = await selectOrCreateTopic(topicArg);
      if (topicData?.mode_choice === 'diagnostic') {
        await startDiagnosticAsync(topicData.topic_id || topicData.canonical_topic);
        return;
      } else if (topicData?.mode_choice === 'beginner' || topicData?.is_completed) {
        dispatch(setActiveTab('path'));
        return;
      }

      setModalTopicData(topicData || {
        canonical_topic: topic.name || topic.canonical_topic,
        topic_slug: topic.topic_id || topic.id,
        topic_id: topic.topic_id,
        category_id: topic.category_id,
        category_name: topic.category_name,
      });
      setIsModalOpen(true);
    } catch (e) {
      console.error('Topic selection failed:', e);
    }
  };

  const handleRemoveTopic = async (e, topicId) => {
    e.stopPropagation();
    await deleteTopic(topicId);
  };

  const handleSelectTopicName = async (topicArg) => {
    if (!topicArg) return;
    const isObj = typeof topicArg === 'object' && topicArg !== null;
    const cleanName = isObj ? (topicArg.name || topicArg.topic || topicArg.topic_id) : topicArg.trim();
    if (!cleanName) return;

    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }

    try {
      const topicData = await selectOrCreateTopic(topicArg);

      if (topicData?.mode_choice === 'diagnostic') {
        dispatch(setActiveTopic(topicData.topic_slug));
        await startDiagnosticAsync(topicData.topic_id || topicData.canonical_topic);
        return;
      } else if (topicData?.mode_choice === 'beginner' || topicData?.is_completed) {
        dispatch(setActiveTopic(topicData.topic_slug));
        dispatch(setActiveTab('path'));
        return;
      }

      setModalTopicData(topicData || {
        canonical_topic: cleanName,
        raw_input_topic: cleanName,
        topic_slug: topicArg?.topic_id || cleanName.toLowerCase(),
        topic_id: topicArg?.topic_id,
        category_id: topicArg?.category_id,
        category_name: topicArg?.category || topicArg?.category_name,
      });
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to create/select topic:', err);
    }
  };

  const handleOptOut = () => {
    dispatch(setTargetLevel('beginner'));
    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }
    dispatch(skipDiagnostic());
    generatePath();
  };

  return (
    <div className="max-w-[1440px] mx-auto w-full py-6 sm:py-8 px-4 sm:px-6 space-y-6 sm:space-y-8 animate-fadeIn text-[#F4F4F5]">
      
      {/* ========================================================= */}
      {/* 1. HERO PAGE HEADING                                      */}
      {/* ========================================================= */}
      <div className="text-center space-y-3.5 max-w-2xl mx-auto">
        <Badge variant="ai" size="md" className="mx-auto shadow-xs py-1 px-3">
          <Sparkles className="w-3.5 h-3.5 text-[#8B7CFF] mr-1.5" />
          Adaptive Curriculum Engine
        </Badge>
        <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#F4F4F5] leading-[1.15]">
          Explore & Master <span className="gradient-text">DSA Topics</span>
        </h2>
        <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed max-w-xl mx-auto">
          Search dynamically from 60 curated DSA modules or continue your saved learning topics.
        </p>
      </div>

      {/* ========================================================= */}
      {/* 2. GLOBAL LANGUAGE PREFERENCES CARD                      */}
      {/* ========================================================= */}
      <Card className="bg-[#111114] border border-[#292932] shadow-subtle p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[#222229] pb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8B7CFF]" />
            <h3 className="font-extrabold text-sm sm:text-base text-[#F4F4F5]">Global Language Preferences</h3>
          </div>
          <p className="text-[11px] sm:text-xs text-[#71717A]">
            Customize coding language and explanation mode for lessons and questions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-1">
          {/* Coding Language Picker */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-[#8B7CFF]" /> Coding Language:
            </span>
            <div className="flex items-center gap-2">
              {codingLanguages.map((lang) => {
                const isSelected = (targetLanguage || 'python') === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => dispatch(setTargetLanguage(lang.id))}
                    className={`flex-1 h-10.5 flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#211C38] text-[#8B7CFF] border-[#49406F] shadow-xs font-bold'
                        : 'bg-[#16161B] text-[#A1A1AA] border-[#292932] hover:bg-[#1C1C23] hover:text-[#F4F4F5] hover:border-[#3E3E4A]'
                    }`}
                  >
                    <span>{lang.icon}</span>
                    <span>{lang.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Language (Explanation Language) Picker */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#8B7CFF]" /> User Language:
            </span>
            <div className="flex items-center gap-2">
              {userLanguages.map((lang) => {
                const isSelected = (explanationLanguage || 'english') === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => dispatch(setExplanationLanguage(lang.id))}
                    className={`flex-1 h-10.5 flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#211C38] text-[#8B7CFF] border-[#49406F] shadow-xs font-bold'
                        : 'bg-[#16161B] text-[#A1A1AA] border-[#292932] hover:bg-[#1C1C23] hover:text-[#F4F4F5] hover:border-[#3E3E4A]'
                    }`}
                  >
                    <span>{lang.icon}</span>
                    <span>{lang.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================= */}
      {/* 3. DYNAMIC DSA TOPIC SEARCH & LISTING PICKER             */}
      {/* ========================================================= */}
      <DsaTopicSearchPicker
        onSelectTopic={handleSelectTopicName}
        isLoading={isTopicsLoading}
      />

      {/* ========================================================= */}
      {/* 4. YOUR LEARNING TOPICS SECTION                           */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#211C38] text-[#8B7CFF] border border-[#49406F] flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h3 className="font-bold text-base sm:text-lg text-[#F4F4F5]">Your Learning Topics</h3>
            {topics.length > 0 && (
              <span className="text-xs font-semibold text-[#8B7CFF] bg-[#211C38] px-2 py-0.5 rounded-full border border-[#49406F]">
                {topics.length}
              </span>
            )}
          </div>
          {topics.length > 0 && (
            <span className="text-xs text-[#71717A] hidden sm:inline">Click topic to choose diagnostic or beginner mode</span>
          )}
        </div>

        {/* Error Alert if Topic Fetching Failed */}
        {topicsError && (
          <div className="p-4 rounded-2xl bg-[#2D1214] border border-[#5C1D24] text-rose-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn shadow-2xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-rose-200">
                  {topicsError?.status === 401
                    ? 'Authentication required or session expired'
                    : 'Failed to synchronize learning topics'}
                </p>
                <p className="text-xs text-rose-300/80">
                  {topicsError?.message ||
                    (topicsError?.response?.data?.detail
                      ? String(topicsError.response.data.detail)
                      : 'An error occurred while communicating with the server.')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {topicsError?.status === 401 ? (
                <Button
                  size="sm"
                  onClick={() => dispatch(openAuthModal())}
                  className="bg-[#6558F5] hover:bg-[#7568FF] text-white font-semibold text-xs"
                >
                  Sign In
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={fetchTopics}
                  className="font-semibold text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
                </Button>
              )}
              <button
                onClick={clearError}
                className="p-1 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 transition-colors cursor-pointer"
                title="Dismiss message"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {isTopicsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4 bg-[#111114] border border-[#222229] shadow-sm animate-pulse">
                <div className="flex items-start gap-3">
                  <Skeleton width="3rem" height="3rem" className="rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height="1rem" />
                    <Skeleton width="80%" height="0.75rem" />
                    <Skeleton width="40%" height="0.75rem" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : topics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topics.map((topic) => {
              const isSelected = activeTopic === topic.id;
              const isCompleted = topic.is_completed;

              return (
                <Card
                  key={topic.id}
                  hoverEffect
                  onClick={() => handleSelectTopicCard(topic)}
                  className={`cursor-pointer transition-all relative group/card p-5 ${
                    isSelected ? 'ring-1 ring-[#8B7CFF] bg-[#211C38]/40 border-[#49406F]' : 'bg-[#111114]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <span className="text-3xl shrink-0">{topic.icon || '🎓'}</span>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <h4 className="font-bold text-[#F4F4F5] capitalize text-sm sm:text-base truncate">
                            {topic.canonical_topic || topic.name}
                          </h4>
                          {isCompleted && (
                            <Badge variant="success" size="sm" className="shrink-0 text-[10px]">Done</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => handleRemoveTopic(e, topic.id)}
                            title="Remove topic"
                            className="p-1 rounded-lg text-[#71717A] hover:text-rose-400 hover:bg-rose-950/40 transition-colors opacity-0 group-hover/card:opacity-100 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {isSelected ? <CheckCircle2 className="w-4 h-4 text-[#8B7CFF]" /> : <Play className="w-4 h-4 text-[#8B7CFF] opacity-60" />}
                        </div>
                      </div>
                      <p className="text-xs text-[#A1A1AA] leading-relaxed line-clamp-2">{topic.description}</p>
                      
                      {topic.aliases && topic.aliases.length > 0 && (
                        <div className="text-[11px] text-[#71717A] flex flex-wrap gap-1 pt-0.5">
                          {topic.aliases.slice(0, 3).map((alias) => (
                            <span key={alias} className="px-1.5 py-0.5 bg-[#16161B] border border-[#292932] rounded text-[#A1A1AA] font-mono text-[10px]">
                              {alias}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-[#8B7CFF] hover:underline flex items-center gap-1">
                          {isCompleted ? (
                            <>Open Learning Path <Map className="w-3 h-3 text-emerald-400" /></>
                          ) : (
                            <>Choose Path Mode <ArrowRight className="w-3 h-3" /></>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center bg-[#111114] border border-[#222229] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#211C38] text-[#8B7CFF] flex items-center justify-center mx-auto border border-[#49406F]">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-[#F4F4F5]">No Saved Topics Yet</h4>
            <p className="text-xs text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
              Type any topic name in the box above (e.g. <em>Arrays, Strings, Trees, Dynamic Programming, System Design</em>) to launch your personalized AI diagnostic assessment!
            </p>
          </Card>
        )}
      </div>

      {/* ========================================================= */}
      {/* 5. OPT-OUT BANNER (BEGINNER TRACK)                       */}
      {/* ========================================================= */}
      <div className="bg-[#111114] border border-[#292932] text-[#F4F4F5] p-6 sm:p-8 rounded-2xl shadow-subtle">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <Badge variant="ai" size="sm">
              <Brain className="w-3.5 h-3.5 text-[#8B7CFF] mr-1" />
              Complete Beginner Option
            </Badge>
            <h3 className="text-lg sm:text-xl font-bold text-[#F4F4F5]">Want to skip knowledge assessment?</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              If you are starting from scratch without prior knowledge, opt out to start directly from absolute fundamentals.
            </p>
          </div>

          <div className="w-full md:w-auto shrink-0">
            <Button
              onClick={handleOptOut}
              isLoading={isGenerating}
              disabled={isGenerating}
              variant="secondary"
              size="md"
              className="w-full md:w-auto text-xs font-semibold cursor-pointer"
            >
              Skip & Start as Complete Beginner
            </Button>
          </div>
        </div>
      </div>

      {/* Choice Modal */}
      <TopicChoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        topicData={modalTopicData}
      />
    </div>
  );
}

export default OnboardingView;
