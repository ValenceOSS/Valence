type NativeNotificationService = {
  shareSignIn: (address: string, cookie: string) => boolean;
  forgetSignIn: () => void;
};

export type { NativeNotificationService };
