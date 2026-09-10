import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { learningApi } from '../api/learningApi';
import { setLearningPath } from '../features/learning/learningSlice';

export function useLearningPath() {
  const dispatch = useDispatch();
  const { userId, activeTopic, targetLevel, isAuthenticated } = useSelector((state) => state.user);
  const { sessionId } = useSelector((state) => state.diagnostic);

  const generateMutation = useMutation({
    mutationFn: () => learningApi.generatePath({
      topic: activeTopic,
      target_level: targetLevel,
      diagnostic_session_id: sessionId || null,
    }),
    onSuccess: (data) => {
      if (data) dispatch(setLearningPath(data));
    },
  });

  const query = useQuery({
    queryKey: ['learningPath', userId, activeTopic],
    queryFn: () => learningApi.getLearningPath({ user_id: userId, topic: activeTopic }),
    enabled: !!isAuthenticated && !!userId && !!activeTopic,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      dispatch(setLearningPath(query.data));
    }
  }, [query.data, dispatch]);

  return {
    pathData: query.data,
    isLoading: query.isLoading || generateMutation.isPending,
    refetch: query.refetch,
    generatePath: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
  };
}

