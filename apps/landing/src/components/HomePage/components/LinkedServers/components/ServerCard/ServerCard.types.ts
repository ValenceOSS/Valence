type ServerTint = 'accent' | 'highlight';

type SharedLibrary = { name: string; isShared: boolean };

type ServerCardProps = {
  name: string;
  tint: ServerTint;
  fingerprint: string;
  libraries: readonly SharedLibrary[];
};

export type { ServerCardProps, ServerTint, SharedLibrary };
