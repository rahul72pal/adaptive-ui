import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTopic, addCustomTopic, setTargetLevel, setActiveTab, openAuthModal } from '../user/userSlice';
import { skipDiagnostic } from '../diagnostic/diagnosticSlice';
import { useDiagnostic } from '../../hooks/useDiagnostic';
import { useLearningPath } from '../../hooks/useLearningPath';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Sparkles, CheckCircle2, ArrowRight, Brain, PlusCircle, Search, Play, Map } from 'lucide-react';

const LEVELS = [
  { id: 'beginner', title: 'Beginner', desc: 'Starting fresh. Build solid core fundamentals step-by-step.' },
  { id: 'intermediate', title: 'Intermediate', desc: 'Have basic experience. Skip trivial concepts and deepen knowledge.' },
  { id: 'advanced', title: 'Advanced', desc: 'Building complex apps. Target architectural mastery and edge cases.' },
  { id: 'expert', title: 'Expert', desc: 'Targeting top 1% technical proficiency and deep internals.' },
];

export function OnboardingView() {
  const dispatch = useDispatch();
  const { activeTopic, targetLevel, topics = [], completedTopics = [], isAuthenticated } = useSelector((state) => state.user);
  const { startDiagnostic, isStarting } = useDiagnostic();
  const { generatePath, isGenerating } = useLearningPath();
  const [customTopicInput, setCustomTopicInput] = useState('');

  const handleSelectTopic = (topicId) => {
    dispatch(setActiveTopic(topicId));
    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }
    // If diagnostic chat for this topic is already completed, jump directly to Learning Path!
    if (completedTopics.includes(topicId)) {
      dispatch(setActiveTab('path'));
    } else {
      startDiagnostic();
    }
  };

  const handleAddCustomTopic = (e) => {
    e.preventDefault();
    if (!customTopicInput.trim()) return;
    const name = customTopicInput.trim();
    dispatch(addCustomTopic(name));
    setCustomTopicInput('');
    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }
    startDiagnostic();
  };

  const handleOptOut = () => {
    if (!isAuthenticated) {
      dispatch(openAuthModal());
      return;
    }
    dispatch(skipDiagnostic());
    generatePath();
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge variant="ai" size="lg" className="mx-auto shadow-sm">
          <Sparkles className="w-4 h-4 text-brand-600 animate-spin" style={{ animationDuration: '4s' }} />
          Adaptive Curriculum Engine
        </Badge>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-ink-primary">
          Select or Create Your <span className="gradient-text">Learning Topic</span>
        </h2>
        <p className="text-sm md:text-base text-ink-secondary leading-relaxed">
          Choose a topic or enter a custom one. Selecting a topic opens your personalized Learning Path or starts your AI Diagnostic Chat.
        </p>
      </div>

      {/* Manual Custom Topic Creation Input Card */}
      <Card className="bg-gradient-to-br from-brand-50 via-white to-purple-50/50 border-brand-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-brand-600" />
          <h3 className="font-bold text-base text-ink-primary">Search or Input Any Custom Topic</h3>
        </div>
        <p className="text-xs text-ink-secondary">
          Want to learn something specific? Type any custom topic (e.g. <em>Quantum Computing, Golang, Machine Learning, Docker, Next.js</em>) to build a custom curriculum.
        </p>

        <form onSubmit={handleAddCustomTopic} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-3" />
            <input
              type="text"
              value={customTopicInput}
              onChange={(e) => setCustomTopicInput(e.target.value)}
              placeholder="Enter custom topic name (e.g. Kubernetes, Rust, Machine Learning)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-ink-primary"
            />
          </div>
          <Button type="submit" isLoading={isStarting} disabled={!customTopicInput.trim()} size="md" className="w-full sm:w-auto font-bold shrink-0">
            <Sparkles className="w-4 h-4" />
            Start AI Diagnostic Chat
          </Button>
        </form>
      </Card>

      {/* Topic Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h3 className="font-bold text-lg text-ink-primary">Select Topic Focus</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((topic) => {
            const isSelected = activeTopic === topic.id;
            const isCompleted = completedTopics.includes(topic.id);

            return (
              <Card
                key={topic.id}
                hoverEffect
                onClick={() => handleSelectTopic(topic.id)}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-brand-600 bg-brand-50/50 border-brand-300' : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{topic.icon || '🎓'}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-ink-primary capitalize">{topic.name}</h4>
                        {isCompleted && (
                          <Badge variant="success" size="sm">Assessment Complete</Badge>
                        )}
                      </div>
                      {isSelected ? <CheckCircle2 className="w-5 h-5 text-brand-600" /> : <Play className="w-4 h-4 text-brand-600 opacity-60" />}
                    </div>
                    <p className="text-xs text-ink-secondary leading-relaxed">{topic.description}</p>
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-brand-700 hover:underline flex items-center gap-1">
                        {isCompleted ? (
                          <>Open Learning Path <Map className="w-3 h-3 text-emerald-600" /></>
                        ) : (
                          <>Start 15-Message Assessment <ArrowRight className="w-3 h-3" /></>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Target Mastery Level Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h3 className="font-bold text-lg text-ink-primary">Set Your Goal Mastery Level</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {LEVELS.map((level) => {
            const isSelected = targetLevel === level.id;
            return (
              <button
                key={level.id}
                onClick={() => dispatch(setTargetLevel(level.id))}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#6750a4] text-white border-[#6750a4] shadow-md transform -translate-y-0.5'
                    : 'bg-white text-ink-primary border-surface-variant hover:border-brand-300 hover:bg-brand-50/30'
                }`}
              >
                <div className={`font-bold text-sm mb-1 ${isSelected ? 'text-white' : 'text-ink-primary'}`}>{level.title}</div>
                <div className={`text-xs leading-relaxed ${isSelected ? 'text-purple-100' : 'text-ink-secondary'}`}>
                  {level.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Opt-Out Banner */}
      <div className="bg-gradient-to-r from-[#22005d] via-[#4f378a] to-[#6750a4] text-white p-8 rounded-2xl border-none shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge variant="ai" size="sm" className="bg-white/15 text-white border-white/30">
              <Brain className="w-3.5 h-3.5 text-purple-200" />
              Complete Beginner Option
            </Badge>
            <h3 className="text-xl font-bold text-white">Want to skip knowledge assessment?</h3>
            <p className="text-xs text-purple-100 max-w-xl leading-relaxed">
              If you are starting from scratch without prior knowledge, opt out to start directly from absolute fundamentals.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <Button
              onClick={handleOptOut}
              isLoading={isGenerating}
              variant="ghost"
              size="lg"
              className="bg-white/10 hover:bg-white/20 text-white w-full sm:w-auto text-xs font-bold border border-white/20"
            >
              Skip & Start as Complete Beginner
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
