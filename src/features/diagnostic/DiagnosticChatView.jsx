import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDiagnostic } from '../../hooks/useDiagnostic';
import { useLearningPath } from '../../hooks/useLearningPath';
import { skipDiagnostic } from './diagnosticSlice';
import { setActiveTab, markTopicDiagnosticCompleted, resetTopicDiagnostic, setTargetLevel } from '../user/userSlice';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import {
  Sparkles,
  Send,
  User,
  Bot,
  CheckCircle2,
  ArrowRight,
  Brain,
  ListCheck,
  Zap,
  RotateCcw,
  Target
} from 'lucide-react';

const LEVELS = [
  { id: 'beginner', title: 'Beginner', desc: 'Build solid core fundamentals step-by-step.' },
  { id: 'intermediate', title: 'Intermediate', desc: 'Skip trivial concepts and deepen core knowledge.' },
  { id: 'advanced', title: 'Advanced', desc: 'Target architectural patterns & complex edge cases.' },
  { id: 'expert', title: 'Expert', desc: 'Targeting top 1% technical proficiency and internals.' },
];

export function DiagnosticChatView() {
  const dispatch = useDispatch();
  const { messages, sendAnswer, isAnswering, turn, status, startDiagnostic } = useDiagnostic();
  const { knowledgeProfile, turnHistory = [] } = useSelector((state) => state.diagnostic);
  const { activeTopic, targetLevel } = useSelector((state) => state.user);
  const { generatePath, isGenerating } = useLearningPath();
  const [textInput, setTextInput] = useState('');

  const isFinished = status === 'completed' || status === 'skipped';
  const totalTurns = 15;

  // Mark topic diagnostic as completed
  useEffect(() => {
    if (isFinished && activeTopic) {
      dispatch(markTopicDiagnosticCompleted(activeTopic));
    }
  }, [isFinished, activeTopic, dispatch]);

  const handleOptionClick = (optionText) => {
    if (isAnswering) return;
    sendAnswer(optionText);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || isAnswering) return;
    sendAnswer(textInput.trim());
    setTextInput('');
  };

  const handleOptOut = () => {
    dispatch(skipDiagnostic());
    if (activeTopic) dispatch(markTopicDiagnosticCompleted(activeTopic));
    generatePath();
    dispatch(setActiveTab('path'));
  };

  const handleViewPath = () => {
    generatePath();
    dispatch(setActiveTab('path'));
  };

  const handleRetakeAssessment = () => {
    if (activeTopic) dispatch(resetTopicDiagnostic(activeTopic));
    startDiagnostic();
  };

  const knownConcepts = knowledgeProfile && typeof knowledgeProfile === 'object'
    ? Object.entries(knowledgeProfile)
        .filter(([_, data]) => typeof data === 'object' && ((data.confidence || 0) >= 0.8 || data.status === 'known'))
        .map(([conceptId]) => conceptId)
    : ['fundamentals', 'basics'];

  const weakConcepts = knowledgeProfile && typeof knowledgeProfile === 'object'
    ? Object.entries(knowledgeProfile)
        .filter(([_, data]) => typeof data === 'object' && (data.confidence || 0) < 0.8 && data.status !== 'known')
        .map(([conceptId]) => conceptId)
    : ['advanced_patterns', 'optimization'];

  const progressPercent = isFinished ? 100 : Math.min(100, Math.round((turn / totalTurns) * 100));

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 animate-fadeIn">
      {/* Diagnostic Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-surface-variant shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="ai" size="sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              15-Turn AI Assessment
            </Badge>
            <span className="text-xs text-ink-muted">
              {isFinished ? 'Session Complete' : `Message Turn ${turn} of ${totalTurns}`}
            </span>
          </div>
          <h2 className="text-lg font-bold text-ink-primary capitalize">
            {activeTopic} Diagnostic Probe
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-64">
          <ProgressBar progress={progressPercent} className="flex-1" />
          {!isFinished && (
            <Button
              onClick={handleOptOut}
              variant="ghost"
              size="sm"
              className="text-xs text-ink-muted hover:text-ink-primary whitespace-nowrap"
            >
              Opt-Out
            </Button>
          )}
        </div>
      </div>

      {/* Diagnostic Completed View with Turn-by-Turn Chat Summaries */}
      {isFinished ? (
        <div className="space-y-6">
          {/* Main Knowledge Profile Summary Card */}
          <Card className="gradient-btn text-white p-8 space-y-6 border-none shadow-xl rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 mb-1">
                    15-Message Diagnostic Complete
                  </Badge>
                  <h3 className="text-2xl font-bold text-white">Your Knowledge Summary is Ready</h3>
                </div>
              </div>

              <Button
                onClick={handleRetakeAssessment}
                variant="ghost"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 hidden sm:flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-take Diagnostic
              </Button>
            </div>

            <p className="text-sm text-purple-100 leading-relaxed bg-white/10 p-4 rounded-xl border border-white/10">
              Lumina AI evaluated your 15 chat responses, summarized your feedback, and automatically created your Concept Graph and Learning Path below.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                <div className="text-xs font-semibold text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Verified Known Concepts
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {knownConcepts.map((c) => (
                    <span key={c} className="text-xs bg-emerald-500/20 text-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-400/20 font-medium">
                      ✓ {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                <div className="text-xs font-semibold text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Target Learning Focus Areas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {weakConcepts.map((c) => (
                    <span key={c} className="text-xs bg-amber-500/20 text-amber-200 px-2.5 py-1 rounded-lg border border-amber-400/20 font-medium">
                      ⚡ {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Select Target Goal Level Section */}
            <div className="bg-white/10 p-5 rounded-2xl border border-white/15 space-y-3">
              <div className="flex items-center gap-2 text-white">
                <Target className="w-5 h-5 text-purple-200" />
                <h4 className="font-bold text-base">Select Goal Mastery Level for Your Curriculum</h4>
              </div>
              <p className="text-xs text-purple-100">
                Choose the target proficiency depth for your personalized learning path:
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {LEVELS.map((lvl) => {
                  const isSelected = targetLevel === lvl.id;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => dispatch(setTargetLevel(lvl.id))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-white text-[#22005d] border-white font-bold shadow-md scale-[1.02]'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                    >
                      <div className="text-xs font-bold mb-0.5">{lvl.title}</div>
                      <div className={`text-[11px] leading-tight ${isSelected ? 'text-[#331177]' : 'text-purple-200'}`}>
                        {lvl.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                onClick={handleViewPath}
                isLoading={isGenerating}
                size="lg"
                className="w-full bg-white text-[#22005d] hover:bg-purple-50 shadow-lg font-bold text-base flex-1"
              >
                Generate & View Learning Path ({targetLevel ? targetLevel.toUpperCase() : 'EXPERT'})
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleRetakeAssessment}
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 sm:hidden"
              >
                <RotateCcw className="w-4 h-4" /> Re-take Diagnostic
              </Button>
            </div>
          </Card>

          {/* Turn-by-Turn Diagnostic Chat Summary & AI Feedback List */}
          <div className="bg-white rounded-2xl border border-surface-variant p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-surface-variant pb-3">
              <div className="flex items-center gap-2">
                <ListCheck className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-base text-ink-primary">
                  Detailed Summary of Each Chat Turn & AI Feedback
                </h3>
              </div>
              <button
                onClick={handleRetakeAssessment}
                className="text-xs font-bold text-brand-700 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-take Assessment
              </button>
            </div>

            <div className="space-y-4">
              {turnHistory.length > 0 ? (
                turnHistory.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-surface-container/60 border border-surface-variant space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-brand-700">
                      <span>Chat Message #{item.turn || idx + 1}</span>
                      <Badge variant="ai" size="sm">Turn Evaluated</Badge>
                    </div>

                    <div className="text-xs text-ink-primary font-medium">
                      <strong className="text-ink-secondary">AI Question:</strong> {item.question}
                    </div>

                    <div className="text-xs text-brand-900 bg-brand-50/70 p-2.5 rounded-lg border border-brand-200">
                      <strong>Your Answer:</strong> {item.userAnswer}
                    </div>

                    <div className="text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 flex items-start gap-2">
                      <Brain className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>AI Assessment & Feedback:</strong> {item.feedback}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-ink-muted text-center py-4">
                  Chat diagnostic completed. Concept graph and learning path auto-generated above!
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Chat Messages Container */
        <div className="bg-white rounded-2xl border border-surface-variant p-4 sm:p-6 shadow-subtle space-y-6 min-h-[440px] flex flex-col justify-between">
          <div className="space-y-4 overflow-y-auto max-h-[460px] pr-2">
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isAi ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isAi ? 'gradient-btn text-white' : 'bg-surface-container text-ink-primary border border-surface-variant'
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className={`space-y-3 max-w-[85%] ${isAi ? '' : 'items-end'}`}>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isAi
                          ? 'bg-surface-container text-ink-primary rounded-tl-sm border border-surface-variant'
                          : 'bg-brand-600 text-white rounded-tr-sm shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Option Chips for AI Questions */}
                    {isAi && msg.options && msg.options.length > 0 && (
                      <div className="flex flex-col gap-2 pt-1">
                        {msg.options.map((opt, idx) => (
                          <button
                            key={idx}
                            disabled={isAnswering}
                            onClick={() => handleOptionClick(opt)}
                            className="text-left text-xs font-medium px-4 py-2.5 rounded-xl bg-white border border-brand-200 text-brand-800 hover:bg-brand-50 hover:border-brand-400 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="text-[10px] text-ink-muted block px-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {isAnswering && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl gradient-btn text-white flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-surface-container px-4 py-3 rounded-2xl text-xs text-ink-muted border border-surface-variant flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
                  Analyzing response and recording knowledge profile feedback...
                </div>
              </div>
            )}
          </div>

          {/* Custom Text Input Form */}
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2 pt-3 border-t border-surface-variant">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your response to the AI question..."
              disabled={isAnswering}
              className="flex-1 bg-surface-container border border-surface-variant rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-ink-primary placeholder:text-ink-muted"
            />
            <Button type="submit" isLoading={isAnswering} disabled={!textInput.trim()} size="md">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
