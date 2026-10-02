type YourNotificationsProps = {
  onOpen: (wanted: { kind: 'film' | 'show'; mediaId: string }) => void;
  onFocus: () => void;
};

export type { YourNotificationsProps };
