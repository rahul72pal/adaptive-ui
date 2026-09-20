import { useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { diagnosticApi } from '../api/diagnosticApi';
import {
  startSession,
  addMessage,
  recordTurnHistory,
  updateTurn,
  completeDiagnostic
} from '../features/diagnostic/diagnosticSlice';
import { setActiveTab } from '../features/user/userSlice';

export function useDiagnostic() {
  const dispatch = useDispatch();
  const { activeTopic } = useSelector((state) => state.user);
  const { sessionId, turn, messages, status, totalTurns } = useSelector((state) => state.diagnostic);

  const startMutation = useMutation({
    mutationFn: (topicOverride) => {
      const topicToStart = (typeof topicOverride === 'string' && topicOverride.trim()) ? topicOverride.trim() : activeTopic;
      return diagnosticApi.startDiagnostic({ topic: topicToStart });
    },
    onSuccess: (data) => {
      dispatch(startSession({
        sessionId: data.session_id,
        firstQuestion: data.question || data.current_question || data.first_question,
        options: data.options || [],
        turn: data.current_turn || data.turns_used || 1,
      }));
      dispatch(setActiveTab('diagnostic'));
    },
  });

  const answerMutation = useMutation({
    mutationFn: (userAnswer) => {
      const lastAiMessage = [...messages].reverse().find((m) => m.sender === 'ai');
      const currentQuestionText = lastAiMessage ? lastAiMessage.text : 'Diagnostic Question';

      dispatch(addMessage({
        id: `user_${Date.now()}`,
        sender: 'user',
        text: userAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));

      return diagnosticApi.answerDiagnostic({ session_id: sessionId, answer: userAnswer, turn }).then((res) => {
        return { ...res, currentQuestionText, userAnswer };
      });
    },
    onSuccess: (data) => {
      let feedback = 'Response evaluated and confidence updated.';
      if (data.knowledge_profile && typeof data.knowledge_profile === 'object') {
        const entries = Object.values(data.knowledge_profile);
        const lastEntry = entries[entries.length - 1];
        if (lastEntry && typeof lastEntry === 'object' && lastEntry.feedback) {
          feedback = lastEntry.feedback;
        }
      }

      dispatch(recordTurnHistory({
        turn: data.turns_used || turn,
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
          knowledgeProfile: data.knowledge_profile,
        }));
      }
    },
  });

  return {
    startDiagnostic: startMutation.mutate,
    isStarting: startMutation.isPending,
    sendAnswer: answerMutation.mutate,
    isAnswering: answerMutation.isPending,
    messages,
    turn,
    totalTurns: totalTurns || 15,
    status,
  };
}
