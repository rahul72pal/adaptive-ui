import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTopic, setTargetLevel, setTopicModeChoice, setTargetLanguage, setExplanationLanguage } from '../user/userSlice';
import { skipDiagnostic } from '../diagnostic/diagnosticSlice';
import { useDiagnostic } from '../../hooks/useDiagnostic';
import { useLearningPath } from '../../hooks/useLearningPath';
import { setTopicModeApi } from '../../api/topicsApi';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { X, Sparkles, MessageSquare, Brain, ArrowRight, Layers, Code2, Globe } from 'lucide-react';

export function TopicChoiceModal({ isOpen, onClose, topicData }) {
  const dispatch = useDispatch();
  const { targetLanguage, explanationLanguage } = useSelector((state) => state.user);
  const { startDiagnosticAsync, isStarting } = useDiagnostic();
  const { generatePath, isGenerating } = useLearningPath();

  if (!isOpen || !topicData) return null;

  const canonicalTopic = topicData.canonical_topic || topicData.raw_input_topic || topicData.topic_slug || 'Topic';
  const topicId = topicData.topic_id || topicData.topic_slug || canonicalTopic;
  const categoryId = topicData.category_id || null;
  const topicSlug = topicData.topic_slug || topicData.topic_id || canonicalTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const rawInput = topicData.raw_input_topic;
  const isAliasMatch = rawInput && canonicalTopic.toLowerCase() !== rawInput.toLowerCase();

  const codingLanguages = [
    { id: 'python', label: 'Python', icon: '🐍' },
    { id: 'cpp', label: 'C++', icon: '⚡' },
    { id: 'js', label: 'JavaScript', icon: '🟨' },
  ];

  const userLanguages = [
    { id: 'english', label: 'English', icon: '🇬🇧' },
    { id: 'hinglish', label: 'Hinglish', icon: '🇮🇳' },
  ];

  const handleStartDiagnosticChoice = async () => {
    dispatch(setActiveTopic(topicSlug));
    dispatch(setTopicModeChoice({ topicId: topicSlug, modeChoice: 'diagnostic' }));
    try {
      await setTopicModeApi({
        topic: topicId,
        mode_choice: 'diagnostic',
        category_id: categoryId,
      });
    } catch (err) {
      console.warn('Failed to save topic mode choice to server:', err);
    }
    try {
      await startDiagnosticAsync(topicId);
      onClose();
    } catch (err) {
      console.error('Failed to start diagnostic chat:', err);
    }
  };

  const handleStartBeginnerChoice = async () => {
    dispatch(setActiveTopic(topicSlug));
    dispatch(setTopicModeChoice({ topicId: topicSlug, modeChoice: 'beginner' }));
    try {
      await setTopicModeApi({
        topic: topicId,
        mode_choice: 'beginner',
        category_id: categoryId,
      });
    } catch (err) {
      console.warn('Failed to save topic mode choice to server:', err);
    }
    dispatch(setTargetLevel('beginner'));
    dispatch(skipDiagnostic());
    generatePath(topicId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#111114] rounded-3xl border border-[#292932] shadow-elevated p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto text-[#F4F4F5]">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isGenerating || isStarting}
          className="absolute top-5 right-5 p-2 text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#1C1C23] rounded-xl transition-all disabled:opacity-40 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-3">
          <Badge variant="ai" size="sm" className="mx-auto">
            <Sparkles className="w-3.5 h-3.5 text-[#8B7CFF]" />
            Topic Link & Language Setup
          </Badge>
          
          <h2 className="text-2xl font-extrabold text-[#F4F4F5] tracking-tight">
            Configure & Start <span className="gradient-text capitalize">{canonicalTopic}</span>
          </h2>
          {(topicData.category_name || topicData.category) && (
            <div className="inline-block text-xs text-[#8B7CFF] bg-[#211C38] px-2.5 py-0.5 rounded-full border border-[#49406F]">
              Category: {topicData.category_name || topicData.category}
            </div>
          )}

          {isAliasMatch && (
            <div className="flex items-center justify-center gap-2 text-xs text-[#8B7CFF] bg-[#211C38] px-3 py-1.5 rounded-xl border border-[#49406F]">
              <Layers className="w-3.5 h-3.5 text-[#8B7CFF] shrink-0" />
              <span>
                Mapped <strong>"{rawInput}"</strong> to canonical topic <strong>"{canonicalTopic}"</strong>
              </span>
            </div>
          )}

          <p className="text-xs text-[#A1A1AA] max-w-md mx-auto">
            Select your programming language and preferred explanation language before launching your learning path.
          </p>
        </div>

        {/* Language Selection Card */}
        <div className="bg-[#16161B] border border-[#292932] rounded-2xl p-4 space-y-4 shadow-xs">
          {/* Coding Language Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F4F4F5] flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-[#8B7CFF]" /> Coding Language
              </span>
              <span className="text-[11px] text-[#71717A]">Controls code syntax & examples</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {codingLanguages.map((lang) => {
                const isSelected = (targetLanguage || 'python') === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => dispatch(setTargetLanguage(lang.id))}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#211C38] text-[#8B7CFF] border-[#49406F] shadow-xs font-bold'
                        : 'bg-[#111114] text-[#A1A1AA] border-[#292932] hover:bg-[#1C1C23] hover:text-[#F4F4F5]'
                    }`}
                  >
                    <span>{lang.icon}</span>
                    <span>{lang.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Language (Explanation Language) Row */}
          <div className="space-y-2 pt-2 border-t border-[#222229]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F4F4F5] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#8B7CFF]" /> Explanation Language
              </span>
              <span className="text-[11px] text-[#71717A]">Controls lessons & questions</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {userLanguages.map((lang) => {
                const isSelected = (explanationLanguage || 'english') === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => dispatch(setExplanationLanguage(lang.id))}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-[#211C38] text-[#8B7CFF] border-[#49406F] shadow-xs font-bold'
                        : 'bg-[#111114] text-[#A1A1AA] border-[#292932] hover:bg-[#1C1C23] hover:text-[#F4F4F5]'
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

        {/* Path Choice Options */}
        <div className="grid grid-cols-1 gap-4 pt-1">
          {/* Option A: Diagnostic Chat */}
          <Card
            hoverEffect={!isGenerating && !isStarting}
            onClick={!isGenerating && !isStarting ? handleStartDiagnosticChoice : undefined}
            className={`cursor-pointer p-5 border border-[#292932] hover:border-[#49406F] bg-[#16161B] hover:bg-[#1C1C23] rounded-2xl group transition-all ${
              isStarting ? 'ring-1 ring-[#8B7CFF] bg-[#211C38]/40 border-[#49406F]' : isGenerating ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#6558F5] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                {isStarting ? <Sparkles className="w-5.5 h-5.5 text-white animate-spin" /> : <MessageSquare className="w-5.5 h-5.5" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[#F4F4F5] group-hover:text-[#8B7CFF] transition-colors">
                    {isStarting ? 'Initializing AI Assessment Session...' : '15-Message AI Diagnostic Chat'}
                  </h3>
                  <Badge variant="ai" size="sm">
                    {isStarting ? 'Loading...' : 'Recommended'}
                  </Badge>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  {isStarting
                    ? 'Connecting to backend engine and creating graph state session checkpoint...'
                    : 'Engage with our AI to evaluate your knowledge depth across levels (beginner, intermediate, advanced) and build a hyper-tailored learning path.'}
                </p>
                <div className="pt-2 flex items-center text-xs font-semibold text-[#8B7CFF] gap-1">
                  <span>{isStarting ? 'Launching Chat Session...' : 'Start Assessment Chat'}</span>
                  {isStarting ? (
                    <Sparkles className="w-4 h-4 animate-spin text-[#8B7CFF]" />
                  ) : (
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Option B: Complete Beginner */}
          <Card
            hoverEffect={!isGenerating && !isStarting}
            onClick={!isGenerating && !isStarting ? handleStartBeginnerChoice : undefined}
            className={`cursor-pointer p-5 border border-[#222229] hover:border-[#292932] bg-[#111114] hover:bg-[#16161B] rounded-2xl group transition-all ${
              isGenerating ? 'ring-1 ring-[#8B7CFF] bg-[#211C38]/40 border-[#49406F]' : isStarting ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-[#1C1C23] border border-[#292932] text-[#8B7CFF] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                {isGenerating ? <Sparkles className="w-5.5 h-5.5 text-[#8B7CFF] animate-spin" /> : <Brain className="w-5.5 h-5.5" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[#F4F4F5] group-hover:text-[#8B7CFF] transition-colors">
                    {isGenerating ? 'Generating Learning Graph...' : 'Skip & Start as Complete Beginner'}
                  </h3>
                  <Badge variant="default" size="sm">
                    {isGenerating ? 'Generating...' : 'Zero Knowledge'}
                  </Badge>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  {isGenerating
                    ? 'Connecting to curriculum engine and building your concept DAG node roadmap...'
                    : 'Skip diagnostic questions and jump straight into learning absolute fundamentals with an 8-node structured curriculum.'}
                </p>
                <div className="pt-2 flex items-center text-xs font-semibold text-[#A1A1AA] group-hover:text-[#F4F4F5] gap-1">
                  <span>{isGenerating ? 'Generating Learning Graph...' : 'Generate Beginner Path'}</span>
                  {isGenerating ? (
                    <Sparkles className="w-4 h-4 animate-spin text-[#8B7CFF]" />
                  ) : (
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TopicChoiceModal;
