import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDiagnostic } from '../../hooks/useDiagnostic';
import { useLearningPath } from '../../hooks/useLearningPath';
import { skipDiagnostic } from './diagnosticSlice';
import { setActiveTab, markTopicDiagnosticCompleted, resetTopicDiagnostic, setTargetLevel } from '../user/userSlice';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
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
  const { messages, sendAnswer, isAnswering, turn, status, startDiagnostic, isStarting, isLoadingSession, sessionId } = useDiagnostic();
  const { knowledgeProfile, turnHistory = [] } = useSelector((state) => state.diagnostic);
  const { activeTopic, targetLevel } = useSelector((state) => state.user);
  const { generatePath, isGenerating } = useLearningPath();
  const [textInput, setTextInput] = useState('');
  const messagesEndRef = useRef(null);

  const isFinished = status === 'completed' || status === 'skipped';
  const totalTurns = 15;

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Auto-scroll to bottom whenever messages or isAnswering state changes
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isAnswering]);

  // Auto-start/resume diagnostic session if messages are empty when opening view
  useEffect(() => {
    if (
      !sessionId &&
      messages.length === 0 &&
      activeTopic &&
      status !== 'completed' &&
      status !== 'skipped' &&
      !isStarting &&
      !isLoadingSession
    ) {
      startDiagnostic(activeTopic);
    }
  }, [sessionId, messages.length, activeTopic, status, isStarting, isLoadingSession, startDiagnostic]);

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
  };

  const handleViewPath = () => {
    generatePath();
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

  if ((isStarting || isLoadingSession) && messages.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4 animate-fadeIn text-[#F4F4F5]">
        <div className="w-14 h-14 rounded-2xl bg-[#6558F5] border border-[#8B7CFF]/40 flex items-center justify-center mx-auto shadow-elevated">
          <Sparkles className="w-7 h-7 text-white animate-spin" />
        </div>
        <h3 className="text-xl font-extrabold text-[#F4F4F5]">Initializing AI Assessment Session...</h3>
        <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
          Please wait while Lumina AI prepares your diagnostic questions and state checkpoints.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 animate-fadeIn text-[#F4F4F5]">
      {/* Diagnostic Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111114] p-5 rounded-2xl border border-[#292932] shadow-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="ai" size="sm">
              <Sparkles className="w-3.5 h-3.5 text-[#8B7CFF]" />
              15-Turn AI Assessment
            </Badge>
            <span className="text-xs text-[#71717A]">
              {isFinished ? 'Session Complete' : `Message Turn ${turn} of ${totalTurns}`}
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#F4F4F5] capitalize">
            {activeTopic} Diagnostic Probe
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-64">
          <ProgressBar progress={progressPercent} className="flex-1" />
          {!isFinished && (
            <Button
              onClick={handleOptOut}
              isLoading={isGenerating}
              disabled={isGenerating}
              variant="ghost"
              size="sm"
              className="text-xs text-[#A1A1AA] hover:text-[#F4F4F5] whitespace-nowrap cursor-pointer"
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
          <Card className="bg-[#111114] border border-[#49406F] text-[#F4F4F5] p-6 sm:p-8 space-y-6 shadow-elevated rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <Badge variant="success" size="sm" className="mb-1">
                    15-Message Diagnostic Complete
                  </Badge>
                  <h3 className="text-2xl font-bold text-[#F4F4F5]">Your Knowledge Summary is Ready</h3>
                </div>
              </div>

              <Button
                onClick={handleRetakeAssessment}
                variant="secondary"
                size="sm"
                className="hidden sm:flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-take Diagnostic
              </Button>
            </div>

            <p className="text-sm text-[#A1A1AA] leading-relaxed bg-[#16161B] p-4 rounded-xl border border-[#292932]">
              Lumina AI evaluated your 15 chat responses, summarized your feedback, and automatically created your Concept Graph and Learning Path below.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#16161B] p-4 rounded-xl border border-emerald-900/60 space-y-2">
                <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Verified Known Concepts
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {knownConcepts.map((c) => (
                    <span key={c} className="text-xs bg-emerald-950/60 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-800/60 font-medium">
                      ✓ {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#16161B] p-4 rounded-xl border border-amber-900/60 space-y-2">
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Target Learning Focus Areas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {weakConcepts.map((c) => (
                    <span key={c} className="text-xs bg-amber-950/60 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-800/60 font-medium">
                      ⚡ {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Select Target Goal Level Section */}
            <div className="bg-[#16161B] p-5 rounded-2xl border border-[#292932] space-y-3">
              <div className="flex items-center gap-2 text-[#F4F4F5]">
                <Target className="w-5 h-5 text-[#8B7CFF]" />
                <h4 className="font-bold text-base">Select Goal Mastery Level for Your Curriculum</h4>
              </div>
              <p className="text-xs text-[#A1A1AA]">
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
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#211C38] text-[#8B7CFF] border-[#49406F] font-bold shadow-xs'
                          : 'bg-[#111114] text-[#A1A1AA] border-[#292932] hover:bg-[#1C1C23] hover:text-[#F4F4F5]'
                      }`}
                    >
                      <div className="text-xs font-bold mb-0.5">{lvl.title}</div>
                      <div className={`text-[11px] leading-tight ${isSelected ? 'text-[#8B7CFF]/80' : 'text-[#71717A]'}`}>
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
                disabled={isGenerating}
                size="lg"
                className="w-full flex-1 font-bold text-sm cursor-pointer"
              >
                Generate & View Learning Path ({targetLevel ? targetLevel.toUpperCase() : 'EXPERT'})
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button
                onClick={handleRetakeAssessment}
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto text-xs font-bold sm:hidden cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" /> Re-take Diagnostic
              </Button>
            </div>
          </Card>

          {/* Turn-by-Turn Diagnostic Chat Summary & AI Feedback List */}
          <div className="bg-[#111114] rounded-2xl border border-[#292932] p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-[#222229] pb-3">
              <div className="flex items-center gap-2">
                <ListCheck className="w-5 h-5 text-[#8B7CFF]" />
                <h3 className="font-bold text-base text-[#F4F4F5]">
                  Detailed Summary of Each Chat Turn & AI Feedback
                </h3>
              </div>
              <button
                onClick={handleRetakeAssessment}
                className="text-xs font-semibold text-[#8B7CFF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-take Assessment
              </button>
            </div>

            <div className="space-y-4">
              {turnHistory.length > 0 ? (
                turnHistory.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#16161B] border border-[#292932] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#8B7CFF]">
                      <span>Chat Message #{item.turn || idx + 1}</span>
                      <Badge variant="ai" size="sm">Turn Evaluated</Badge>
                    </div>

                    <div className="text-xs text-[#F4F4F5] font-medium">
                      <strong className="text-[#A1A1AA] block mb-1">AI Question:</strong>
                      <MarkdownRenderer content={item.question} />
                    </div>

                    <div className="text-xs text-[#8B7CFF] bg-[#211C38] p-2.5 rounded-lg border border-[#49406F]">
                      <strong className="text-[#F4F4F5] block mb-1">Your Answer:</strong>
                      {item.userAnswer}
                    </div>

                    <div className="text-xs text-emerald-300 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-900/60 flex items-start gap-2">
                      <Brain className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="text-emerald-200 block mb-1">AI Assessment & Feedback:</strong>
                        <MarkdownRenderer content={item.feedback} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#71717A] text-center py-4">
                  Chat diagnostic completed. Concept graph and learning path auto-generated above!
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Chat Messages Container */
        <div className="bg-[#111114] rounded-2xl border border-[#292932] p-4 sm:p-6 shadow-subtle space-y-6 min-h-[440px] flex flex-col justify-between">
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
                      isAi ? 'bg-[#6558F5] text-white border border-[#8B7CFF]/40' : 'bg-[#16161B] text-[#F4F4F5] border border-[#292932]'
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className={`space-y-3 max-w-[85%] ${isAi ? '' : 'items-end'}`}>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isAi
                          ? 'bg-[#16161B] text-[#F4F4F5] rounded-tl-sm border border-[#222229]'
                          : 'bg-[#211C38] text-[#F4F4F5] rounded-tr-sm border border-[#49406F] shadow-xs'
                      }`}
                    >
                      {isAi ? (
                        <MarkdownRenderer content={msg.text} />
                      ) : (
                        msg.text
                      )}
                    </div>

                    {/* Option Chips / Structured user_input for AI Questions */}
                    {isAi && (
                      (msg.userInput && msg.userInput.type === 'single_select' && msg.userInput.options?.length > 0) ||
                      (msg.options && msg.options.length > 0)
                    ) && (
                      <div className="flex flex-col gap-2 pt-1">
                        {(msg.userInput?.options || msg.options).map((opt, idx) => {
                          const optText = typeof opt === 'object' ? (opt.label || opt.text || opt.value) : opt;
                          return (
                            <button
                              key={idx}
                              disabled={isAnswering}
                              onClick={() => handleOptionClick(optText)}
                              className="text-left text-xs font-medium px-4 py-2.5 rounded-xl bg-[#16161B] border border-[#292932] text-[#F4F4F5] hover:bg-[#211C38] hover:border-[#49406F] hover:text-[#8B7CFF] transition-all shadow-xs active:scale-[0.99] disabled:opacity-40 cursor-pointer"
                            >
                              {optText}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <span className="text-[10px] text-[#71717A] block px-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {isAnswering && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#6558F5] text-white flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-[#16161B] px-4 py-3 rounded-2xl text-xs text-[#A1A1AA] border border-[#222229] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#8B7CFF] animate-pulse" />
                  Analyzing response and recording knowledge profile feedback...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Custom Text Input Form */}
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2 pt-3 border-t border-[#222229]">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type your response to the AI question..."
              disabled={isAnswering}
              className="flex-1 bg-[#16161B] border border-[#292932] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF]/30 text-[#F4F4F5] placeholder:text-[#71717A]"
            />
            <Button type="submit" isLoading={isAnswering} disabled={!textInput.trim()} size="md" className="cursor-pointer">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

export default DiagnosticChatView;
