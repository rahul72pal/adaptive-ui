import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { questionApi } from '../api/questionApi';
import {
  setCurrentQuestion,
  setAttemptResult,
  setNextQuestion,
  setIsSubmitting,
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

  const singleQuestionQuery = useQuery({
    queryKey: ['singleQuestion', activeTopic, conceptId, difficulty, currentQuestionCount, targetLanguage, explanationLanguage],
    queryFn: () => questionApi.generateQuestion({
      topic: activeTopic,
      concept_id: conceptId,
      concept_type: conceptType,
      difficulty,
      language: targetLanguage || 'python',
      explanation_language: explanationLanguage || 'english',
    }),
    enabled: !!conceptId && !!activeTopic && !currentQuestion && !nodeCompleted && isPracticeNode,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });


  useEffect(() => {
    if (singleQuestionQuery.data && !currentQuestion) {
      dispatch(setCurrentQuestion(singleQuestionQuery.data));
    }
  }, [singleQuestionQuery.data, currentQuestion, dispatch]);

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
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else if (isPassed) {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.7 }
        });
      }
      queryClient.invalidateQueries(['progress']);
    },
    onError: (err) => {
      console.error('[submitAttempt] Error:', err);
      dispatch(setIsSubmitting(false));
    }
  });

  const nextQuestionMutation = useMutation({
    mutationFn: async () => {
      if (attemptResult?.next_question) {
        return attemptResult.next_question;
      }
      return await questionApi.generateQuestion({
        topic: activeTopic,
        concept_id: conceptId,
        concept_type: conceptType,
        difficulty: attemptResult?.next_difficulty || difficulty || 3,
        language: targetLanguage || 'python',
        explanation_language: explanationLanguage || 'english',
      });
    },
    onSuccess: (nextQ) => {
      dispatch(setNextQuestion(nextQ));
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
      dispatch(setNextQuestion(attemptResult.next_question));
    } else {
      nextQuestionMutation.mutate();
    }
  };

  return {
    question: activeQ,
    isLoadingQuestion: singleQuestionQuery.isLoading && !activeQ,
    userAnswer,
    attemptResult,
    currentQuestionCount: attemptResult?.current_question_count || currentQuestionCount,
    targetQuestionCount: attemptResult?.target_question_count || effectiveTargetCount,
    nodeCompleted,
    isSubmitting: submitMutation.isPending || isSubmitting,
    isFetchingNext: nextQuestionMutation.isPending,
    submitAnswer,
    fetchNextQuestion: handleNextQuestion,
    retryQuestion,
  };
}

