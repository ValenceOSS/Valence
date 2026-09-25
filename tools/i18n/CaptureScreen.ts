type CaptureScreen = {
  client: 'web' | 'desktop' | 'phone' | 'tv' | 'server';
  route: string;
  reach: string;
  press?: readonly string[];
};

export type { CaptureScreen };
