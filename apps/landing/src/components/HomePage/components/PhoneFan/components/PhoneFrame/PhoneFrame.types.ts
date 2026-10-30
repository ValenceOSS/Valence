type PhoneFinish = 'silver' | 'orange' | 'blue';

type PhoneFrameProps = {
  label: string;
  src?: string;
  finish?: PhoneFinish;
  sizes?: string;
  className?: string;
};

export type { PhoneFinish, PhoneFrameProps };
