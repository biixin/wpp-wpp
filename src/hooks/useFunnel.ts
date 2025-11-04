import { useEffect, useRef } from 'react';
import { localStorageDB, FUNNEL_STEPS } from '../lib/localStorage';

interface UseFunnelProps {
  onTypingStart: () => void;
  onTypingEnd: () => void;
  onSendMessage: (content: string, type: 'text' | 'image' | 'audio', mediaUrl?: string, audioDuration?: number) => void;
}

export function useFunnel({ onTypingStart, onTypingEnd, onSendMessage }: UseFunnelProps) {
  const processingRef = useRef(false);
  const waitingForReplyRef = useRef(false);

  const processFunnel = async () => {
    if (processingRef.current || waitingForReplyRef.current) return;
    processingRef.current = true;

    try {
      const currentStepIndex = localStorageDB.funnelState.get();

      if (currentStepIndex >= FUNNEL_STEPS.length) {
        processingRef.current = false;
        return;
      }

      const currentStep = FUNNEL_STEPS[currentStepIndex];

      if (currentStep.action_type === 'wait_for_reply') {
        waitingForReplyRef.current = true;
        processingRef.current = false;
        return;
      }

      if (currentStep.action_type === 'send_message') {
        const delay = currentStep.typing_delay || 2000;
        await new Promise(resolve => setTimeout(resolve, delay));

        onTypingStart();

        await new Promise(resolve => setTimeout(resolve, 3000));

        onTypingEnd();

        if (currentStep.message_type === 'text' && currentStep.message_content) {
          onSendMessage(
            currentStep.message_content,
            'text'
          );
        } else if (currentStep.message_type === 'audio' && currentStep.media_url) {
          onSendMessage(
            '',
            'audio',
            currentStep.media_url,
            currentStep.audio_duration || 5
          );
        } else if (currentStep.message_type === 'image' && currentStep.media_url) {
          onSendMessage(
            currentStep.message_content || '',
            'image',
            currentStep.media_url
          );
        }

        localStorageDB.funnelState.set(currentStepIndex + 1);

        setTimeout(() => {
          processingRef.current = false;
          processFunnel();
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao processar funil:', error);
      processingRef.current = false;
    }
  };

  const onLeadReply = () => {
    if (!waitingForReplyRef.current) return;

    waitingForReplyRef.current = false;
    processingRef.current = false;
    const currentStepIndex = localStorageDB.funnelState.get();
    localStorageDB.funnelState.set(currentStepIndex + 1);

    setTimeout(() => {
      processFunnel();
    }, 1000);
  };

  useEffect(() => {
    processFunnel();
  }, []);

  return { onLeadReply };
}
