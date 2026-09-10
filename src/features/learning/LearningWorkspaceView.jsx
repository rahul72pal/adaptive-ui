import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuestionAttempt } from '../../hooks/useQuestionAttempt';
import {
  setUserAnswer,
  nextBatchQuestion,
  resetBatchProgress
} from '../questions/questionsSlice';
import { setSelectedNodeId } from '../learning/learningSlice';
import { setActiveTab } from '../user/userSlice';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  Lightbulb,
  HelpCircle,
  BookOpen,
  Loader2,
  FileCode,
  Trophy,
  ChevronRight,
  Zap
} from 'lucide-react';

export function LearningWorkspaceView() {
  const dispatch = useDispatch();
  const { selectedNodeId, nodes } = useSelector((state) => state.learning);
  const { activeTopic } = useSelector((state) => state.user);
  const {
    userAnswer,
    attemptResult,
    isSubmitting,
    nodeCompleted = false
  } = useSelector((state) => state.questions);

  const {
    question,
    isLoadingQuestion,
    batchIndex,
    currentRound = 1,
    totalRounds = 5,
    globalQuestionIndex = 1,
    totalNodeQuestions = 15,
    totalBatchQuestions = 3,
    isLastQuestion,
    isSubmitting: isHookSubmitting,
    submitAnswer
  } = useQuestionAttempt(selectedNodeId || 'fundamentals');

  const isSubmittingState = isSubmitting || isHookSubmitting;
  const [selectedOption, setSelectedOption] = useState(null);

  // Find active concept node & next concept node in sequence
  const currentNodeIndex = nodes.findIndex((n) => n.concept_id === selectedNodeId);
  const activeNode = nodes[currentNodeIndex] || {
    title: selectedNodeId ? selectedNodeId.replace(/[-_]+/g, ' ').toUpperCase() : 'Concept Node',
    description: `Mastering ${selectedNodeId || 'concept'} in ${activeTopic}.`,
  };
  const nextNode = nodes[currentNodeIndex + 1] || null;

  const prevNodeIdRef = React.useRef(selectedNodeId);
  // Reset batch state ONLY when changing concept node
  useEffect(() => {
    if (prevNodeIdRef.current !== selectedNodeId) {
      prevNodeIdRef.current = selectedNodeId;
      dispatch(resetBatchProgress());
    }
  }, [selectedNodeId, dispatch]);

  const activeQuestion = question;
  const questionText = activeQuestion?.question || activeQuestion?.prompt || activeQuestion?.title || 'Practice Assessment Question';
  const questionType = activeQuestion?.type || activeQuestion?.question_type || 'mcq';
  const rubricText = activeQuestion?.rubric || activeNode.description;

  useEffect(() => {
    setSelectedOption(null);
  }, [batchIndex, currentRound, activeQuestion]);

  const handleOptionSelect = (idx, text) => {
    setSelectedOption(idx);
    dispatch(setUserAnswer(text));
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!userAnswer || isSubmittingState) return;
    submitAnswer(userAnswer);
  };

  const handleNextQuestion = () => {
    dispatch(nextBatchQuestion());
  };

  const handleAdvanceToNextNode = () => {
    if (nextNode) {
      dispatch(setSelectedNodeId(nextNode.concept_id));
      dispatch(resetBatchProgress());
    } else {
      dispatch(setActiveTab('path'));
    }
  };

  const handleBackToPath = () => {
    dispatch(setActiveTab('path'));
  };

  const progressPercent = Math.min(100, Math.round((globalQuestionIndex / totalNodeQuestions) * 100));
  const formattedScore = attemptResult?.score !== undefined
    ? Math.round(attemptResult.score <= 1 ? attemptResult.score * 100 : attemptResult.score)
    : 0;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8 animate-fadeIn">
      {/* Workspace Header with 5-Round Mini-Batch Progress */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-surface-variant shadow-subtle">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm" className="capitalize">
              {activeTopic} Workspace
            </Badge>
            <Badge variant="ai" size="sm">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Round {currentRound} of {totalRounds} • 15 Questions Total
            </Badge>
          </div>
          <h2 className="text-2xl font-extrabold text-ink-primary tracking-tight">{activeNode.title}</h2>
          <p className="text-xs text-ink-secondary">{activeNode.description}</p>
        </div>

        <div className="w-full md:w-64 space-y-2 shrink-0">
          <ProgressBar progress={progressPercent} showLabel />
          <div className="text-[11px] text-ink-muted text-right font-medium">
            Question {globalQuestionIndex} of {totalNodeQuestions} (Round {currentRound}/{totalRounds})
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Dynamic Concept Guidelines */}
        <Card className="space-y-5 border-surface-variant">
          <div className="flex items-center gap-2 border-b border-surface-variant pb-3">
            <BookOpen className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-sm text-ink-primary">Concept Explanation & Guidelines</h3>
          </div>

          <div className="prose prose-sm text-ink-primary max-w-none space-y-4 leading-relaxed text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="ai" size="sm" className="capitalize">
                Topic: {activeTopic}
              </Badge>
              <Badge variant="secondary" size="sm" className="capitalize">
                Concept: {selectedNodeId || 'core'}
              </Badge>
            </div>

            <p className="text-ink-primary font-medium leading-relaxed">
              {activeNode.description}
            </p>

            {rubricText && (
              <div className="bg-brand-50/70 border border-brand-200 p-4 rounded-xl space-y-2">
                <div className="text-xs font-bold text-brand-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-brand-600" /> Diagnostic Concept Rubric & Key Notes
                </div>
                <p className="text-xs text-brand-900 leading-relaxed font-normal">
                  {rubricText}
                </p>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-surface-container/60 border border-surface-variant text-xs text-ink-muted leading-relaxed">
              ⚡ <strong>5-Round Adaptive Progression:</strong> Complete 5 mini-batch rounds (3 targeted questions per round = 15 total questions) to master {activeNode.title}.
            </div>
          </div>
        </Card>

        {/* Right Side: Pre-Loaded Batch Question Card & Verification */}
        <div className="space-y-4">
          <Card className="space-y-5 border-brand-200 shadow-md">
            <div className="flex items-center justify-between border-b border-surface-variant pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-600" />
                <h3 className="font-bold text-sm text-ink-primary">
                  Question #{globalQuestionIndex} of {totalNodeQuestions} (Round {currentRound}/{totalRounds})
                </h3>
              </div>
              <Badge variant="ai" size="sm" className="uppercase">
                {questionType}
              </Badge>
            </div>

            {isLoadingQuestion ? (
              <div className="py-12 flex flex-col items-center justify-center text-ink-muted text-xs gap-3">
                <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
                <span>Generating Round {currentRound} mini-batch for {activeNode.title}...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Question Text */}
                <h4 className="font-bold text-sm sm:text-base text-ink-primary leading-snug">
                  {questionText}
                </h4>

                {/* Code Practice Editor */}
                {(questionType === 'code' || questionType === 'code_practice') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-ink-muted">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <FileCode className="w-3.5 h-3.5 text-brand-600" /> solution.{activeTopic === 'python' ? 'py' : activeTopic === 'rust' ? 'rs' : 'js'}
                      </span>
                      <span className="capitalize">{activeTopic} Code Editor</span>
                    </div>
                    <textarea
                      rows={7}
                      value={userAnswer}
                      onChange={(e) => dispatch(setUserAnswer(e.target.value))}
                      placeholder={`Write your ${activeTopic} solution for question ${globalQuestionIndex}...`}
                      className="w-full bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/50 leading-relaxed placeholder:text-slate-500"
                    />
                  </div>
                )}

                {/* Multiple Choice Options */}
                {(questionType === 'mcq' || (activeQuestion?.options && activeQuestion.options.length > 0)) && (
                  <div className="space-y-2.5 pt-1">
                    {activeQuestion?.options?.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect(idx, opt)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all ${
                          selectedOption === idx
                            ? 'bg-brand-50 border-brand-600 text-brand-900 ring-2 ring-brand-500/30 shadow-sm font-semibold'
                            : 'bg-white border-surface-variant text-ink-primary hover:border-brand-300 hover:bg-brand-50/20'
                        }`}
                      >
                        <span className="font-bold mr-2 text-brand-700">{String.fromCharCode(65 + idx)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Evaluation Result Feedback Banner */}
            {attemptResult && (
              <div
                className={`p-4 rounded-xl border space-y-2 animate-fadeIn ${
                  attemptResult.passed
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border-rose-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {attemptResult.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    )}
                    {attemptResult.passed ? 'Answer Verified Correct!' : 'Needs Revision'}
                  </div>
                  <Badge variant={attemptResult.passed ? 'success' : 'danger'} size="sm">
                    Score: {formattedScore}%
                  </Badge>
                </div>

                <p className="text-xs leading-relaxed font-medium">{attemptResult.feedback}</p>
              </div>
            )}

            {/* Mini-Batch Completion vs Next Question Navigation */}
            {nodeCompleted || (isLastQuestion && attemptResult) ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white space-y-3 shadow-lg animate-fadeIn">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-300 animate-bounce" />
                  <div>
                    <div className="font-extrabold text-sm text-white">Concept Node Mastered!</div>
                    <div className="text-xs text-emerald-100">All 15/15 questions across 5 mini-batch rounds completed for {activeNode.title}.</div>
                  </div>
                </div>

                {nextNode ? (
                  <Button
                    onClick={handleAdvanceToNextNode}
                    size="md"
                    className="w-full bg-white text-emerald-900 hover:bg-emerald-50 font-bold shadow-md"
                  >
                    Advance to Next Concept: {nextNode.title}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleBackToPath}
                    size="md"
                    className="w-full bg-white text-emerald-900 hover:bg-emerald-50 font-bold shadow-md"
                  >
                    View Completed Learning Roadmap
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-surface-variant">
                {!attemptResult ? (
                  <Button
                    onClick={handleSubmit}
                    isLoading={isSubmittingState}
                    disabled={!userAnswer || isLoadingQuestion || isSubmittingState}
                    size="md"
                    className="w-full font-bold shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Submit Answer (Question {globalQuestionIndex}/{totalNodeQuestions})
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    size="md"
                    className="w-full font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                  >
                    {batchIndex === totalBatchQuestions ? `Next Round (${currentRound + 1}/5)` : `Next Question (${globalQuestionIndex + 1}/15)`}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
