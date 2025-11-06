import { useEffect, useRef } from 'react';
import { localStorageDB, FUNNEL_STEPS } from '../lib/localStorage';
import { createPixPayment, checkPaymentStatus } from '../services/pushinpay';

interface UseFunnelProps {
  onTypingStart: () => void;
  onTypingEnd: () => void;
  onSendMessage: (content: string, type: 'text' | 'image' | 'audio', mediaUrl?: string, audioDuration?: number) => void;
  onShowPaymentButtons: () => void;
  onShowPixPayment: (qrcodeImage: string, qrcode: string) => void;
  onStatusChange: (status: 'online' | 'digitando..' | 'gravando audio..') => void;
}

export function useFunnel({ onTypingStart, onTypingEnd, onSendMessage, onShowPaymentButtons, onShowPixPayment, onStatusChange }: UseFunnelProps) {
  const processingRef = useRef(false);
  const waitingForReplyRef = useRef(false);
  const waitingForPaymentRef = useRef(false);
  const paymentCheckAttemptsRef = useRef(0);

  const processFunnel = async () => {
    console.log('>>> processFunnel INICIADO <<<');
    console.log('processingRef.current:', processingRef.current);
    console.log('waitingForReplyRef.current:', waitingForReplyRef.current);
    console.log('waitingForPaymentRef.current:', waitingForPaymentRef.current);

    if (processingRef.current || waitingForReplyRef.current) {
      console.log('>>> processFunnel BLOQUEADO (já processando ou aguardando resposta)');
      return;
    }
    processingRef.current = true;

    try {
      const currentStepIndex = localStorageDB.funnelState.get();
      console.log('Step atual:', currentStepIndex);

      if (currentStepIndex >= FUNNEL_STEPS.length) {
        console.log('>>> FUNIL FINALIZADO <<<');
        processingRef.current = false;
        return;
      }

      const currentStep = FUNNEL_STEPS[currentStepIndex];
      console.log('Ação do step:', currentStep.action_type);

      if (currentStep.action_type === 'wait_for_reply') {
        console.log('>>> AGUARDANDO RESPOSTA DO LEAD <<<');
        waitingForReplyRef.current = true;
        processingRef.current = false;
        return;
      }

      if (currentStep.action_type === 'wait_for_payment') {
        console.log('>>> AGUARDANDO PAGAMENTO <<<');
        waitingForPaymentRef.current = true;
        processingRef.current = false;
        return;
      }

      if (currentStep.action_type === 'show_payment_buttons') {
        console.log('>>> MOSTRANDO BOTÕES DE PAGAMENTO <<<');
        await new Promise(resolve => setTimeout(resolve, 1000));
        onShowPaymentButtons();
        processingRef.current = false;
        return;
      }

      if (currentStep.action_type === 'show_pix_payment') {
        console.log('>>> MOSTRANDO PIX E AVANÇANDO <<<');
        localStorageDB.funnelState.set(currentStepIndex + 1);
        console.log('Step avançado para:', currentStepIndex + 1);

        setTimeout(() => {
          processingRef.current = false;
          processFunnel();
        }, 1000);
        return;
      }

      if (currentStep.action_type === 'send_message') {
        const delay = currentStep.typing_delay || 2000;
        await new Promise(resolve => setTimeout(resolve, delay));

        if (currentStep.message_type === 'text' && currentStep.message_content) {
          const textLength = currentStep.message_content.length;
          const typingDelay = Math.max(textLength * 50, 800);

          onStatusChange('digitando..');
          onTypingStart();
          await new Promise(resolve => setTimeout(resolve, typingDelay));
          onTypingEnd();
          await new Promise(resolve => setTimeout(resolve, 50));
          onStatusChange('online');
          await new Promise(resolve => setTimeout(resolve, 50));

          onSendMessage(
            currentStep.message_content,
            'text'
          );
        } else if (currentStep.message_type === 'audio' && currentStep.media_url) {
          const audioDuration = currentStep.audio_duration || 5;
          const audioDelay = audioDuration * 1000;

          onStatusChange('gravando audio..');
          onTypingStart();
          await new Promise(resolve => setTimeout(resolve, audioDelay));
          onTypingEnd();
          await new Promise(resolve => setTimeout(resolve, 50));
          onStatusChange('online');
          await new Promise(resolve => setTimeout(resolve, 50));

          onSendMessage(
            '',
            'audio',
            currentStep.media_url,
            audioDuration
          );
        } else if (currentStep.message_type === 'image' && currentStep.media_url) {
          onStatusChange('digitando..');
          onTypingStart();
          await new Promise(resolve => setTimeout(resolve, 2000));
          onTypingEnd();
          await new Promise(resolve => setTimeout(resolve, 50));
          onStatusChange('online');
          await new Promise(resolve => setTimeout(resolve, 50));

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

  const onLeadReply = async () => {
    console.log('=== onLeadReply CHAMADO ===');
    console.log('waitingForPaymentRef.current:', waitingForPaymentRef.current);
    console.log('waitingForReplyRef.current:', waitingForReplyRef.current);
    console.log('Current step index:', localStorageDB.funnelState.get());
    console.log('Current step:', FUNNEL_STEPS[localStorageDB.funnelState.get()]);

    if (waitingForPaymentRef.current) {
      console.log('>>> VERIFICANDO PAGAMENTO <<<');
      const paymentData = localStorageDB.paymentData.get();
      console.log('Dados do pagamento:', paymentData);

      if (!paymentData) {
        console.warn('Nenhum dado de pagamento encontrado!');
        return;
      }

      try {
        console.log('Verificando pagamento para ID:', paymentData.qrcode_id);
        const status = await checkPaymentStatus(paymentData.qrcode_id);
        console.log('Status do pagamento recebido:', status);

        if (status.qrcode_status === 'paid' || status.status === 'paid') {
          console.log('Pagamento confirmado!');
          waitingForPaymentRef.current = false;
          processingRef.current = false;
          paymentCheckAttemptsRef.current = 0;

          const currentStepIndex = localStorageDB.funnelState.get();
          localStorageDB.funnelState.set(currentStepIndex + 1);

          const confirmText = 'Pagamento confirmado com sucesso!';
          const textLength = confirmText.length;
          const typingDelay = Math.max(textLength * 50, 800);

          await new Promise(resolve => setTimeout(resolve, 1000));
          onStatusChange('digitando..');
          onTypingStart();
          await new Promise(resolve => setTimeout(resolve, typingDelay));
          onTypingEnd();
          await new Promise(resolve => setTimeout(resolve, 50));
          onStatusChange('online');
          await new Promise(resolve => setTimeout(resolve, 50));
          onSendMessage(confirmText, 'text');

          setTimeout(() => {
            processingRef.current = false;
            processFunnel();
          }, 500);

          return;
        } else {
          console.log('Pagamento ainda não realizado. Tentativa:', paymentCheckAttemptsRef.current + 1);
          paymentCheckAttemptsRef.current++;

          const messages = [
            'Amor tô aqui esperando o pagamento pra poder te enviar as fotos',
            'Ainda não consegui ver o pagamento meu amor',
            'Me envia o comprovante aqui vida!'
          ];

          const messageIndex = Math.min(paymentCheckAttemptsRef.current - 1, messages.length - 1);
          const message = messages[messageIndex];
          const textLength = message.length;
          const typingDelay = Math.max(textLength * 50, 800);

          await new Promise(resolve => setTimeout(resolve, 1000));
          onStatusChange('digitando..');
          onTypingStart();
          await new Promise(resolve => setTimeout(resolve, typingDelay));
          onTypingEnd();
          await new Promise(resolve => setTimeout(resolve, 50));
          onStatusChange('online');
          await new Promise(resolve => setTimeout(resolve, 50));
          onSendMessage(message, 'text');
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
      }
      return;
    }

    if (!waitingForReplyRef.current) return;

    waitingForReplyRef.current = false;
    processingRef.current = false;
    const currentStepIndex = localStorageDB.funnelState.get();
    localStorageDB.funnelState.set(currentStepIndex + 1);

    setTimeout(() => {
      processFunnel();
    }, 1000);
  };

  const onPaymentAmountSelected = async (amount: number) => {
    console.log('=== onPaymentAmountSelected CHAMADO ===');
    console.log('Valor selecionado:', amount);

    try {
      onStatusChange('digitando..');
      onTypingStart();
      await new Promise(resolve => setTimeout(resolve, 2000));
      onTypingEnd();
      onStatusChange('online');

      console.log('Criando pagamento PIX...');
      const paymentResponse = await createPixPayment(amount);
      console.log('Pagamento criado:', paymentResponse);

      localStorageDB.paymentData.set({
        qrcode_image: paymentResponse.qrcode_image,
        qrcode: paymentResponse.qrcode,
        qrcode_id: paymentResponse.qrcode_id,
        amount
      });

      const currentStepIndex = localStorageDB.funnelState.get();
      console.log('Step antes de avançar:', currentStepIndex);
      localStorageDB.funnelState.set(currentStepIndex + 1);
      console.log('Step depois de avançar:', currentStepIndex + 1);

      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Mostrando PIX...');
      onShowPixPayment(paymentResponse.qrcode_image, paymentResponse.qrcode);

      console.log('Chamando processFunnel em 500ms...');
      setTimeout(() => {
        processingRef.current = false;
        processFunnel();
      }, 500);
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
    }
  };

  useEffect(() => {
    processFunnel();
  }, []);

  return { onLeadReply, onPaymentAmountSelected };
}
