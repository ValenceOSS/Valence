type MailMessage = {
  from: { name: string; address: string };
  to: string;
  subject: string;
  text: string;
  html: string;
  messageId: string;
};

type MailTransport = {
  send: (message: MailMessage) => Promise<void>;
  close: () => void;
};

export type { MailMessage, MailTransport };
