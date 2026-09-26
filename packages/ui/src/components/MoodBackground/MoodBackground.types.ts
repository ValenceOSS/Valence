type MoodLight = {
  color: string;
  at?: string;
  weight?: number;
};

type MoodBackgroundProps = {
  isDrifting?: boolean;
  isLively?: boolean;
  lights?: MoodLight[];
};

export type { MoodBackgroundProps, MoodLight };
