type EmailContent = {
  subject: string;
  heading: string;
  paragraphs: readonly string[];
  action: { label: string; url: string } | null;
  afterAction: readonly string[];
};

type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

export type { EmailContent, RenderedEmail };
