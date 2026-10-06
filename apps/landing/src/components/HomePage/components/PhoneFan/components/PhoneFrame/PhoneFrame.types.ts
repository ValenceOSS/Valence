type PhoneFinish = 'silver' | 'orange' | 'blue';

type PhoneFrameProps = {
  label: string;
  src?: string;
  finish?: PhoneFinish;
  className?: string;
};

export type { PhoneFinish, PhoneFrameProps };
