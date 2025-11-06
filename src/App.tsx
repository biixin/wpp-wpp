import { useState, useEffect, useRef } from 'react';
import { Message } from './lib/localStorage';
import WhatsAppHeader from './components/WhatsAppHeader';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import MessageInput from './components/MessageInput';
import CallModal from './components/CallModal';
import PaymentButtons from './components/PaymentButtons';
import PixPayment from './components/PixPayment';
import { useFunnel } from './hooks/useFunnel';
import { chatConfig } from './config';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [typingStatus, setTypingStatus] = useState<'online' | 'digitando..' | 'gravando audio..'>('online');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addMessage = (content: string, type: 'text' | 'image' | 'audio' | 'payment_buttons' | 'pix_payment', mediaUrl?: string, audioDuration?: number, isFromLead: boolean = true, pixData?: { qrcodeImage: string; qrcode: string }) => {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      content,
      type,
      media_url: mediaUrl || null,
      audio_duration: audioDuration || null,
      is_from_lead: isFromLead,
      read: false,
      read_status: isFromLead ? 'sending' : 'delivered',
      created_at: new Date().toISOString(),
      pix_data: pixData
    };

    setMessages(prev => [...prev, newMessage]);

    if (isFromLead) {
      setTimeout(() => {
        setMessages(prev =>
          prev.map(msg => msg.id === newMessage.id ? { ...msg, read_status: 'sent' } : msg)
        );
      }, 100);

      setTimeout(() => {
        setMessages(prev =>
          prev.map(msg => msg.id === newMessage.id ? { ...msg, read_status: 'delivered' } : msg)
        );
      }, 3000);
    }
  };

  const handleBotMessage = (content: string, type: 'text' | 'image' | 'audio', mediaUrl?: string, audioDuration?: number) => {
    addMessage(content, type, mediaUrl, audioDuration, false);
  };

  const handleShowPaymentButtons = () => {
    addMessage('', 'payment_buttons', undefined, undefined, false);
  };

  const handleShowPixPayment = (qrcodeImage: string, qrcode: string) => {
    addMessage('', 'pix_payment', undefined, undefined, false, { qrcodeImage, qrcode });
  };

  const { onLeadReply, onPaymentAmountSelected } = useFunnel({
    onTypingStart: () => setIsTyping(true),
    onTypingEnd: () => setIsTyping(false),
    onSendMessage: handleBotMessage,
    onShowPaymentButtons: handleShowPaymentButtons,
    onShowPixPayment: handleShowPixPayment,
    onStatusChange: (status) => setTypingStatus(status)
  });

  const handleLeadMessage = (content: string, type: 'text') => {
    addMessage(content, type, undefined, undefined, true);
    onLeadReply();
  };

  const handleSendAudio = (audioBlob: Blob, duration: number) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        addMessage('', 'audio', e.target.result as string, duration, true);
        onLeadReply();
      }
    };
    reader.readAsDataURL(audioBlob);
  };

  const handleSendImage = (imageUrl: string) => {
    addMessage('', 'image', imageUrl, undefined, true);
    onLeadReply();
  };

  if (isCallActive) {
    return <CallModal onClose={() => setIsCallActive(false)} />;
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-white" style={{ width: '100vw', height: '100vh', maxHeight: '-webkit-fill-available' }}>
      <div className="flex-shrink-0">
        <WhatsAppHeader
          onPhoneClick={() => setIsCallActive(true)}
          onVideoClick={() => setIsCallActive(true)}
          status={typingStatus}
        />
      </div>

      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          backgroundImage: `url("${chatConfig.chatBackground}")`,
          backgroundSize: 'contain',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="px-4 py-4">
          {messages.map((message) => {
            if (message.type === 'payment_buttons') {
              return <PaymentButtons key={message.id} onSelectAmount={onPaymentAmountSelected} />;
            }
            if (message.type === 'pix_payment' && message.pix_data) {
              return (
                <PixPayment
                  key={message.id}
                  qrcodeImage={message.pix_data.qrcodeImage}
                  qrcode={message.pix_data.qrcode}
                />
              );
            }
            return <MessageBubble key={message.id} message={message} />;
          })}

          {isTyping && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex-shrink-0">
        <MessageInput
          onSendMessage={handleLeadMessage}
          onSendAudio={handleSendAudio}
          onSendImage={handleSendImage}
        />
      </div>
    </div>
  );
}

export default App;
