import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setUserTopics, removeTopic, logout } from '../features/user/userSlice';
import { getUserTopicsApi, selectOrCreateTopicApi, deleteUserTopicApi } from '../api/topicsApi';

export function useUserTopics() {
  const dispatch = useDispatch();
  const { isAuthenticated, topics, activeTopic } = useSelector((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTopics = useCallback(async () => {
    if (!isAuthenticated) {
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserTopicsApi();
      if (data && data.topics) {
        dispatch(setUserTopics(data.topics));
      }
    } catch (err) {
      console.error('Failed to fetch user topics:', err);
      if (err?.response?.status === 401) {
        // Clean up expired credentials in store
        dispatch(logout());
        setError({
          status: 401,
          message: 'Your login session has expired. Please sign in again to load your saved curriculum.',
        });
      } else {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTopics();
    } else {
      setError(null);
    }
  }, [isAuthenticated, fetchTopics]);

  const selectOrCreateTopic = async (rawTopic) => {
    if (!rawTopic || !rawTopic.trim()) return null;
    setIsLoading(true);
    setError(null);
    try {
      const result = await selectOrCreateTopicApi(rawTopic.trim());
      // Re-fetch topic list from backend
      await fetchTopics();
      return result;
    } catch (err) {
      console.error('Failed to select/create topic:', err);
      if (err?.response?.status === 401) {
        dispatch(logout());
        setError({
          status: 401,
          message: 'Please sign in to create or select a custom curriculum topic.',
        });
      } else {
        setError(err);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTopic = async (topicSlug) => {
    if (!topicSlug) return;
    try {
      await deleteUserTopicApi(topicSlug);
      dispatch(removeTopic(topicSlug));
    } catch (err) {
      console.error('Failed to delete topic:', err);
      setError(err);
    }
  };

  const clearError = () => setError(null);

  return {
    topics,
    activeTopic,
    isLoading,
    error,
    clearError,
    fetchTopics,
    selectOrCreateTopic,
    deleteTopic,
  };
}
