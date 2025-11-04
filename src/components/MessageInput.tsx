import { useState, useRef, useEffect } from 'react';
import { Paperclip, Send } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { chatConfig } from '../config';

interface MessageInputProps {
  onSendMessage: (content: string, type: 'text') => void;
  onSendAudio: (audioBlob: Blob, duration: number) => void;
  onSendImage: (imageUrl: string) => void;
}

export default function MessageInput({ onSendMessage, onSendAudio, onSendImage }: MessageInputProps) {
  const [message, setMessage] = useState('Oii meu amor, quero conhecer seus conteudo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.selectionEnd = cursorPosition;
    }
  }, [cursorPosition]);

  const handleEmojiClick = (emojiData: any) => {
    const { emoji } = emojiData;
    if (textareaRef.current) {
      textareaRef.current.focus();
      const start = message.substring(0, textareaRef.current.selectionStart);
      const end = message.substring(textareaRef.current.selectionStart);
      const newText = start + emoji + end;
      setMessage(newText);
      setCursorPosition(start.length + emoji.length);
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message, 'text');
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSendAudio(audioBlob, recordingTime);
        stream.getTracks().forEach(track => track.stop());
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSendImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="px-1 py-3"
      style={{
        backgroundImage: `url("${chatConfig.chatBackground}")`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center'
      }}
    >
      {isRecording ? (
        <div className="bg-white rounded-full px-4 py-3 flex items-center gap-3 shadow-sm">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600 flex-1">{formatRecordingTime(recordingTime)}</span>
          <button
            onClick={stopRecording}
            className="bg-[#008069] text-white rounded-full p-2 hover:bg-[#017561] transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-1">
          <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center gap-2 shadow-sm relative">
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="none"><path d="M8.49893 10.2521C9.32736 10.2521 9.99893 9.5805 9.99893 8.75208C9.99893 7.92365 9.32736 7.25208 8.49893 7.25208C7.6705 7.25208 6.99893 7.92365 6.99893 8.75208C6.99893 9.5805 7.6705 10.2521 8.49893 10.2521Z" fill="currentColor"></path><path d="M17.0011 8.75208C17.0011 9.5805 16.3295 10.2521 15.5011 10.2521C14.6726 10.2521 14.0011 9.5805 14.0011 8.75208C14.0011 7.92365 14.6726 7.25208 15.5011 7.25208C16.3295 7.25208 17.0011 7.92365 17.0011 8.75208Z" fill="currentColor"></path><path fillRule="evenodd" clipRule="evenodd" d="M16.8221 19.9799C15.5379 21.2537 13.8087 21.9781 12 22H9.27273C5.25611 22 2 18.7439 2 14.7273V9.27273C2 5.25611 5.25611 2 9.27273 2H14.7273C18.7439 2 22 5.25611 22 9.27273V11.8141C22 13.7532 21.2256 15.612 19.8489 16.9776L16.8221 19.9799ZM14.7273 4H9.27273C6.36068 4 4 6.36068 4 9.27273V14.7273C4 17.6393 6.36068 20 9.27273 20H11.3331C11.722 19.8971 12.0081 19.5417 12.0058 19.1204L11.9935 16.8564C11.9933 16.8201 11.9935 16.784 11.9941 16.7479C11.0454 16.7473 10.159 16.514 9.33502 16.0479C8.51002 15.5812 7.84752 14.9479 7.34752 14.1479C7.24752 13.9479 7.25585 13.7479 7.37252 13.5479C7.48919 13.3479 7.66419 13.2479 7.89752 13.2479L13.5939 13.2479C14.4494 12.481 15.5811 12.016 16.8216 12.0208L19.0806 12.0296C19.5817 12.0315 19.9889 11.6259 19.9889 11.1248V9.07648H19.9964C19.8932 6.25535 17.5736 4 14.7273 4ZM14.0057 19.1095C14.0066 19.2605 13.9959 19.4089 13.9744 19.5537C14.5044 19.3124 14.9926 18.9776 15.4136 18.5599L18.4405 15.5576C18.8989 15.1029 19.2653 14.5726 19.5274 13.996C19.3793 14.0187 19.2275 14.0301 19.0729 14.0295L16.8138 14.0208C15.252 14.0147 13.985 15.2837 13.9935 16.8455L14.0057 19.1095Z" fill="currentColor"></path></svg>
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 z-50">
                  <EmojiPicker onEmojiClick={handleEmojiClick} theme="light" />
                </div>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <Paperclip size={24} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mensagem"
              rows={1}
              className="flex-1 bg-transparent outline-none text-[15px] px-2 resize-none max-h-[80px] overflow-y-auto leading-[20px] py-2"
              style={{
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            />
          </div>

          <button
            onClick={message.trim() ? handleSend : startRecording}
            className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-lg self-center ${
              message.trim()
                ? 'bg-[#008069] hover:bg-[#017561] text-white'
                : 'bg-[#25D366] hover:bg-[#20c95d] text-white'
            }`}
          >
            {message.trim() ? <Send size={24} /> : <img width="24" height="24" src="https://img.icons8.com/android/96/FFFFFF/microphone.png" alt="microphone"/>}
          </button>
        </div>
      )}
    </div>
  );
}
