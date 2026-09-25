type AirPlayButtonProps = {
  isOverPicture?: boolean;
};

type NativeAirPlayProps = {
  colour: string;
  activeColour: string;
  style: { height: number; width: number };
  accessibilityLabel: string;
};

export type { AirPlayButtonProps, NativeAirPlayProps };
