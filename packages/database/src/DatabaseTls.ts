type DatabaseTls = {
  mode: 'off' | 'require' | 'verify-full';
  ca: string | null;
};

export type { DatabaseTls };
