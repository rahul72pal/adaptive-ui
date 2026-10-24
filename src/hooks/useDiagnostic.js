import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { diagnosticApi } from '../api/diagnosticApi';
import { streamFetch } from '../api/streamClient';
import {
  startSession,
  addMessage,
  startStreamingAssistantMessage,
  setStreamingStatus,
  appendStreamToken,
  updateLiveEvaluation,
  finishStreamingAssistantMessage,
  recordTurnHistory,
  completeDiagnostic,
  loadExistingSession
} from '../features/diagnostic/diagnosticSlice';
import { setActiveTab, setTopicModeChoice } from '../features/user/userSlice';

export function useDiagnostic() {
  const dispatch = useDispatch();
  const { activeTopic } = useSelector((state) => state.user);
  const {
    sessionId,
    turn,
    messages,
    status,
    totalTurns,
    knowledgeProfile,
    currentConcept,
    lastFeedback,
    lastEvaluatedConcept,
    isStreaming,
    streamingStatus
  } = useSelector((state) => state.diagnostic);

  const [isLocalStreaming, setIsLocalStreaming] = useState(false);

  const startMutation = useMutation({
    mutationFn: (param) => {
      let topicToStart = activeTopic;
      let targetSessionId = null;
      if (typeof param === 'string' && param.trim()) {
        topicToStart = param.trim();
      } else if (param && typeof param === 'object') {
        if (param.topic) topicToStart = param.topic.trim();
        if (param.sessionId) targetSessionId = param.sessionId;
      }
      if (!targetSessionId && topicToStart) {
        targetSessionId = localStorage.getItem(`adaptive_diag_session_${topicToStart}`);
      }
      return diagnosticApi.startDiagnostic({ topic: topicToStart, session_id: targetSessionId });
    },
    onSuccess: (data, param) => {
      let topicSlug = activeTopic;
      if (typeof param === 'string' && param.trim()) {
        topicSlug = param.trim();
      } else if (param && typeof param === 'object' && param.topic) {
        topicSlug = param.topic.trim();
      }
      if (data.session_id && topicSlug) {
        localStorage.setItem(`adaptive_diag_session_${topicSlug}`, data.session_id);
      }
      if (data.messages && data.messages.length > 0) {
        dispatch(loadExistingSession({
          sessionId: data.session_id,
          turn: data.current_turn || data.turn || 1,
          turns_used: data.turns_used,
          is_complete: data.is_complete,
          knowledge_profile: data.knowledge_profile,
          messages: data.messages,
          turn_history: data.turn_history,
          current_question: data.question || data.current_question,
          current_concept: data.current_concept
        }));
      } else {
        dispatch(startSession({
          sessionId: data.session_id,
          firstQuestion: data.question || data.current_question || data.first_question,
          options: data.options || [],
          user_input: data.user_input || null,
          turn: data.current_turn || data.turns_used || 1,
          knowledgeProfile: data.knowledge_profile || null,
          currentConcept: data.current_concept || null,
        }));
      }

      if (topicSlug) {
        dispatch(setTopicModeChoice({ topicId: topicSlug, modeChoice: 'diagnostic', sessionId: data.session_id }));
      }
      dispatch(setActiveTab('diagnostic'));
    },
  });

  const loadSessionMutation = useMutation({
    mutationFn: (targetSessionId) => {
      const idToFetch = targetSessionId || sessionId;
      return diagnosticApi.getDiagnosticState(idToFetch);
    },
    onSuccess: (data) => {
      if (data.session_id && data.topic) {
        localStorage.setItem(`adaptive_diag_session_${data.topic}`, data.session_id);
      } else if (data.session_id && activeTopic) {
        localStorage.setItem(`adaptive_diag_session_${activeTopic}`, data.session_id);
      }
      dispatch(loadExistingSession({
        sessionId: data.session_id,
        turn: data.turns_used || 1,
        turns_used: data.turns_used,
        is_complete: data.is_complete,
        knowledge_profile: data.knowledge_profile,
        messages: data.messages || [],
        turn_history: data.turn_history || [],
        current_question: data.current_question,
        current_concept: data.current_concept,
      }));
    }
  });

  // Streaming Answer Submission handler
  const sendAnswerStream = useCallback(async (userAnswer) => {
    if (!userAnswer || !sessionId || isStreaming || isLocalStreaming) return;

    const lastAiMessage = [...messages].reverse().find((m) => m.sender === 'ai');
    const currentQuestionText = lastAiMessage ? lastAiMessage.text : 'Diagnostic Question';
    const inputId = lastAiMessage?.userInput?.input_id || lastAiMessage?.input_id || null;

    // 1. Add user message
    dispatch(addMessage({
      id: `user_${Date.now()}`,
      sender: 'user',
      text: userAnswer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

    // 2. Start streaming assistant message placeholder
    setIsLocalStreaming(true);
    dispatch(startStreamingAssistantMessage({
      id: `ai_stream_${Date.now()}`,
      status: 'evaluating'
    }));

    let receivedInput = null;
    let accumulatedTokens = [];
    let evaluatedPayload = null;

    try {
      await streamFetch(
        '/diagnostic/answer/stream',
        { session_id: sessionId, answer: userAnswer, input_id: inputId },
        (data) => {
          if (!data) return;

          // Tool indicators
          if (data.event === 'tool_start') {
            if (data.tool_name === 'score_node') {
              dispatch(setStreamingStatus('evaluating'));
            } else if (data.tool_name === 'ask_node') {
              dispatch(setStreamingStatus('generating'));
            }
          }

          // Real-time evaluation event: Update Knowledge Profile & AI Feedback instantly!
          if (data.event === 'evaluated') {
            evaluatedPayload = data;
            dispatch(updateLiveEvaluation({
              knowledgeProfile: data.knowledge_profile,
              feedback: data.feedback,
              currentConcept: data.current_concept,
              lastEvaluatedConcept: data.current_concept || data.concept,
              turn: data.turn,
            }));

            dispatch(recordTurnHistory({
              turn: data.turn,
              question: currentQuestionText,
              userAnswer,
              feedback: data.feedback || 'Assessment recorded by Lumina AI engine.',
              concept: data.current_concept,
            }));
          }

          // Token streaming for the next question (typewriter effect)
          if (data.event === 'text_delta' || data.event === 'question_token') {
            if (data.delta) {
              accumulatedTokens.push(data.delta);
              dispatch(appendStreamToken(data.delta));
            }
          }

          // Structured interactive input prompt
          if (data.event === 'user_input') {
            receivedInput = data.input;
          }

          // Stream completion
          if (data.event === 'message_end' || data.event === 'question_complete' || data.event === 'complete') {
            const isComplete = Boolean(
              data.is_complete ||
              data.payload?.is_complete ||
              evaluatedPayload?.is_complete ||
              (data.turn && data.turn >= 15) ||
              (data.payload?.turn && data.payload?.turn >= 15)
            );

            const finalProfile = data.payload?.knowledge_profile || data.knowledge_profile || evaluatedPayload?.knowledge_profile;
            const finalFeedback = evaluatedPayload?.feedback || data.payload?.feedback || data.feedback;
            const finalConcept = data.payload?.current_concept || data.current_concept || evaluatedPayload?.current_concept;
            const finalTurn = data.payload?.turn || data.turn || evaluatedPayload?.turn || (turn + 1);

            dispatch(updateLiveEvaluation({
              knowledgeProfile: finalProfile,
              feedback: finalFeedback,
              currentConcept: finalConcept,
              lastEvaluatedConcept: evaluatedPayload?.current_concept || data.last_evaluated_concept,
              turn: finalTurn,
            }));

            const finalQuestion = data.payload?.current_question || data.current_question || data.markdown || accumulatedTokens.join('') || undefined;
            const opts = data.options || (receivedInput?.options ? receivedInput.options.map(o => typeof o === 'object' ? (o.label || o.text || o.value) : o) : []);

            dispatch(finishStreamingAssistantMessage({
              text: finalQuestion,
              options: opts,
              userInput: receivedInput || data.payload?.user_input || null,
            }));

            if (isComplete) {
              dispatch(completeDiagnostic(finalProfile));
            }
          }

          if (data.event === 'error') {
            console.error('[Diagnostic Stream Error]:', data.message);
            dispatch(finishStreamingAssistantMessage({
              text: `⚠️ **Diagnostic Evaluation Note:** ${data.message || 'Stream connection interrupted. Please try again.'}`
            }));
          }
        },
        (streamErr) => {
          console.error('[Diagnostic Stream Fetch Error]:', streamErr);
          dispatch(finishStreamingAssistantMessage({
            text: '⚠️ An error occurred while streaming the AI response. Please check your network and try again.'
          }));
        }
      );
    } catch (err) {
      console.error('[sendAnswerStream catch]:', err);
      dispatch(finishStreamingAssistantMessage({
        text: '⚠️ Unable to complete AI diagnostic stream.'
      }));
    } finally {
      setIsLocalStreaming(false);
    }
  }, [sessionId, isStreaming, isLocalStreaming, messages, turn, dispatch]);

  const isAnswering = isStreaming || isLocalStreaming;

  return {
    startDiagnostic: startMutation.mutate,
    startDiagnosticAsync: startMutation.mutateAsync,
    isStarting: startMutation.isPending,
    loadSession: loadSessionMutation.mutate,
    loadSessionAsync: loadSessionMutation.mutateAsync,
    isLoadingSession: loadSessionMutation.isPending,
    sendAnswer: sendAnswerStream,
    isAnswering,
    messages,
    turn,
    totalTurns: totalTurns || 15,
    status,
    sessionId,
    knowledgeProfile,
    currentConcept,
    lastFeedback,
    lastEvaluatedConcept,
    streamingStatus,
  };
}


