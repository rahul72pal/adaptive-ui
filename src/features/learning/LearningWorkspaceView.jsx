import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuestionAttempt } from '../../hooks/useQuestionAttempt';
import { codeApi } from '../../api/codeApi';
import { useLessonContent } from '../../hooks/useLessonContent';
import { useLearningPath } from '../../hooks/useLearningPath';
import { setUserAnswer, resetBatchProgress, setNodeCompleted } from '../questions/questionsSlice';
import { setSelectedNodeId, updateNodeStatus, setLearningPath } from '../learning/learningSlice';
import { setActiveTab } from '../user/userSlice';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import LeetCodeEditor from '../../components/LeetCodeEditor';
import confetti from 'canvas-confetti';
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
  Zap,
  Target,
  ArrowLeft,
  Layers,
  GraduationCap,
  Terminal,
  Code2,
  FileText,
  CheckSquare,
  Cpu,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Lock
} from 'lucide-react';

export function parseTextToList(rawText) {
  if (!rawText) return [];
  if (Array.isArray(rawText)) {
    return rawText.map(item => String(item).trim()).filter(Boolean);
  }

  const str = String(rawText)
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .trim();

  if (/(\d+\.\s+)/.test(str)) {
    const parts = str.split(/(?=\b\d+\.\s+)/g);
    const list = parts
      .map(p => p.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean);
    if (list.length > 0) return list;
  }

  if (/(Step\s+\d+:?\s*)/i.test(str)) {
    const parts = str.split(/(?=\bStep\s+\d+:?\s*)/gi);
    const list = parts
      .map(p => p.replace(/^Step\s+\d+:?\s*/i, '').trim())
      .filter(Boolean);
    if (list.length > 0) return list;
  }

  if (str.includes('\n')) {
    const lines = str
      .split('\n')
      .map(l => l.replace(/^[-*•\d+.\s]+/, '').trim())
      .filter(Boolean);
    if (lines.length > 0) return lines;
  }

  const sentences = str
    .split(/(?<=\.)\s+(?=[A-Z0-9])/)
    .map(s => s.trim())
    .filter(Boolean);

  return sentences.length > 0 ? sentences : [str];
}

