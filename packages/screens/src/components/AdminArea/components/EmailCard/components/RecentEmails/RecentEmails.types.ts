import type { EmailSend } from '@ValenceContracts/schemas/EmailSend';

type RecentEmailsProps = {
  sends: readonly EmailSend[];
  now: number;
};

export type { RecentEmailsProps };
