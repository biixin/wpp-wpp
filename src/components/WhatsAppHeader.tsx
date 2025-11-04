import { ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { chatConfig } from '../config';

interface WhatsAppHeaderProps {
  onPhoneClick?: () => void;
  onVideoClick?: () => void;
}

export default function WhatsAppHeader({ onPhoneClick, onVideoClick }: WhatsAppHeaderProps) {
  return (
    <div className="bg-white text-gray-800 px-4 py-3 flex items-center justify-between shadow-sm" style={{ height: '60px' }}>
      <div className="flex items-center gap-3">
        <button className="hover:bg-gray-100 p-2 rounded-full -ml-2">
          <ArrowLeft size={24} />
        </button>
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
          <img
            src={chatConfig.attendantAvatar}
            alt={chatConfig.attendantName}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="font-medium text-[15px]">{chatConfig.attendantName}</div>
          <div className="text-xs text-gray-600">online</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onVideoClick}
          className="hover:bg-gray-100 p-2 rounded-full text-gray-700"
        >
          <Video size={22} />
        </button>
        <button
          onClick={onPhoneClick}
          className="hover:bg-gray-100 p-2 rounded-full text-gray-700"
        >
          <Phone size={22} />
        </button>
        <button className="hover:bg-gray-100 p-2 rounded-full text-gray-700">
          <MoreVertical size={22} />
        </button>
      </div>
    </div>
  );
}
