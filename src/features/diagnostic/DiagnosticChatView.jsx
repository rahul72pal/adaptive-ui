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
import { DiagnosticKnowledgeProfile } from './DiagnosticKnowledgeProfile';
import { parseRoute } from '../../App';
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
  Target,
  BarChart3,
  X
} from 'lucide-react';

const LEVELS = [
  { id: 'beginner', title: 'Beginner', desc: 'Build solid core fundamentals step-by-step.' },
  { id: 'intermediate', title: 'Intermediate', desc: 'Skip trivial concepts and deepen core knowledge.' },
  { id: 'advanced', title: 'Advanced', desc: 'Target architectural patterns & complex edge cases.' },
  { id: 'expert', title: 'Expert', desc: 'Targeting top 1% technical proficiency and internals.' },
];

export function DiagnosticChatView() {
  const dispatch = useDispatch();
  const {
    messages,
    sendAnswer,
    isAnswering,
    turn,
    status,
    startDiagnostic,
    loadSession,
    isStarting,
    isLoadingSession,
    sessionId,
    knowledgeProfile,
    currentConcept,
    lastFeedback,
    lastEvaluatedConcept,
    streamingStatus
  } = useDiagnostic();

  const { turnHistory = [] } = useSelector((state) => state.diagnostic);
  const { activeTopic, targetLevel } = useSelector((state) => state.user);
  const { generatePath, isGenerating } = useLearningPath();
  const [textInput, setTextInput] = useState('');
  const [showMobileProfile, setShowMobileProfile] = useState(false);
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

  // Auto-start or resume diagnostic session if messages are empty when opening view
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
      const parsed = parseRoute(window.location.hash);
      const topicUnder = activeTopic.replace(/-/g, '_');
      const topicHyphen = activeTopic.replace(/_/g, '-');
      const cachedSessionId =
        localStorage.getItem(`adaptive_diag_session_${activeTopic}`) ||
        localStorage.getItem(`adaptive_diag_session_${topicUnder}`) ||
        localStorage.getItem(`adaptive_diag_session_${topicHyphen}`);
      const targetSessionId = urlSessionId || cachedSessionId;

      if (targetSessionId) {
        loadSession(targetSessionId);
      } else {
        startDiagnostic(activeTopic);
      }
    }
  }, [sessionId, messages.length, activeTopic, status, isStarting, isLoadingSession, startDiagnostic, loadSession]);

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
    <div className="w-full h-[100vh] flex flex-col space-y-3 animate-fadeIn text-[#F4F4F5]">
      {/* Diagnostic Header & Progress */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111114] px-4 py-3 rounded-2xl border border-[#292932] shadow-subtle">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Badge variant="ai" size="sm">
              <Sparkles className="w-3.5 h-3.5 text-[#8B7CFF]" />
              15-Turn AI Stream Diagnostic
            </Badge>
            <span className="text-xs text-[#71717A]">
              {isFinished ? 'Session Complete' : `Message Turn ${turn} of ${totalTurns}`}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#F4F4F5] capitalize flex items-center gap-2">
            {activeTopic} Diagnostic Assessment
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-56">
            <ProgressBar progress={progressPercent} />
          </div>

          {!isFinished && (
            <>
              {/* Mobile Profile Toggle Button */}
              <button
                type="button"
                onClick={() => setShowMobileProfile(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#211C38] border border-[#49406F] text-xs font-semibold text-[#8B7CFF] hover:bg-[#2e264e] transition-all cursor-pointer whitespace-nowrap"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Profile
              </button>

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
            </>
          )}
        </div>
      </div>

      {/* Diagnostic Completed View with Turn-by-Turn Chat Summaries */}
      {isFinished ? (
        <div className="flex-1 overflow-y-auto space-y-6 max-w-[1440px] mx-auto w-full pr-1">
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
              Lumina AI evaluated your chat responses in real-time, calculated conceptual confidence weights, and automatically synthesized your Concept Graph and Learning Path below.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#16161B] p-4 rounded-xl border border-emerald-900/60 space-y-2">
                <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Verified Known Concepts
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {knownConcepts.map((c) => (
                    <span key={c} className="text-xs bg-emerald-950/60 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-800/60 font-medium capitalize">
                      ✓ {c.replace(/_/g, ' ')}
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
                    <span key={c} className="text-xs bg-amber-950/60 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-800/60 font-medium capitalize">
                      ⚡ {c.replace(/_/g, ' ')}
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
                      <span>Chat Message #{item.turn || idx + 1} {item.concept ? `• Concept: ${item.concept.replace(/_/g, ' ')}` : ''}</span>
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
        /* Full Width & 80vh Height Dual-Pane Layout */
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left Column: Full-Height Chat Stream (lg:col-span-8 xl:col-span-8 2xl:col-span-9) */}
          <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 h-full flex flex-col min-h-0">
            <div className="bg-[#111114] rounded-2xl border border-[#292932] p-3 sm:p-5 shadow-subtle flex-1 flex flex-col min-h-0 justify-between">
              {/* Chat Messages Stream: Fully scrollable to top with mt-auto bottom alignment */}
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="min-h-full flex flex-col space-y-4">
                  <div className="mt-auto" />
                  {messages.map((msg, index) => {
                    const isAi = msg.sender === 'ai';
                    const isCurrentStreamingMsg = isAi && msg.isStreaming;

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex items-start gap-3 ${isAi ? '' : 'flex-row-reverse'}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isAi ? 'bg-[#6558F5] text-white border border-[#8B7CFF]/40' : 'bg-[#16161B] text-[#F4F4F5] border border-[#292932]'
                          }`}
                        >
                          {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>

                        <div className={`space-y-2.5 max-w-[88%] ${isAi ? '' : 'items-end'}`}>
                          <div
                            className={`p-4 rounded-2xl text-sm leading-relaxed ${
                              isAi
                                ? 'bg-[#16161B] text-[#F4F4F5] rounded-tl-sm border border-[#222229]'
                                : 'bg-[#211C38] text-[#F4F4F5] rounded-tr-sm border border-[#49406F] shadow-xs'
                            }`}
                          >
                            {isAi ? (
                              isCurrentStreamingMsg && !msg.text ? (
                                <div className="flex items-center gap-2.5 text-xs text-[#A1A1AA] py-1">
                                  <Sparkles className="w-4 h-4 text-[#8B7CFF] animate-spin" />
                                  <span>
                                    {streamingStatus === 'evaluating'
                                      ? 'Evaluating your response against topic concepts...'
                                      : 'Lumina AI is generating next concept question...'}
                                  </span>
                                </div>
                              ) : (
                                <div className="relative">
                                  <MarkdownRenderer content={msg.text || ''} />
                                  {isCurrentStreamingMsg && (
                                    <span className="inline-block w-2 h-4 ml-1 bg-[#8B7CFF] animate-pulse align-middle" />
                                  )}
                                </div>
                              )
                            ) : (
                              msg.text
                            )}
                          </div>

                          {/* Interactive Option Chips for AI Questions */}
                          {isAi && !isCurrentStreamingMsg && (
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

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Custom Text Input Form pinned to bottom */}
              <form onSubmit={handleTextSubmit} className="flex items-center gap-2 pt-3 border-t border-[#222229] mt-3 shrink-0">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={isAnswering ? "Lumina AI is streaming response..." : "Type your response to the AI question..."}
                  disabled={isAnswering}
                  className="flex-1 bg-[#16161B] border border-[#292932] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF]/30 text-[#F4F4F5] placeholder:text-[#71717A] disabled:opacity-60"
                />
                <Button type="submit" isLoading={isAnswering} disabled={!textInput.trim() || isAnswering} size="md" className="cursor-pointer">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column: Live Knowledge Profile Sidebar (lg:col-span-4 xl:col-span-4 2xl:col-span-3) */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-4 2xl:col-span-3 h-full overflow-y-auto pr-1">
            <DiagnosticKnowledgeProfile
              activeTopic={activeTopic}
              turn={turn}
              totalTurns={totalTurns}
              knowledgeProfile={knowledgeProfile}
              currentConcept={currentConcept}
              lastFeedback={lastFeedback}
              lastEvaluatedConcept={lastEvaluatedConcept}
              isStreaming={isAnswering}
              streamingStatus={streamingStatus}
            />
          </div>
        </div>
      )}

      {/* Mobile / Tablet Slide-over Drawer for Live Knowledge Profile */}
      {showMobileProfile && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-[#0D0D10] h-full p-5 overflow-y-auto border-l border-[#292932] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222229]">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#8B7CFF]" />
                <h3 className="text-base font-bold text-[#F4F4F5]">Live Knowledge Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileProfile(false)}
                className="w-8 h-8 rounded-lg bg-[#16161B] text-[#A1A1AA] hover:text-[#F4F4F5] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <DiagnosticKnowledgeProfile
              activeTopic={activeTopic}
              turn={turn}
              totalTurns={totalTurns}
              knowledgeProfile={knowledgeProfile}
              currentConcept={currentConcept}
              lastFeedback={lastFeedback}
              lastEvaluatedConcept={lastEvaluatedConcept}
              isStreaming={isAnswering}
              streamingStatus={streamingStatus}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default DiagnosticChatView;

