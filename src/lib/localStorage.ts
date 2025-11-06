export interface Message {
  id: string;
  content: string | null;
  type: 'text' | 'image' | 'audio' | 'payment_buttons' | 'pix_payment';
  media_url: string | null;
  audio_duration: number | null;
  is_from_lead: boolean;
  read: boolean;
  read_status: 'sending' | 'sent' | 'delivered' | 'read';
  created_at: string;
  pix_data?: {
    qrcodeImage: string;
    qrcode: string;
  };
}

export interface FunnelStep {
  action_type: 'send_message' | 'wait_for_reply' | 'show_payment_buttons' | 'show_pix_payment' | 'wait_for_payment';
  message_content?: string;
  message_type?: 'text' | 'image' | 'audio';
  media_url?: string;
  audio_duration?: number;
  typing_delay?: number;
}

const FUNNEL_STATE_KEY = 'whatsapp_funnel_state';
const PAYMENT_DATA_KEY = 'whatsapp_payment_data';

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
  },
  {
    action_type: 'send_message',
    message_content: 'Dai é só vc escolher aqui quanto você vai querer me enviar fazer o pagamento que eu vou te enviar tudo por aqui',
    message_type: 'text',
    typing_delay: 2000
  },
  {
    action_type: 'show_payment_buttons'
  },
  {
    action_type: 'show_pix_payment'
  },
  {
    action_type: 'send_message',
    message_content: 'Esse código em cima aqui é o código copia e cola, vc pega e cola no seu banco pra poder fazer o pagamento',
    message_type: 'text',
    typing_delay: 1000
  },
  {
    action_type: 'send_message',
    message_content: 'Quando fizer o pagamento me fala aqui pra mim verificar!',
    message_type: 'text',
    typing_delay: 2000
  },
  {
    action_type: 'wait_for_payment'
  }
];

export interface PaymentData {
  qrcode_image: string;
  qrcode: string;
  qrcode_id: string;
  amount: number;
}

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
  },

  paymentData: {
    get: (): PaymentData | null => {
      const data = localStorage.getItem(PAYMENT_DATA_KEY);
      return data ? JSON.parse(data) : null;
    },

    set: (data: PaymentData): void => {
      localStorage.setItem(PAYMENT_DATA_KEY, JSON.stringify(data));
    },

    clear: (): void => {
      localStorage.removeItem(PAYMENT_DATA_KEY);
    }
  }
};