export function LearningWorkspaceView() {
  const dispatch = useDispatch();
  const { pathId, selectedNodeId, currentNodeId, nodes } = useSelector((state) => state.learning);
  const { activeTopic, targetLanguage, explanationLanguage } = useSelector((state) => state.user);
  const { completeLevel, completeNode, isCompletingNode } = useLearningPath();

  const currentNodeIndex = nodes.findIndex((n) => n.concept_id === selectedNodeId);
  const activeNode = nodes[currentNodeIndex] || {
    concept_id: selectedNodeId || 'fundamentals',
    title: selectedNodeId ? selectedNodeId.replace(/[-_]+/g, ' ').toUpperCase() : 'Concept Node',
    description: `Mastering ${selectedNodeId || 'concept'} in ${activeTopic}.`,
    node_type: 'learning',
    level: 'beginner',
  };

  const pathNextNode = nodes.find((node) => node.concept_id === currentNodeId && currentNodeId !== selectedNodeId);
  const nextNode = pathNextNode || nodes[currentNodeIndex + 1] || null;
  const isLearningNode = activeNode.node_type === 'learning' || !activeNode.node_type;

  // Single Question Hook for Practice Nodes
  const {
    question,
    isLoadingQuestion,
    userAnswer,
    attemptResult,
    currentQuestionCount = 1,
    targetQuestionCount = 5,
    nodeCompleted = false,
    isSubmitting,
    isFetchingNext,
    isRegeneratingQuestion,
    isStreamingQuestion,
    streamError,
    submitAnswer,
    fetchNextQuestion,
    regenerateQuestion,
    skipQuestion,
    retryQuestion,
  } = useQuestionAttempt(selectedNodeId, activeNode);

  // Lesson Content Hook for Learning Nodes
  const {
    lesson,
    streamingText,
    isStreaming,
    userInput,
    isLoadingLesson,
    isLoadingDeepDive,
    error: lessonError,
    refetchLesson,
    regenerateLesson,
  } = useLessonContent(selectedNodeId, activeNode);

  const [selectedOption, setSelectedOption] = useState(null);

  const checkpoint = lesson?.checkpoint || (userInput ? {
    question: userInput.description || userInput.label,
    options: (userInput.options || []).map((o) => (typeof o === 'object' && o !== null ? (o.label || o.text || o.value || o) : o)),
    correct_option: userInput.metadata?.correct_option || 'Option A',
    explanation: userInput.metadata?.explanation || 'Validates concept mechanism.'
  } : null);

  const fullLessonMarkdown = useMemo(() => {
    if (streamingText && (!lesson || isStreaming)) return streamingText;
    if (lesson?.markdown) return lesson.markdown;
    if (!lesson) return streamingText || '';
    const cidTitle = (activeNode?.title || selectedNodeId || 'Concept').toUpperCase();
    const lang = (lesson.language || targetLanguage || 'python').toLowerCase();
    const lines = [`# ${cidTitle}\n`];
    if (lesson.intuition) lines.push(`> 💡 **Intuition:** ${lesson.intuition}\n`);
    if (lesson.core_idea) lines.push(`## 🎯 Core Principle\n${lesson.core_idea}\n`);
    if (lesson.mechanism) lines.push(`## ⚙️ Operational Mechanism\n${lesson.mechanism}\n`);
    if (lesson.step_by_step_example) lines.push(`## 🔍 Step-by-Step Walkthrough\n${lesson.step_by_step_example}\n`);
    if (lesson.code_snippet) lines.push(`## 💻 Implementation (${lang.toUpperCase()})\n\`\`\`${lang}\n${lesson.code_snippet}\n\`\`\`\n`);
    if (lesson.complexity) {
      lines.push(`## ⏱️ Complexity Analysis\n- **Time Complexity (Best Case):** \`${lesson.complexity.best_case || 'O(...)'}\`\n- **Time Complexity (Worst Case):** \`${lesson.complexity.worst_case || 'O(...)'}\`\n- **Auxiliary Space:** \`${lesson.complexity.space || 'O(...)'}\`\n${lesson.complexity.explanation ? `\n- **Mechanical Reason:** ${lesson.complexity.explanation}` : ''}\n`);
    }
    if (lesson.edge_cases?.length) {
      lines.push(`## ⚠️ Key Edge Cases\n` + lesson.edge_cases.map(e => `- ${e}`).join('\n') + '\n');
    }
    if (lesson.common_mistakes?.length) {
      lines.push(`## 🚫 Common Pitfalls\n` + lesson.common_mistakes.map(c => `- ${c}`).join('\n') + '\n');
    }
    return lines.join('\n');
  }, [lesson, activeNode?.title, selectedNodeId, targetLanguage, streamingText, isStreaming]);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [activeTestCaseTab, setActiveTestCaseTab] = useState(0);
  const [showRawStream, setShowRawStream] = useState(false);
  const [testRunCount, setTestRunCount] = useState(0);

  // Code is evaluated only by the backend's configured sandbox.
  const isPyodideReady = true;
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [codeExecutionResults, setCodeExecutionResults] = useState(null);

  const userAnswerRef = React.useRef(userAnswer);
  useEffect(() => {
    userAnswerRef.current = userAnswer;
  }, [userAnswer]);

  const submitAnswerRef = React.useRef(submitAnswer);
  useEffect(() => {
    submitAnswerRef.current = submitAnswer;
  }, [submitAnswer]);

  const testRunCountRef = React.useRef(0);
  useEffect(() => {
    testRunCountRef.current = testRunCount;
  }, [testRunCount]);

  // 1. Starter Code Template load karein jab question ya language change ho
  const defaultStarterCode = useMemo(() => {
    if (!question) return '';
    // The generator now owns starter-code completeness (imports + node class
    // definitions), so prefer it over the hardcoded templates below.
    if (question.starter_code && String(question.starter_code).trim()) {
      return question.starter_code;
    }
    const currentLang = (targetLanguage || 'python').toLowerCase();
    if (currentLang === 'cpp') {
      return question.function_signature
        ? `#include <iostream>\n#include <vector>\nusing namespace std;\n\n${question.function_signature} {\n    // Write your solution here\n    return 0;\n}`
        : `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint solution(vector<int>& nums) {\n    // Write your solution here\n    return 0;\n}`;
    } else if (currentLang === 'js' || currentLang === 'javascript') {
      return question.function_signature
        ? `${question.function_signature} {\n    // Write your solution here\n    return 0;\n}`
        : `function solution(nums) {\n    // Write your solution here\n    return 0;\n}`;
    } else {
      return question.function_signature 
        ? `${question.function_signature}\n    # Write your solution here\n    pass`
        : `def solution(nums: list[int]) -> int:\n    # Write your solution here\n    pass`;
    }
  }, [question?.function_signature, question?.starter_code, targetLanguage]);

  const starterKeyRef = React.useRef(null);
  useEffect(() => {
    if (question && (question.concept_type === 'code' || question.function_signature || !question.options || question.options.length === 0)) {
      const currentLang = (targetLanguage || 'python').toLowerCase();
      const starterKey = `${question.id || question.concept_id}|${question.function_signature || ''}|${question.starter_code ? 'owned' : 'tpl'}|${currentLang}`;
      // Streaming patches the question object many times; only seed starter
      // code once per (question, language) so we never wipe the user's edits.
      if (starterKeyRef.current === starterKey) return;
      starterKeyRef.current = starterKey;
      
      dispatch(setUserAnswer(defaultStarterCode));
      setCodeExecutionResults(null);
    }
  }, [question, targetLanguage, defaultStarterCode, dispatch]);

  // 3. Extract Function Name Helper (python / javascript / c++)
  // Scans the whole signature OR full starter code and takes the LAST named
  // function, so node-class helpers like `def __init__` are ignored.
  const extractFnName = (sig) => {
    if (!sig) return 'solution';
    const s = String(sig);
    const pick = (re) => {
      const all = [...s.matchAll(re)]
        .map((m) => m[1])
        .filter((n) => n && !n.startsWith('__'));
      return all.length ? all[all.length - 1] : null;
    };
    return (
      pick(/def\s+([A-Za-z_]\w*)/g) ||
      pick(/function\s+([A-Za-z_]\w*)/g) ||
      pick(/(?:const|let|var)\s+([A-Za-z_]\w*)\s*[:=]/g) ||
      pick(/([A-Za-z_]\w*)\s*\(/g) ||
      'solution'
    );
  };

  // 4. Code Run Handler — all submitted code runs in the configured backend sandbox.
  const handleRunBrowserCode = async () => {
    if (isRunningCode) return;
    const testCases = question?.test_cases || [];
    const fnName = extractFnName(question?.function_signature || question?.starter_code);
    const lang = (targetLanguage || 'python').toLowerCase();

    setIsRunningCode(true);
    setCodeExecutionResults(null);
    setTestRunCount((prev) => prev + 1);

    const finish = (data) => {
      setIsRunningCode(false);
      setCodeExecutionResults(data);
      const totalTC = data?.results?.length || testCases.length || 0;
      const passedTC = data?.results?.filter((r) => r.passed)?.length || 0;
      const allPassed = data?.all_passed || data?.allPassed;
      if (allPassed && submitAnswerRef.current) {
        submitAnswerRef.current(userAnswerRef.current, {
          test_run_count: testRunCountRef.current + 1,
          test_cases_passed: totalTC,
          total_test_cases: totalTC,
        });
        try {
          confetti({ particleCount: 80, spread: 60 });
        } catch (err) {
          console.log('Confetti error:', err);
        }
      }
    };

    try {
      const res = await codeApi.execute({
        language: lang,
        code: userAnswer,
        function_name: fnName,
        test_cases: testCases,
        contract: {
          execution_mode: question?.execution_mode,
          function_signature: question?.function_signature,
          input_adapter: question?.input_adapter,
          output_adapter: question?.output_adapter,
          supported_languages: question?.supported_languages,
          test_case_schema: question?.test_case_schema,
          comparison_mode: question?.comparison_mode,
          problem_version: question?.problem_version,
          absolute_tolerance: question?.absolute_tolerance,
          relative_tolerance: question?.relative_tolerance,
        },
      });
      if (res?.supported) {
        finish(res);
        return;
      }
      setIsRunningCode(false);
      setCodeExecutionResults({
        all_passed: false,
        results: [],
        total: testCases.length,
        passed: 0,
        error: res?.error || 'Server-side execution unavailable for this language.',
        supported: false,
      });
    } catch (err) {
      setIsRunningCode(false);
      setCodeExecutionResults({
        all_passed: false,
        results: [],
        total: testCases.length,
        passed: 0,
        error: String(err?.message || err),
        supported: false,
      });
    }
  };

  const prevNodeIdRef = React.useRef(selectedNodeId);
  useEffect(() => {
    if (prevNodeIdRef.current !== selectedNodeId) {
      prevNodeIdRef.current = selectedNodeId;
      dispatch(resetBatchProgress());
      setIsLessonCompleted(false);
      setSelectedOption(null);
      setActiveTestCaseTab(0);
      setCodeExecutionResults(null);
      setTestRunCount(0);
    }
  }, [selectedNodeId, dispatch]);

  useEffect(() => {
    setSelectedOption(null);
    setActiveTestCaseTab(0);
    setCodeExecutionResults(null);
    setTestRunCount(0);
    // keyed by id so streaming token patches don't reset the attempt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  const handleRetryQuestion = () => {
    setSelectedOption(null);
    dispatch(setUserAnswer(''));
    retryQuestion();
  };

  const handleOptionSelect = (idx, text) => {
    if (attemptResult && !attemptResult.passed) {
      retryQuestion();
    }
    setSelectedOption(idx);
    dispatch(setUserAnswer(text));
  };

  const handleSubmitQuestion = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!userAnswer || isSubmitting) return;

    const isCode = !question?.options || question.options.length === 0 || question?.concept_type === 'code' || question?.test_cases?.length > 0;
    
    if (isCode) {
      const totalTC = question?.test_cases?.length || 0;
      let passedTC = null;
      if (codeExecutionResults) {
        const allPassed = codeExecutionResults.all_passed || codeExecutionResults.allPassed;
        passedTC = codeExecutionResults.results?.filter((r) => r.passed)?.length ?? (allPassed ? totalTC : 0);
      }
      submitAnswer(userAnswer, {
        test_run_count: testRunCount,
        test_cases_passed: passedTC,
        total_test_cases: totalTC,
      });
    } else {
      submitAnswer(userAnswer, {
        test_run_count: 0,
      });
    }
  };


  const getCleanOptionText = (opt) => {
    if (opt === null || opt === undefined) return '';
    if (typeof opt === 'object') {
      return String(opt.text || opt.label || opt.option || opt.id || '').trim();
    }
    let str = String(opt).trim();
    if ((str.startsWith('{') && str.endsWith('}')) || str.includes("'text':") || str.includes('"text":')) {
      const textMatch = str.match(/['"]text['"]\s*:\s*['"]((?:[^'\\\\]|\\.)*)['"]/i);
      if (textMatch) {
        return textMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
      }
      const labelMatch = str.match(/['"](?:label|option)['"]\s*:\s*['"]((?:[^'\\\\]|\\.)*)['"]/i);
      if (labelMatch) {
        return labelMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
      }
    }
    return str;
  };

  const isCheckpointPassed = useMemo(() => {
    if (isLessonCompleted) return true;
    if (activeNode?.status === 'mastered' || activeNode?.status === 'known' || activeNode?.status === 'completed') return true;
    if (!lesson?.checkpoint) return false;
    if (selectedOption === null) return false;

    const rawOpts = lesson.checkpoint.options || [];
    const cleanCorrect = getCleanOptionText(lesson.checkpoint.correct_option || lesson.checkpoint.correct_option_id || '');
    const selClean = getCleanOptionText(selectedOption);

    const chosenIdx = rawOpts.findIndex((o) => getCleanOptionText(o) === selClean || o === selectedOption);
    const chosenLetter = chosenIdx >= 0 ? String.fromCharCode(65 + chosenIdx) : '';
    const cleanCorrUpper = cleanCorrect.toUpperCase();

    return (
      selClean === cleanCorrect ||
      (chosenLetter && (cleanCorrUpper === chosenLetter || cleanCorrUpper.startsWith(chosenLetter + '.') || cleanCorrUpper.startsWith(chosenLetter + ')'))) ||
      (selClean && cleanCorrUpper.startsWith(selClean.toUpperCase())) ||
      (cleanCorrect && selClean.toUpperCase().startsWith(cleanCorrUpper))
    );
  }, [lesson?.checkpoint, selectedOption, isLessonCompleted, activeNode?.status]);

  const handleCompleteLesson = async () => {
    if (!isCheckpointPassed && !isLessonCompleted && activeNode?.status !== 'mastered') return;
    setIsLessonCompleted(true);
    dispatch(setNodeCompleted(true));
    dispatch(updateNodeStatus({
      conceptId: selectedNodeId,
      status: 'mastered',
      masteryScore: 100,
    }));
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    try {
      const updatedPath = await completeNode({ topic: activeTopic, conceptId: selectedNodeId, learningPathId: pathId });
      if (updatedPath) {
        dispatch(setLearningPath(updatedPath));
        const allNodesMastered = updatedPath.nodes?.every(n => n.status === 'mastered' || n.status === 'known');
        if (allNodesMastered && pathId) {
          completeLevel(pathId);
        } else if (updatedPath.current_node && updatedPath.current_node !== selectedNodeId) {
          const nextNodeObj = updatedPath.nodes?.find(n => n.concept_id === updatedPath.current_node);
          if (nextNodeObj && nextNodeObj.status !== 'mastered' && nextNodeObj.status !== 'known') {
            dispatch(setSelectedNodeId(updatedPath.current_node));
          }
        }
      }
    } catch (err) {
      console.error('[handleCompleteLesson] Error completing node on backend:', err);
    }
  };

  const handleAdvanceToNextNode = () => {
    if (nextNode && nextNode.status !== 'locked') {
      dispatch(setSelectedNodeId(nextNode.concept_id));
      dispatch(resetBatchProgress());
      setIsLessonCompleted(false);
    } else {
      dispatch(setActiveTab('path'));
    }
  };

  const handleBackToPath = () => {
    dispatch(setActiveTab('path'));
  };

  const questionText = question?.question || question?.prompt || question?.title || 'Practice Assessment Question';
  const questionType = question?.type || question?.question_type || 'mcq';
  const formattedScore = attemptResult?.score !== undefined
    ? Math.round(attemptResult.score <= 1 ? attemptResult.score * 100 : attemptResult.score)
    : 0;

  const isCurrentMastered = (activeNode.status === 'mastered' || activeNode.status === 'known' || isLessonCompleted) && (!attemptResult || attemptResult.passed) && (nodeCompleted || activeNode.status === 'mastered' || activeNode.status === 'known' || isLessonCompleted);
  const activeNodeSkipped = activeNode.status === 'skipped';

  // A coding question is only truly cleared when every generated test case passes.
  const isCodeQuestion = !question?.options || question.options.length === 0 || question?.concept_type === 'code' || (question?.test_cases?.length > 0);
  const hasTestCases = (question?.test_cases?.length || 0) > 0;
  const testsAllPassed = Boolean(codeExecutionResults?.all_passed || codeExecutionResults?.allPassed);
  // Never dead-end the learner on a platform limitation (unsupported language,
  // runner outage) or on a question with no test cases — only a real failed
  // test run blocks progress. `submit_attempt` re-runs the tests server-side.
  const runnerUnavailable =
    codeExecutionResults?.supported === false || codeExecutionResults?.runner_error === true;
  const testsCleared = !isCodeQuestion || testsAllPassed || !hasTestCases || runnerUnavailable;
  const canAdvance = !attemptResult || (attemptResult.passed && testsCleared);

  return (
    <div className="max-w-[1440px] w-full mx-auto py-4 px-2 space-y-5 animate-fadeIn">
      {/* Workspace Navigation Header */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={handleBackToPath}
          variant="ghost"
          size="sm"
          className="text-xs font-bold text-ink-muted hover:text-ink-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Roadmap Graph
        </Button>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="primary" size="sm" className="capitalize">
            {activeTopic} Workspace
          </Badge>
          <Badge variant="outline" size="sm" className="font-mono uppercase font-bold text-[11px] text-brand-700 bg-brand-50 border-brand-200">
            {targetLanguage === 'cpp' ? '⚡ C++' : targetLanguage === 'js' ? '🟨 JavaScript' : '🐍 Python'}
          </Badge>
          <Badge variant="outline" size="sm" className="font-mono uppercase font-bold text-[11px] text-indigo-700 bg-indigo-50 border-indigo-200">
            {explanationLanguage === 'hinglish' ? '🇮🇳 Hinglish' : '🇬🇧 English'}
          </Badge>
          <Badge variant={isLearningNode ? 'ai' : 'warning'} size="sm" className="capitalize">
            {isLearningNode ? <BookOpen className="w-3.5 h-3.5 text-brand-600" /> : <Target className="w-3.5 h-3.5 text-amber-600" />}
            {isLearningNode ? 'Learning Content' : 'Single Question Engine'}
          </Badge>
        </div>
      </div>

      {/* Main Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111114] p-6 rounded-2xl border border-[#292932] shadow-subtle">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
              isLearningNode ? 'bg-[#211C38] text-[#8B7CFF] border border-[#49406F]' : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
            }`}>
              {activeNode.level || 'Beginner'} Level • {isLearningNode ? 'Lesson' : 'Practice'}
            </span>
            {isCurrentMastered && (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3.5 h-3.5" /> Node Mastered
              </Badge>
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-[#F4F4F5] tracking-tight">{activeNode.title}</h2>
          <p className="text-xs text-[#A1A1AA]">{activeNode.description}</p>
        </div>

        {!isLearningNode && (
          <div className="w-full md:w-64 space-y-2 shrink-0">
            <ProgressBar progress={Math.min(100, Math.round((currentQuestionCount / targetQuestionCount) * 100))} showLabel />
            <div className="text-[11px] text-[#71717A] text-right font-medium">
              Question {Math.min(currentQuestionCount, targetQuestionCount)} of {targetQuestionCount}
            </div>
          </div>
        )}
      </div>

      {/* Workspace Content: LEARNING NODE VS PRACTICE NODE */}
      {isLearningNode ? (
        /* LEARNING NODE WORKSPACE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Card className="space-y-6 bg-[#111114] border-[#292932] shadow-subtle text-[#F4F4F5]">
              <div className="flex items-center justify-between border-b border-[#222229] pb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#8B7CFF]" />
                  <h3 className="font-extrabold text-base text-[#F4F4F5]">Concept Lesson</h3>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      setSelectedOption(null);
                      regenerateLesson();
                    }}
                    disabled={isLoadingLesson || isStreaming}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1c192b] text-[#A594FD] border border-[#49406F] hover:bg-[#282244] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-95"
                    title="Regenerate a brand new lesson and checkpoint question for this concept"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLesson || isStreaming ? 'animate-spin text-[#8B7CFF]' : ''}`} />
                    <span>{isLoadingLesson || isStreaming ? 'Regenerating...' : 'Regenerate'}</span>
                  </button>
                  <Badge variant="ai" size="sm">
                    <GraduationCap className="w-3.5 h-3.5 text-[#8B7CFF]" />
                    Curriculum Engine
                  </Badge>
                </div>
              </div>

              {isLoadingLesson && !streamingText ? (
                <div className="py-16 flex flex-col items-center justify-center text-[#71717A] text-xs gap-3">
                  <Loader2 className="w-7 h-7 text-[#8B7CFF] animate-spin" />
                  <span className="font-semibold text-[#F4F4F5] text-sm">Connecting to Live AI Stream for {activeNode.title}...</span>
                  <span className="text-[11px] text-[#71717A]">Synthesizing intuition, mechanism, complexity analysis, and edge cases...</span>
                </div>
              ) : lessonError && !lesson && !streamingText ? (
                <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    Lesson Content Interrupted
                  </div>
                  <p className="text-xs text-rose-800">{lessonError}</p>
                  <Button onClick={refetchLesson} size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Lesson Stream
                  </Button>
                </div>
              ) : (lesson || isStreaming || streamingText) ? (
                <div className="space-y-6 text-[#F4F4F5] leading-relaxed text-xs sm:text-sm animate-fadeIn">
                  {/* Streaming Header Banner */}
                  {isStreaming && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#16161B] border border-[#49406F] px-4 py-3 rounded-2xl shadow-subtle">
                      <div className="flex items-center gap-2.5 text-xs font-bold text-[#8B7CFF]">
                        <Sparkles className="w-4 h-4 text-[#8B7CFF] animate-spin" style={{ animationDuration: '3s' }} />
                        <span>Synthesizing Concept Lesson Token-by-Token...</span>
                      </div>
                      <Badge variant="ai" size="sm" className="animate-pulse">Live Streaming</Badge>
                    </div>
                  )}

                  {/* Markdown Lesson Content - renders live during streaming and when complete */}
                  <div className="bg-[#16161B] border border-[#292932] p-5 sm:p-7 rounded-2xl shadow-subtle animate-fadeIn">
                    <MarkdownRenderer content={fullLessonMarkdown} />
                    {isStreaming && (
                      <span className="inline-block w-2 h-4 bg-[#8B7CFF] animate-pulse ml-1 align-middle rounded-xs" />
                    )}
                  </div>

                  {/* 7. Upgraded Interactive Checkpoint Question (MCQ) */}
                  {checkpoint ? (
                    <div className="bg-[#16161B] border border-[#49406F] p-5 rounded-2xl space-y-4 shadow-subtle border-t pt-4">
                      <div className="flex items-center justify-between border-b border-[#222229] pb-2.5">
                        <div className="text-xs font-extrabold text-[#8B7CFF] uppercase tracking-wider flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-[#8B7CFF]" /> Interactive Concept Checkpoint
                        </div>
                        <Badge variant="ai" size="sm">Instant Evaluation</Badge>
                      </div>

                      <p className="text-[#F4F4F5] font-bold text-xs sm:text-sm leading-relaxed">
                        {checkpoint.question}
                      </p>

                      {(() => {
                        const getCleanOptionText = (opt) => {
                          if (opt === null || opt === undefined) return '';
                          if (typeof opt === 'object') {
                            return String(opt.text || opt.label || opt.option || opt.id || '').trim();
                          }
                          let str = String(opt).trim();
                          if ((str.startsWith('{') && str.endsWith('}')) || str.includes("'text':") || str.includes('"text":')) {
                            const textMatch = str.match(/['"]text['"]\s*:\s*['"]((?:[^'\\\\]|\\.)*)['"]/i);
                            if (textMatch) {
                              return textMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
                            }
                            const labelMatch = str.match(/['"](?:label|option)['"]\s*:\s*['"]((?:[^'\\\\]|\\.)*)['"]/i);
                            if (labelMatch) {
                              return labelMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
                            }
                          }
                          return str;
                        };

                        const rawOpts = checkpoint.options;
                        const opts = (Array.isArray(rawOpts) && rawOpts.length > 0)
                          ? rawOpts
                          : ['Option A', 'Option B', 'Option C', 'Option D'];

                        const cleanCorrect = getCleanOptionText(checkpoint.correct_option || checkpoint.correct_option_id || '');
                        const showResult = selectedOption !== null;

                        const isSelectedCorrect = selectedOption !== null && (() => {
                          const selClean = getCleanOptionText(selectedOption);
                          const chosenIdx = opts.findIndex((o) => getCleanOptionText(o) === selClean || o === selectedOption);
                          const chosenLetter = chosenIdx >= 0 ? String.fromCharCode(65 + chosenIdx) : '';
                          const cleanCorrUpper = cleanCorrect.toUpperCase();
                          return (
                            selClean === cleanCorrect ||
                            (chosenLetter && (cleanCorrUpper === chosenLetter || cleanCorrUpper.startsWith(chosenLetter + '.') || cleanCorrUpper.startsWith(chosenLetter + ')'))) ||
                            (selClean && cleanCorrUpper.startsWith(selClean.toUpperCase())) ||
                            (cleanCorrect && selClean.toUpperCase().startsWith(cleanCorrUpper))
                          );
                        })();

                        return (
                          <>
                            <div className="space-y-2 pt-1">
                              {opts.map((opt, idx) => {
                                const letter = String.fromCharCode(65 + idx);
                                const optText = getCleanOptionText(opt);
                                const optId = (typeof opt === 'object' && opt !== null && opt.id) ? String(opt.id).trim() : letter;

                                const isChosen = selectedOption === optText || selectedOption === opt;
                                const isCorrectChoice =
                                  optText === cleanCorrect ||
                                  (optId && optId.toUpperCase() === cleanCorrect.toUpperCase()) ||
                                  cleanCorrect.toUpperCase() === letter ||
                                  cleanCorrect.toUpperCase().startsWith(letter + '.') ||
                                  cleanCorrect.toUpperCase().startsWith(letter + ')') ||
                                  (optText && optText.toLowerCase().startsWith(cleanCorrect.toLowerCase()));

                                return (
                                  <button
                                    key={idx}
                                    onClick={() => setSelectedOption(optText)}
                                    className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                      showResult && isChosen && isCorrectChoice
                                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/30 font-bold'
                                        : showResult && isChosen && !isCorrectChoice
                                        ? 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold'
                                        : 'bg-[#111114] border-[#292932] text-[#F4F4F5] hover:border-[#49406F] hover:bg-[#211C38]'
                                    }`}
                                  >
                                    <span className="font-bold mr-2 text-[#8B7CFF]">{letter}.</span>
                                    {optText}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Checkpoint Evaluation Result Feedback Banner */}
                            {selectedOption !== null && (
                              <div className={`p-3.5 rounded-xl border text-xs leading-relaxed animate-fadeIn ${
                                isSelectedCorrect
                                  ? 'bg-emerald-950/50 border-emerald-700/80 text-emerald-200'
                                  : 'bg-rose-950/50 border-rose-700/80 text-rose-200'
                              }`}>
                                <div className="font-bold flex items-center gap-1.5 mb-1">
                                  {isSelectedCorrect ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                  )}
                                  {isSelectedCorrect ? 'Correct Checkpoint Answer!' : 'Incorrect Choice — Try Again!'}
                                </div>
                                <p>{checkpoint.explanation}</p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#71717A] space-y-2">
                  <p>Lesson content is ready. Review the overview and mark as completed to unlock dependent concepts.</p>
                  <p className="text-[#A1A1AA]">{activeNode.description}</p>
                </div>
              )}


            </Card>
          </div>

          {/* Right Column: Node Action & Mastery Status */}
          <div className="lg:col-span-1 lg:sticky lg:top-20 space-y-4 z-20">
            <Card className="space-y-5 bg-[#111114] border-[#292932] shadow-subtle text-[#F4F4F5]">
              <div className="flex items-center justify-between border-b border-[#222229] pb-3">
                <Badge variant={isCurrentMastered ? 'success' : 'primary'} size="sm">
                  {isCurrentMastered ? 'MASTERED' : 'IN PROGRESS'}
                </Badge>
                <span className="text-xs text-[#71717A] font-medium">~{activeNode.estimated_minutes} min lesson</span>
              </div>

              {activeNode.depends_on && activeNode.depends_on.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#8B7CFF]" /> Prerequisites Satisfied
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {activeNode.depends_on.map((dep) => (
                      <span key={dep} className="text-xs bg-emerald-950/60 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-800/60 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isCurrentMastered ? (
                <div className="p-4 rounded-2xl bg-[#16161B] border border-[#49406F] text-[#F4F4F5] space-y-3 shadow-subtle animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-400" />
                    <div>
                      <div className="font-extrabold text-sm text-[#F4F4F5]">Lesson Completed!</div>
                      <div className="text-xs text-[#A1A1AA]">Downstream concepts have been automatically updated and unlocked.</div>
                    </div>
                  </div>

                  {nextNode ? (
                    <Button
                      onClick={handleAdvanceToNextNode}
                      size="md"
                      className="w-full font-bold shadow-md cursor-pointer"
                    >
                      Next Concept: {nextNode.title}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleBackToPath}
                      size="md"
                      className="w-full font-bold shadow-md cursor-pointer"
                    >
                      View Roadmap Graph
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={handleCompleteLesson}
                    isLoading={isCompletingNode}
                    disabled={isLoadingLesson || isLoadingDeepDive || isCompletingNode || !isCheckpointPassed}
                    size="lg"
                    className={`w-full font-bold shadow-md transition-all cursor-pointer ${
                      isCheckpointPassed
                        ? 'bg-[#6558F5] hover:bg-[#7568FF] text-white shadow-sm'
                        : 'bg-[#16161B] text-[#52525B] border border-[#222229] cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Complete Lesson & Unlock Next Node
                  </Button>

                  {!isCheckpointPassed && !isLessonCompleted && activeNode?.status !== 'mastered' && (
                    <div className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/60 p-2.5 rounded-xl text-center font-medium flex items-center justify-center gap-1.5 animate-fadeIn">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Answer the Concept Checkpoint correctly above to unlock</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        /* PRACTICE NODE WORKSPACE (SINGLE QUESTION ENGINE) - FULL WIDTH COLUMN-WISE LAYOUT */
        <div className="flex flex-col gap-6 w-full">
          {/* Top: Practice Node Objective Banner */}
          <Card className="bg-[#111114] border-[#292932] text-[#F4F4F5] p-5 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222229] pb-3.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-[#F4F4F5]">Practice Node Objective</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="ai" size="sm" className="capitalize">
                  Topic: {activeTopic}
                </Badge>
                <Badge variant="default" size="sm" className="capitalize">
                  Concept: {selectedNodeId}
                </Badge>
              </div>
            </div>

            <div className="pt-3.5 space-y-3 text-xs sm:text-sm">
              <p className="text-[#E4E4E7] font-medium leading-relaxed">
                {activeNode.description}
              </p>

              <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-900/50 text-xs text-amber-200/90 flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold uppercase tracking-wider text-[11px] text-amber-400">
                    Single Question Engine
                  </span>
                  <p className="text-[12px] leading-relaxed text-[#D4D4D8]">
                    Questions are generated individually via <code>/api/questions/generate</code>.
                    Each attempt evaluates your answer, adjusts difficulty dynamically, and updates your mastery.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Question Card & LeetCode Editor - Full Width */}
          <div className="w-full space-y-4">
            <Card className="space-y-5 bg-[#111114] border-[#292932] shadow-subtle text-[#F4F4F5] w-full">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#222229] pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#8B7CFF]" />
                  <h3 className="font-bold text-sm text-[#F4F4F5]">
                    Question #{Math.min(currentQuestionCount, targetQuestionCount)} of {targetQuestionCount}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {(question?.difficulty || activeNode?.difficulty) && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                      (question?.difficulty || 3) <= 2
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                        : (question?.difficulty || 3) <= 3
                        ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                        : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                    }`}>
                      Diff Lvl {question?.difficulty || activeNode?.difficulty || 3}
                    </span>
                  )}
                  <Badge variant="ai" size="sm" className="uppercase font-mono">
                    {question?.options && question.options.length > 0 ? 'MCQ' : 'Code Problem'}
                  </Badge>
                  {question?.execution_method && (
                    <Badge variant="default" size="sm" className="font-mono text-[10px]">
                      {question.execution_method}
                    </Badge>
                  )}
                  {question && !attemptResult?.passed && !nodeCompleted && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={regenerateQuestion}
                      disabled={isLoadingQuestion || isFetchingNext || isSubmitting || isRegeneratingQuestion}
                      isLoading={isRegeneratingQuestion}
                      title="Replace this question with another one without advancing your question count"
                    >
                      {!isRegeneratingQuestion && <RefreshCw className="w-3.5 h-3.5" />}
                      Regenerate question
                    </Button>
                  )}
                </div>
              </div>

              {streamError && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="leading-relaxed">{streamError}</span>
                </div>
              )}
              {isLoadingQuestion ? (
                <div className="py-12 flex flex-col items-center justify-center text-[#71717A] text-xs gap-3">
                  <Loader2 className="w-6 h-6 text-[#8B7CFF] animate-spin" />
                  <span>Generating client-safe question for {activeNode.title}...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Problem Prompt */}
                  <div className="bg-[#16161B] border border-[#222229] p-4 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-extrabold text-[#8B7CFF] uppercase tracking-wider font-mono flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-[#8B7CFF]" /> Problem Prompt
                      {(isStreamingQuestion || isFetchingNext) && (
                        <span className="ml-auto normal-case tracking-normal font-medium text-[#A1A1AA] flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> writing…
                        </span>
                      )}
                    </span>
                    <div className="text-xs sm:text-sm text-[#F4F4F5] leading-relaxed">
                      <MarkdownRenderer content={question?.markdown || questionText} />
                    </div>
                    {isCodeQuestion && (isStreamingQuestion || isFetchingNext) && !(question?.test_cases?.length > 0) && (
                      <div className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1.5 pt-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> generating test cases…
                      </div>
                    )}
                  </div>

                  {/* LeetCode Style Code Editor & Execution Console for Code Problems */}
                  {isCodeQuestion ? (
                    <LeetCodeEditor
                      code={userAnswer}
                      onChange={(val) => dispatch(setUserAnswer(val))}
                      targetLanguage={targetLanguage}
                      question={question}
                      isPyodideReady={isPyodideReady}
                      isRunningCode={isRunningCode}
                      onRunCode={handleRunBrowserCode}
                      codeExecutionResults={codeExecutionResults}
                      defaultStarterCode={defaultStarterCode}
                    />
                  ) : (
                    /* Render Test Cases if present for non-code questions */
                    question?.test_cases && question.test_cases.length > 0 && (
                      <div className="space-y-2.5 bg-[#0D0D10] border border-[#222229] p-4 rounded-xl text-[#F4F4F5] shadow-inner">
                        <div className="flex items-center justify-between border-b border-[#222229] pb-2">
                          <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 uppercase tracking-wider font-mono">
                            <Terminal className="w-4 h-4 text-emerald-400" />
                            Test Cases ({question.test_cases.length})
                          </div>
                          <span className="text-[10px] text-[#71717A] font-mono">
                            {question.execution_method || 'llm_rubric'}
                          </span>
                        </div>

                        {/* Test Case Tab Selectors */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {question.test_cases.map((tc, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveTestCaseTab(idx)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                activeTestCaseTab === idx
                                  ? 'bg-[#6558F5] text-white shadow-sm ring-1 ring-[#8B7CFF]'
                                  : 'bg-[#16161B] text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1C1C23]'
                              }`}
                            >
                              Case {idx + 1}
                            </button>
                          ))}
                        </div>

                        {/* Active Test Case Input & Expected Output Box */}
                        {question.test_cases[activeTestCaseTab] && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono uppercase text-[#71717A] tracking-wider">Input</span>
                              <div className="bg-[#111114] border border-[#222229] p-2.5 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto">
                                {question.test_cases[activeTestCaseTab].input}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-mono uppercase text-[#71717A] tracking-wider">Expected Output</span>
                              <div className="bg-[#111114] border border-[#222229] p-2.5 rounded-lg font-mono text-xs text-cyan-300 overflow-x-auto">
                                {question.test_cases[activeTestCaseTab].expected_output}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* MCQ Choices if options exist */}
                  {question?.options && question.options.length > 0 && (
                    <div className="space-y-2.5 pt-1">
                      {question.options.map((opt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleOptionSelect(idx, opt)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                            selectedOption === idx
                              ? 'bg-[#211C38] border-[#8B7CFF] text-[#8B7CFF] ring-1 ring-[#8B7CFF]/30 shadow-xs font-semibold'
                              : 'bg-[#16161B] border-[#292932] text-[#F4F4F5] hover:border-[#49406F] hover:bg-[#1C1C23]'
                          }`}
                        >
                          <span className="font-bold mr-2 text-[#8B7CFF]">{String.fromCharCode(65 + idx)}.</span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Evaluation Feedback Banner */}
              {attemptResult && (
                <div
                  className={`p-4 rounded-xl border space-y-2 animate-fadeIn ${
                    attemptResult.passed
                      ? 'bg-emerald-950/40 text-emerald-200 border-emerald-800/80'
                      : 'bg-rose-950/40 text-rose-200 border-rose-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {attemptResult.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      )}
                      {attemptResult.passed ? 'Answer Verified Correct!' : 'Needs Revision'}
                    </div>
                    <Badge variant={attemptResult.passed ? 'success' : 'danger'} size="sm">
                      Score: {formattedScore}%
                    </Badge>
                  </div>

                  <div className="text-xs leading-relaxed font-medium"><MarkdownRenderer content={attemptResult.feedback} /></div>
                </div>
              )}

              {/* Action Buttons */}
              {isCurrentMastered || nodeCompleted ? (
                <div className="p-4 rounded-2xl bg-[#16161B] border border-[#49406F] text-[#F4F4F5] space-y-3 shadow-subtle animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
                    <div>
                      <div className="font-extrabold text-sm text-[#F4F4F5]">
                        {activeNodeSkipped ? 'Question Set Skipped' : 'Practice Concept Mastered! 🎉'}
                      </div>
                      <div className="text-xs text-[#A1A1AA]">
                        {activeNodeSkipped
                          ? `${activeNode.title} was skipped and is not marked as mastered.`
                          : `Target practice questions (${targetQuestionCount}/${targetQuestionCount}) completed for ${activeNode.title}.`}
                      </div>
                    </div>
                  </div>

                  {nextNode ? (
                    <Button
                      onClick={handleAdvanceToNextNode}
                      size="md"
                      className="w-full font-bold shadow-md cursor-pointer"
                    >
                      Advance to Next Concept: {nextNode.title}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          if (pathId) {
                            completeLevel(pathId);
                          }
                          dispatch(setActiveTab('path'));
                        }}
                        size="md"
                        className="w-full font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate Next Level Graph ✨
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                      <Button
                        onClick={handleBackToPath}
                        size="md"
                        variant="secondary"
                        className="w-full font-bold shadow-sm cursor-pointer"
                      >
                        View Roadmap Graph
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#222229]">
                  {!attemptResult ? (
                    <div className="w-full space-y-2">
                      <Button
                        onClick={handleSubmitQuestion}
                        isLoading={isSubmitting}
                        disabled={!userAnswer || isLoadingQuestion || isSubmitting || (isCodeQuestion && !testsCleared)}
                        size="md"
                        className="w-full font-bold shadow-sm cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white mr-1.5" />
                        {isCodeQuestion && !testsCleared
                          ? 'Run all test cases first'
                          : `Submit Answer (Question ${Math.min(currentQuestionCount, targetQuestionCount)}/${targetQuestionCount})`}
                      </Button>
                      {isCodeQuestion && !testsCleared && (
                        <p className="text-[11px] text-amber-400 text-center font-mono">
                          {hasTestCases
                            ? 'All test cases must pass before you can submit.'
                            : 'Waiting for test cases to be generated…'}
                        </p>
                      )}
                    </div>
                  ) : canAdvance ? (
                    <Button
                      onClick={fetchNextQuestion}
                      isLoading={isFetchingNext}
                      size="md"
                      className="w-full font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Next Question (Question {Math.min((attemptResult.next_question_count || currentQuestionCount + 1), targetQuestionCount)}/{targetQuestionCount})
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <div className="w-full space-y-2">
                      <Button
                        onClick={handleRetryQuestion}
                        size="md"
                        variant="secondary"
                        className="w-full font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Retry Question {currentQuestionCount}/{targetQuestionCount}
                      </Button>
                      {isCodeQuestion && attemptResult.passed && !testsCleared && (
                        <p className="text-[11px] text-amber-400 text-center font-mono">
                          Fix the failing test cases before moving on.
                        </p>
                      )}
                    </div>
                  )}
                  {question && !nodeCompleted && (
                    <Button
                      type="button"
                      onClick={skipQuestion}
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      disabled={isLoadingQuestion || isFetchingNext || isSubmitting}
                      isLoading={isFetchingNext && !isRegeneratingQuestion}
                    >
                      {currentQuestionCount >= targetQuestionCount ? 'Skip to next node' : 'Skip question'}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

