import type { ReactNode } from 'react';

type ServerCallingCardProps = {
  name: string;
  colour: string;
  picture: string | null;
  address: string;
  fingerprint: string;
  standing?: ReactNode;
  children?: ReactNode;
};

export type { ServerCallingCardProps };
