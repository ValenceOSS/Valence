type AVolumeRowProps = {
  level: number;
  colour: string;
  quietColour: string;
  restColour: string;
  onTurning: (to: number) => void;
  onTurned: (to: number) => void;
};

export type { AVolumeRowProps };
