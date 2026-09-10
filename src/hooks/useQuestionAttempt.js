import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { questionApi } from '../api/questionApi';
import {
  setQuestionBatch,
  setAttemptResult,
  setIsSubmitting,
  setNodeCompleted
} from '../features/questions/questionsSlice';
import { updateNodeStatus } from '../features/learning/learningSlice';
import confetti from 'canvas-confetti';

export function useQuestionAttempt(conceptId) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { userId, activeTopic } = useSelector((state) => state.user);
  const {
    batchQuestions,
    batchIndex,
    currentRound = 1,
    totalRounds = 5,
    questionsPerRound = 3,
    totalNodeQuestions = 15,
    totalBatchQuestions,
    currentQuestion,
    userAnswer,
    attemptResult,
    isSubmitting
  } = useSelector((state) => state.questions);

  const batchQuery = useQuery({
    queryKey: ['questionBatch', activeTopic, conceptId, currentRound],
    queryFn: () => questionApi.getQuestionBatch({
      topic: activeTopic,
      concept_id: conceptId,
      count: 3
    }),
    enabled: !!conceptId && !!activeTopic,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (
      batchQuery.data?.questions &&
      batchQuery.data.questions.length > 0 &&
      (batchQuestions.length === 0 || currentQuestion === null)
    ) {
      dispatch(setQuestionBatch(batchQuery.data.questions));
    }
  }, [batchQuery.data, batchQuestions.length, currentQuestion, dispatch]);

  const activeQ = currentQuestion || (batchQuestions && batchQuestions[batchIndex]) || null;

  const submitMutation = useMutation({
    mutationFn: ({ answer }) => {
      dispatch(setIsSubmitting(true));
      const qId = activeQ?._id || activeQ?.id || `q_${conceptId}_r${currentRound}_${batchIndex + 1}`;
      return questionApi.submitAttempt({
        topic: activeTopic,
        user_id: userId,
        question_id: qId,
        concept_id: conceptId,
        difficulty: activeQ?.difficulty || 3,
        answer,
      });
    },
    onSuccess: (data) => {
      const isPassed = Boolean(data.passed || data.evaluation_breakdown?.correct || (data.score && data.score >= 0.7));
      const normalizedData = {
        ...data,
        passed: isPassed,
        feedback: data.feedback || (isPassed ? 'Correct answer! Concept mastery updated.' : 'Incorrect answer. Review concept guidelines and try again.'),
      };
      dispatch(setAttemptResult(normalizedData));
      
      const isLastQuestionOfRound = batchIndex >= (batchQuestions?.length || 3) - 1;
      const isFinalQuestionOfNode = (currentRound >= totalRounds && isLastQuestionOfRound) || data.mastery_update?.status === 'mastered';

      if (isFinalQuestionOfNode) {
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

  const globalQuestionIndex = Math.min(totalNodeQuestions, (currentRound - 1) * questionsPerRound + (batchIndex + 1));
  const isLastQuestion = currentRound >= totalRounds && batchIndex >= (batchQuestions?.length || 3) - 1;
  const isSubmittingState = submitMutation.isPending || isSubmitting;

  const submitAnswer = (answer) => {
    if (isSubmittingState || !answer) return;
    submitMutation.mutate({ answer });
  };

  return {
    question: activeQ,
    isLoadingQuestion: batchQuery.isLoading && (!batchQuestions || batchQuestions.length === 0),
    userAnswer,
    attemptResult,
    batchIndex: batchIndex + 1,
    currentRound,
    totalRounds,
    globalQuestionIndex,
    totalNodeQuestions: 15,
    totalBatchQuestions: batchQuestions?.length || 3,
    isLastQuestion,
    isSubmitting: isSubmittingState,
    submitAnswer,
  };
}
