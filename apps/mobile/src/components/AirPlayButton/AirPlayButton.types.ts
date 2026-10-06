type AirPlayButtonProps = {
  isOverPicture?: boolean;
  fills?: { height: number; width: number };
};

type NativeAirPlayProps = {
  colour: string;
  activeColour: string;
  style: { height: number; width: number };
  accessibilityLabel: string;
};

export type { AirPlayButtonProps, NativeAirPlayProps };
