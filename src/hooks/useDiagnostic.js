import { useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { diagnosticApi } from '../api/diagnosticApi';
import {
  startSession,
  addMessage,
  recordTurnHistory,
  updateTurn,
  completeDiagnostic,
  loadExistingSession
} from '../features/diagnostic/diagnosticSlice';
import { setActiveTab, setTopicModeChoice } from '../features/user/userSlice';

export function useDiagnostic() {
  const dispatch = useDispatch();
  const { activeTopic } = useSelector((state) => state.user);
  const { sessionId, turn, messages, status, totalTurns } = useSelector((state) => state.diagnostic);

  const startMutation = useMutation({
    mutationFn: (topicOverride) => {
      const topicToStart = (typeof topicOverride === 'string' && topicOverride.trim()) ? topicOverride.trim() : activeTopic;
      return diagnosticApi.startDiagnostic({ topic: topicToStart });
    },
    onSuccess: (data, topicOverride) => {
      const topicSlug = (typeof topicOverride === 'string' && topicOverride.trim()) ? topicOverride.trim() : activeTopic;
      if (data.messages && data.messages.length > 0) {
        dispatch(loadExistingSession({
          sessionId: data.session_id,
          turn: data.current_turn || data.turn || 1,
          turns_used: data.turns_used,
          is_complete: data.is_complete,
          knowledge_profile: data.knowledge_profile,
          messages: data.messages,
          turn_history: data.turn_history,
          current_question: data.question || data.current_question
        }));
      } else {
        dispatch(startSession({
          sessionId: data.session_id,
          firstQuestion: data.question || data.current_question || data.first_question,
          options: data.options || [],
          user_input: data.user_input || null,
          turn: data.current_turn || data.turns_used || 1,
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
      dispatch(loadExistingSession({
        sessionId: data.session_id,
        turn: data.turns_used || 1,
        turns_used: data.turns_used,
        is_complete: data.is_complete,
        knowledge_profile: data.knowledge_profile,
        messages: data.messages || [],
        turn_history: data.turn_history || [],
        current_question: data.current_question
      }));
    }
  });

  const answerMutation = useMutation({
    mutationFn: (userAnswer) => {
      const lastAiMessage = [...messages].reverse().find((m) => m.sender === 'ai');
      const currentQuestionText = lastAiMessage ? lastAiMessage.text : 'Diagnostic Question';
      const inputId = lastAiMessage?.userInput?.input_id || lastAiMessage?.input_id || null;

      dispatch(addMessage({
        id: `user_${Date.now()}`,
        sender: 'user',
        text: userAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));

      return diagnosticApi.answerDiagnostic({ session_id: sessionId, answer: userAnswer, turn, input_id: inputId }).then((res) => {
        return { ...res, currentQuestionText, userAnswer };
      });
    },
    onSuccess: (data) => {
      let feedback = data.feedback;
      if (!feedback && data.knowledge_profile && typeof data.knowledge_profile === 'object') {
        const evalConcept = data.last_evaluated_concept;
        if (evalConcept && data.knowledge_profile[evalConcept]?.feedback) {
          feedback = data.knowledge_profile[evalConcept].feedback;
        } else {
          const assessed = Object.values(data.knowledge_profile).filter(e => e && e.status !== 'unassessed' && e.feedback);
          if (assessed.length > 0) {
            feedback = assessed[assessed.length - 1].feedback;
          }
        }
      }
      if (!feedback) {
        feedback = 'Response evaluated and confidence updated.';
      }

      dispatch(recordTurnHistory({
        turn: data.turns_used || data.current_turn || turn,
        question: data.currentQuestionText,
        userAnswer: data.userAnswer,
        feedback,
      }));

      if (data.is_complete || data.status === 'completed' || (data.turns_used && data.turns_used >= 15)) {
        dispatch(completeDiagnostic(data.knowledge_profile));
      } else {
        dispatch(updateTurn({
          turn: data.turns_used || data.current_turn || (turn + 1),
          nextQuestion: data.current_question || data.question || data.next_question,
          options: data.options || [],
          user_input: data.user_input || null,
          knowledgeProfile: data.knowledge_profile,
        }));
      }
    },
  });

  return {
    startDiagnostic: startMutation.mutate,
    startDiagnosticAsync: startMutation.mutateAsync,
    isStarting: startMutation.isPending,
    loadSession: loadSessionMutation.mutate,
    loadSessionAsync: loadSessionMutation.mutateAsync,
    isLoadingSession: loadSessionMutation.isPending,
    sendAnswer: answerMutation.mutate,
    isAnswering: answerMutation.isPending,
    messages,
    turn,
    totalTurns: totalTurns || 15,
    status,
    sessionId
  };
}

