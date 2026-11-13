type NetworkInfoProps = {
  network: { receivedBytesPerSecond: number; sentBytesPerSecond: number } | null;
  streamedBytesPerSecond: number | null;
};

export type { NetworkInfoProps };
