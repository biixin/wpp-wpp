export interface Message {
  id: string;
  content: string | null;
  type: 'text' | 'image' | 'audio';
  media_url: string | null;
  audio_duration: number | null;
  is_from_lead: boolean;
  read: boolean;
  read_status: 'sending' | 'sent' | 'delivered' | 'read';
  created_at: string;
}

export interface FunnelStep {
  action_type: 'send_message' | 'wait_for_reply';
  message_content?: string;
  message_type?: 'text' | 'image' | 'audio';
  media_url?: string;
  audio_duration?: number;
  typing_delay?: number;
}

const FUNNEL_STATE_KEY = 'whatsapp_funnel_state';

export const FUNNEL_STEPS: FunnelStep[] = [
  {
    action_type: 'wait_for_reply'
  },
  {
    action_type: 'send_message',
    message_content: 'Oii meu amor, tudo bemm?',
    message_type: 'text',
    typing_delay: 2000
  },
  {
    action_type: 'send_message',
    message_type: 'audio',
    media_url: 'https://console-typebot-minio.kjufc9.easypanel.host/api/v1/buckets/hot-mj/objects/download?preview=true&prefix=som-test.mp3&version_id=null',
    audio_duration: 5,
    typing_delay: 3000
  },
  {
    action_type: 'wait_for_reply'
  },
  {
    action_type: 'send_message',
    message_content: 'Legal! Me conta mais...',
    message_type: 'text',
    typing_delay: 2000
  },
  {
    action_type: 'wait_for_reply'
  }
];

export const localStorageDB = {
  funnelState: {
    get: (): number => {
      const data = localStorage.getItem(FUNNEL_STATE_KEY);
      return data ? parseInt(data, 10) : 0;
    },

    set: (step: number): void => {
      localStorage.setItem(FUNNEL_STATE_KEY, step.toString());
    },

    reset: (): void => {
      localStorage.setItem(FUNNEL_STATE_KEY, '0');
    }
  }
};
