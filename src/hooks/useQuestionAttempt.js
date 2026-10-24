import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { questionApi } from '../api/questionApi';
import {
  setAttemptResult,
  setIsSubmitting,
  startStreamingQuestion,
  patchCurrentQuestion,
  setNodeCompleted
} from '../features/questions/questionsSlice';
import { updateNodeStatus, setLearningPath } from '../features/learning/learningSlice';
import confetti from 'canvas-confetti';

export function useQuestionAttempt(conceptId, node = null) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { userId, activeTopic, targetLanguage, explanationLanguage } = useSelector((state) => state.user);
  const {
    currentQuestion,
    userAnswer,
    attemptResult,
    isSubmitting,
    currentQuestionCount = 1,
    targetQuestionCount = 5,
    difficulty = 3,
    nodeCompleted = false,
  } = useSelector((state) => state.questions);

  const activeQ = currentQuestion;

  const conceptType = node?.concept_type || 'conceptual';
  const isPracticeNode = node?.node_type === 'practice' || node?.type === 'practice';

  const [isStreamingQuestion, setIsStreamingQuestion] = useState(false);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [streamError, setStreamError] = useState(null);

  const currentQuestionRef = useRef(currentQuestion);
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  const streamKeyRef = useRef(null);
  const nextStreamRef = useRef(false);

  // Progressive question stream: statement tokens first, then code + test cases.
  useEffect(() => {
    if (!isPracticeNode || !conceptId || !activeTopic || nodeCompleted) return;

    // One stream per (concept, topic, difficulty, language). This also replaces
    // any stale question left over from a previously selected node.
    const key = `${conceptId}|${activeTopic}|${difficulty}|${targetLanguage}`;
    if (streamKeyRef.current === key) return;
    streamKeyRef.current = key;

    let cancelled = false;
    let statement = '';
    setIsStreamingQuestion(true);
    setStreamError(null);

    dispatch(startStreamingQuestion({
      question: {
        concept_id: conceptId,
        concept_type: conceptType,
        difficulty,
        type: 'practice',
        question: '',
        markdown: '',
        test_cases: [],
      },
      resetSession: true,
    }));

    const handleEvent = (evt) => {
      if (cancelled || !evt) return;
      switch (evt.event) {
        case 'token':
          statement += evt.delta || '';
          dispatch(patchCurrentQuestion({ question: statement, markdown: statement }));
          break;
        case 'question_ready':
          dispatch(patchCurrentQuestion({
            ...(evt.question || {}),
            markdown: evt.markdown || statement,
          }));
          break;
        case 'meta':
          dispatch(patchCurrentQuestion({
            type: evt.type,
            function_signature: evt.function_signature,
            options: evt.options,
            rubric: evt.rubric,
            expected_time_complexity: evt.expected_time_complexity,
            expected_space_complexity: evt.expected_space_complexity,
            starter_code: evt.starter_code,
          }));
          break;
        case 'test_cases':
          dispatch(patchCurrentQuestion({
            test_cases: evt.test_cases || [],
            execution_method: 'onecompiler',
          }));
          break;
        case 'cached':
        case 'complete': {
          const q = evt.question || {};
          dispatch(patchCurrentQuestion({
            ...q,
            markdown: evt.markdown || q.markdown || statement,
          }));
          setIsStreamingQuestion(false);
          break;
        }
        case 'error':
          setStreamError(evt.message || 'Question generation failed.');
          setIsStreamingQuestion(false);
          break;
        default:
          break;
      }
    };

    questionApi
      .generateQuestionStream(
        {
          topic: activeTopic,
          concept_id: conceptId,
          concept_type: conceptType,
          difficulty,
          language: targetLanguage || 'python',
          explanation_language: explanationLanguage || 'english',
        },
        handleEvent,
        (err) => {
          if (cancelled) return;
          setStreamError(String(err?.message || err));
          setIsStreamingQuestion(false);
        }
      )
      .finally(() => {
        if (cancelled) return;
        setIsStreamingQuestion(false);
        // If the stream produced no statement, fall back to the blocking endpoint.
        if (!currentQuestionRef.current?.question) {
          questionApi
            .generateQuestion({
              topic: activeTopic,
              concept_id: conceptId,
              concept_type: conceptType,
              difficulty,
              language: targetLanguage || 'python',
              explanation_language: explanationLanguage || 'english',
            })
            .then((q) => dispatch(patchCurrentQuestion(q)))
            .catch(() => {});
        }
      });

    return () => {
      cancelled = true;
    };
    // `currentQuestion` is intentionally excluded; it would cancel our own stream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conceptId, activeTopic, isPracticeNode, nodeCompleted, difficulty, conceptType, targetLanguage, explanationLanguage, dispatch]);

  const effectiveTargetCount = node?.target_question_count || targetQuestionCount || 3;

  const submitMutation = useMutation({
    mutationFn: ({ answer, test_run_count = 0, test_cases_passed = null, total_test_cases = null }) => {
      dispatch(setIsSubmitting(true));
      const qId = activeQ?._id || activeQ?.id || `q_${conceptId}_${currentQuestionCount}`;
      return questionApi.submitAttempt({
        topic: activeTopic,
        user_id: userId,
        question_id: qId,
        concept_id: conceptId,
        difficulty: activeQ?.difficulty || difficulty || 3,
        answer,
        current_question_count: currentQuestionCount,
        target_question_count: effectiveTargetCount,
        test_run_count,
        test_cases_passed,
        total_test_cases,
        language: targetLanguage || 'python',
        explanation_language: explanationLanguage || 'english',
      });
    },
    onSuccess: (data) => {
      const isPassed = Boolean(data.passed || data.evaluation_breakdown?.correct || (data.score && data.score >= 0.7));
      const normalizedData = {
        ...data,
        passed: isPassed,
        target_question_count: data.target_question_count || effectiveTargetCount,
        feedback: data.feedback || (isPassed ? 'Correct answer! Concept mastery updated.' : 'Incorrect answer. Review concept guidelines and try again.'),
      };
      dispatch(setAttemptResult(normalizedData));

      if (data.learning_path_update && isPassed) {
        dispatch(setLearningPath(data.learning_path_update));
      }

      const isFinal = Boolean(
        isPassed && (
          data.is_concept_completed ||
          data.mastery_update?.status === 'mastered' ||
          (data.correct_count && data.correct_count >= effectiveTargetCount)
        )
      );

      if (isFinal) {
        dispatch(setNodeCompleted(true));
        dispatch(updateNodeStatus({
          conceptId,
          status: 'mastered',
          masteryScore: data.mastery_update?.new_score || 95
        }));
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } else if (isPassed) {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
      }
      queryClient.invalidateQueries(['progress']);
    },
    onError: (err) => {
      console.error('[submitAttempt] Error:', err);
      dispatch(setIsSubmitting(false));
    }
  });

  const submitAnswer = (answer, metrics = {}) => {
    if (submitMutation.isPending || isSubmitting || !answer) return;
    submitMutation.mutate({
      answer,
      test_run_count: metrics.test_run_count || 0,
      test_cases_passed: metrics.test_cases_passed ?? null,
      total_test_cases: metrics.total_test_cases ?? null,
    });
  };

  const retryQuestion = () => {
    dispatch(setAttemptResult(null));
  };

  const handleNextQuestion = () => {
    if (attemptResult?.next_question) {
      dispatch(startStreamingQuestion({ question: attemptResult.next_question }));
      return;
    }
    if (nextStreamRef.current) return;
    nextStreamRef.current = true;
    setIsFetchingNext(true);

    const nextCount = attemptResult?.next_question_count || currentQuestionCount + 1;
    const nextDifficulty = attemptResult?.next_difficulty || difficulty || 3;
    let statement = '';

    dispatch(startStreamingQuestion({
      question: {
        concept_id: conceptId,
        concept_type: conceptType,
        difficulty: nextDifficulty,
        type: 'practice',
        question: '',
        markdown: '',
        test_cases: [],
      },
      nextQuestionCount: nextCount,
    }));

    const handleEvent = (evt) => {
      if (!evt) return;
      if (evt.event === 'token') {
        statement += evt.delta || '';
        dispatch(patchCurrentQuestion({ question: statement, markdown: statement }));
      } else if (evt.event === 'question_ready') {
        dispatch(patchCurrentQuestion({ ...(evt.question || {}), markdown: evt.markdown || statement }));
      } else if (evt.event === 'meta') {
        dispatch(patchCurrentQuestion({
          type: evt.type,
          function_signature: evt.function_signature,
          options: evt.options,
          rubric: evt.rubric,
          expected_time_complexity: evt.expected_time_complexity,
          expected_space_complexity: evt.expected_space_complexity,
          starter_code: evt.starter_code,
        }));
      } else if (evt.event === 'test_cases') {
        dispatch(patchCurrentQuestion({ test_cases: evt.test_cases || [], execution_method: 'onecompiler' }));
      } else if (evt.event === 'cached' || evt.event === 'complete') {
        const q = evt.question || {};
        dispatch(patchCurrentQuestion({ ...q, markdown: evt.markdown || q.markdown || statement }));
        nextStreamRef.current = false;
        setIsFetchingNext(false);
      } else if (evt.event === 'error') {
        nextStreamRef.current = false;
        setIsFetchingNext(false);
      }
    };

    questionApi
      .generateQuestionStream(
        {
          topic: activeTopic,
          concept_id: conceptId,
          concept_type: conceptType,
          difficulty: nextDifficulty,
          language: targetLanguage || 'python',
          explanation_language: explanationLanguage || 'english',
        },
        handleEvent,
        () => {
          nextStreamRef.current = false;
          setIsFetchingNext(false);
        }
      )
      .finally(() => {
        nextStreamRef.current = false;
        setIsFetchingNext(false);
      });
  };

  return {
    question: activeQ,
    // Only "loading" until the first streamed token arrives, so the statement
    // renders progressively instead of waiting for the full generation.
    isLoadingQuestion: (isStreamingQuestion || isFetchingNext) && !(activeQ?.question || activeQ?.markdown),
    isStreamingQuestion,
    streamError,
    userAnswer,
    attemptResult,
    currentQuestionCount: attemptResult?.current_question_count || currentQuestionCount,
    targetQuestionCount: attemptResult?.target_question_count || effectiveTargetCount,
    nodeCompleted,
    isSubmitting: submitMutation.isPending || isSubmitting,
    isFetchingNext,
    submitAnswer,
    fetchNextQuestion: handleNextQuestion,
    retryQuestion,
  };
}
