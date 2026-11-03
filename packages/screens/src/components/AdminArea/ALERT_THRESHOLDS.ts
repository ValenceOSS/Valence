const ALERT_THRESHOLDS = {
  memoryShare: 0.92,
  diskShare: 0.95,
  cpuPercent: 90,
  encoderPercent: 90,
  readings: 15,
} as const;

export { ALERT_THRESHOLDS };
