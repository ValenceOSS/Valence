type IsoPhoneScreen = {
  src: string;
  alt: string;
};

type IsoPhoneProps = {
  screens: readonly IsoPhoneScreen[];
  active: number;
  className?: string;
};

export type { IsoPhoneProps, IsoPhoneScreen };
