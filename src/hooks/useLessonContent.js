import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { learningApi } from '../api/learningApi';

export function useLessonContent(conceptId, node) {
  const { activeTopic, targetLanguage, explanationLanguage } = useSelector((state) => state.user);

  const level = node?.level || 'beginner';
  const pattern = node?.pattern || 'none';
  const prerequisites = node?.depends_on || [];
  const language = targetLanguage || 'python';
  const expLanguage = explanationLanguage || 'english';

  const [lesson, setLesson] = useState(null);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [userInput, setUserInput] = useState(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [isLoadingDeepDive, setIsLoadingDeepDive] = useState(false);
  const [error, setError] = useState(null);

  const cacheRef = useRef({});
  const fetchingKeyRef = useRef(null);
  const activeKey = `${activeTopic}_${conceptId}_${level}_${pattern}_${language}_${expLanguage}`;

  const fetchLesson = async () => {
    if (!conceptId || !activeTopic || (node && node.node_type && node.node_type !== 'learning')) {
      setLesson(null);
      setStreamingText('');
      setIsStreaming(false);
      setUserInput(null);
      setIsLoadingLesson(false);
      setIsLoadingDeepDive(false);
      return;
    }

    if (cacheRef.current[activeKey]) {
      const cached = cacheRef.current[activeKey];
      setLesson(cached);
      setStreamingText(cached.markdown || '');
      setIsStreaming(false);
      if (cached.checkpoint) {
        setUserInput({
          input_id: `checkpoint_${conceptId}`,
          type: 'single_select',
          label: 'Interactive Concept Checkpoint',
          description: cached.checkpoint.question,
          options: cached.checkpoint.options || [],
          required: true,
          metadata: {
            correct_option: cached.checkpoint.correct_option,
            explanation: cached.checkpoint.explanation,
          }
        });
      }
      setIsLoadingLesson(false);
      setIsLoadingDeepDive(false);
      return;
    }

    // Deduplicate in-flight requests (e.g. React Strict Mode or concurrent re-renders)
    if (fetchingKeyRef.current === activeKey) {
      return;
    }

    fetchingKeyRef.current = activeKey;
    setLesson(null);
    setStreamingText('');
    setIsStreaming(true);
    setUserInput(null);
    setIsLoadingLesson(true);
    setIsLoadingDeepDive(false);
    setError(null);

    const reqPayload = {
      topic: activeTopic,
      concept_id: conceptId,
      level,
      pattern,
      prerequisites,
      language,
      explanation_language: expLanguage,
    };

    let accumulatedMarkdown = '';
    let receivedContent = null;
    let receivedUserInput = null;

    try {
      // Single Unified Stream API: /api/learning/lesson/stream
      // Delivers standard typed SSE events: message_start, text_delta, user_input, message_end
      await learningApi.getLessonStream(
        reqPayload,
        (data) => {
          if (!data) return;

          // 1. message_start
          if (data.event === 'message_start' || data.event === 'start') {
            setIsLoadingLesson(false);
            setIsStreaming(true);
          }

          // 2. text_delta (Markdown chunks streaming incrementally)
          else if (data.event === 'text_delta') {
            const chunk = data.delta || '';
            accumulatedMarkdown += chunk;
            setStreamingText(accumulatedMarkdown);
            setIsLoadingLesson(false);
          }

          // Legacy token event fallback
          else if (data.event === 'token') {
            // raw json token fallback if any
            accumulatedMarkdown += data.delta || '';
            setStreamingText(accumulatedMarkdown);
          }

          // 3. question event (structured question JSON)
          else if (data.event === 'question') {
            const qQuestion = data.question;
            const qOptions = data.options || [];
            if (qQuestion && qOptions.length > 0) {
              setUserInput((prev) => ({
                input_id: `checkpoint_${data.concept_id || conceptId}`,
                type: 'single_select',
                label: 'Interactive Concept Checkpoint',
                description: qQuestion,
                options: qOptions,
                required: true,
                metadata: {
                  ...(prev?.metadata || {}),
                  concept_id: data.concept_id || conceptId,
                }
              }));
            }
          }

          // 4. user_input (interactive Checkpoint component)
          else if (data.event === 'user_input') {
            const inputPayload = data.input;
            receivedUserInput = inputPayload;
            setUserInput(inputPayload);
          }

          // 4. message_end or complete or cached
          else if (data.event === 'message_end' || data.event === 'complete' || data.event === 'cached') {
            setIsStreaming(false);
            setIsLoadingLesson(false);
            setIsLoadingDeepDive(false);

            const contentPayload = data.payload?.content || data.content || {};
            const finalMarkdown = data.payload?.markdown || data.markdown || accumulatedMarkdown;
            const finalCheckpoint = data.payload?.checkpoint || data.checkpoint || contentPayload.checkpoint;

            if (finalCheckpoint) {
              contentPayload.checkpoint = finalCheckpoint;
            } else if (receivedUserInput && !contentPayload.checkpoint) {
              contentPayload.checkpoint = {
                question: receivedUserInput.description || receivedUserInput.label,
                options: (receivedUserInput.options || []).map((o) => o.label || o.text || o),
                correct_option: receivedUserInput.metadata?.correct_option || 'Option A',
                explanation: receivedUserInput.metadata?.explanation || 'Validates concept understanding.',
              };
            }

            contentPayload.markdown = finalMarkdown;
            receivedContent = contentPayload;
            cacheRef.current[activeKey] = contentPayload;
            setLesson(contentPayload);
            setStreamingText(finalMarkdown);
          }

          // 5. error
          else if (data.event === 'error') {
            throw new Error(data.message || 'Error occurred while streaming lesson');
          }
        },
        (streamErr) => {
          console.error('[useLessonContent] Lesson stream error:', streamErr);
          setError(streamErr?.message || 'Failed to generate lesson content');
          setIsStreaming(false);
          setIsLoadingLesson(false);
          setIsLoadingDeepDive(false);
        }
      );
    } catch (err) {
      console.error('[useLessonContent] Lesson stream connection error:', err);
      setError(err?.message || 'Failed to generate lesson content');
    } finally {
      fetchingKeyRef.current = null;
      setIsStreaming(false);
      setIsLoadingLesson(false);
      setIsLoadingDeepDive(false);
    }
  };

  const regenerateLesson = async () => {
    if (!conceptId || !activeTopic || (node && node.node_type && node.node_type !== 'learning')) {
      return;
    }

    // Bust local ref cache
    delete cacheRef.current[activeKey];
    fetchingKeyRef.current = activeKey;

    setLesson(null);
    setStreamingText('');
    setIsStreaming(true);
    setUserInput(null);
    setIsLoadingLesson(true);
    setIsLoadingDeepDive(false);
    setError(null);

    const reqPayload = {
      topic: activeTopic,
      concept_id: conceptId,
      level,
      pattern,
      prerequisites,
      language,
      explanation_language: expLanguage,
    };

    let accumulatedMarkdown = '';
    let receivedContent = null;
    let receivedUserInput = null;

    try {
      await learningApi.regenerateLessonStream(
        reqPayload,
        (data) => {
          if (!data) return;

          if (data.event === 'message_start' || data.event === 'start') {
            setIsLoadingLesson(false);
            setIsStreaming(true);
          } else if (data.event === 'text_delta') {
            const chunk = data.delta || '';
            accumulatedMarkdown += chunk;
            setStreamingText(accumulatedMarkdown);
            setIsLoadingLesson(false);
          } else if (data.event === 'question') {
            const qQuestion = data.question;
            const qOptions = data.options || [];
            if (qQuestion && qOptions.length > 0) {
              setUserInput((prev) => ({
                input_id: `checkpoint_${data.concept_id || conceptId}`,
                type: 'single_select',
                label: 'Interactive Concept Checkpoint',
                description: qQuestion,
                options: qOptions,
                required: true,
                metadata: {
                  ...(prev?.metadata || {}),
                  concept_id: data.concept_id || conceptId,
                }
              }));
            }
          } else if (data.event === 'user_input') {
            const inputPayload = data.input;
            receivedUserInput = inputPayload;
            setUserInput(inputPayload);
          } else if (data.event === 'message_end' || data.event === 'complete' || data.event === 'cached') {
            setIsStreaming(false);
            setIsLoadingLesson(false);
            setIsLoadingDeepDive(false);

            const contentPayload = data.payload?.content || data.content || {};
            const finalMarkdown = data.payload?.markdown || data.markdown || accumulatedMarkdown;
            const finalCheckpoint = data.payload?.checkpoint || data.checkpoint || contentPayload.checkpoint;

            if (finalCheckpoint) {
              contentPayload.checkpoint = finalCheckpoint;
            } else if (receivedUserInput && !contentPayload.checkpoint) {
              contentPayload.checkpoint = {
                question: receivedUserInput.description || receivedUserInput.label,
                options: (receivedUserInput.options || []).map((o) => o.label || o.text || o),
                correct_option: receivedUserInput.metadata?.correct_option || 'Option A',
                explanation: receivedUserInput.metadata?.explanation || 'Validates concept understanding.',
              };
            }

            contentPayload.markdown = finalMarkdown;
            receivedContent = contentPayload;
            cacheRef.current[activeKey] = contentPayload;
            setLesson(contentPayload);
            setStreamingText(finalMarkdown);
          } else if (data.event === 'error') {
            throw new Error(data.message || 'Error occurred while regenerating lesson');
          }
        },
        (streamErr) => {
          console.error('[useLessonContent] Lesson regenerate stream error:', streamErr);
          setError(streamErr?.message || 'Failed to regenerate lesson content');
          setIsStreaming(false);
          setIsLoadingLesson(false);
          setIsLoadingDeepDive(false);
        }
      );
    } catch (err) {
      console.error('[useLessonContent] Lesson regenerate connection error:', err);
      setError(err?.message || 'Failed to regenerate lesson content');
    } finally {
      fetchingKeyRef.current = null;
      setIsStreaming(false);
      setIsLoadingLesson(false);
      setIsLoadingDeepDive(false);
    }
  };

  useEffect(() => {
    fetchLesson();
  }, [activeTopic, conceptId, level, pattern, language, expLanguage, node?.node_type]);

  return {
    lesson,
    liveLesson: lesson,
    streamingText,
    isStreaming,
    userInput,
    isLoadingLesson,
    isLoadingDeepDive,
    error,
    refetchLesson: fetchLesson,
    regenerateLesson,
  };
}
