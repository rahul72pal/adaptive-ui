import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { learningApi } from '../api/learningApi';
import { setLearningPath } from '../features/learning/learningSlice';

import { setActiveTab } from '../features/user/userSlice';

export function useLearningPath() {
  const dispatch = useDispatch();
  const { userId, activeTopic, targetLevel, targetLanguage, explanationLanguage, isAuthenticated, activeTab, completedTopics = [] } = useSelector((state) => state.user);
  const { sessionId } = useSelector((state) => state.diagnostic);

  const generateMutation = useMutation({
    mutationFn: (topicOverride) => {
      const topicToUse = (typeof topicOverride === 'string' && topicOverride.trim()) ? topicOverride.trim() : activeTopic;
      return learningApi.generatePath({
        topic: topicToUse,
        target_level: targetLevel,
        diagnostic_session_id: sessionId || null,
        language: targetLanguage || 'python',
        explanation_language: explanationLanguage || 'english',
      });
    },
    onSuccess: (data) => {
      if (data) {
        dispatch(setLearningPath(data));
      }
      dispatch(setActiveTab('path'));
    },
  });

  const query = useQuery({
    queryKey: ['learningPath', userId, activeTopic],
    queryFn: () => learningApi.getLearningPath({ user_id: userId, topic: activeTopic }),
    enabled: !!isAuthenticated && !!userId && !!activeTopic && (activeTab === 'path' || activeTab === 'workspace' || completedTopics.includes(activeTopic)),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      dispatch(setLearningPath(query.data));
    }
  }, [query.data, dispatch]);

  const completeLevelMutation = useMutation({
    mutationFn: (learningPathId) => learningApi.completeLevel({ learning_path_id: learningPathId }),
    onSuccess: (data) => {
      if (data) {
        dispatch(setLearningPath(data));
      }
    },
  });

  const { pathId } = useSelector((state) => state.learning);

  const completeNodeMutation = useMutation({
    mutationFn: ({ topic, conceptId, learningPathId }) => learningApi.completeNode({
      topic: topic || activeTopic,
      concept_id: conceptId,
      learning_path_id: learningPathId || pathId || null,
    }),
    onSuccess: (data) => {
      if (data) {
        dispatch(setLearningPath(data));
      }
    },
  });

  return {
    pathData: query.data,
    isLoading: query.isLoading || generateMutation.isPending || completeLevelMutation.isPending || completeNodeMutation.isPending,
    refetch: query.refetch,
    generatePath: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    completeLevel: completeLevelMutation.mutate,
    isCompletingLevel: completeLevelMutation.isPending,
    completeNode: completeNodeMutation.mutateAsync,
    isCompletingNode: completeNodeMutation.isPending,
  };
}


