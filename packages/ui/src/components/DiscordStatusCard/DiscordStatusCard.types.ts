type DiscordStatusTime =
  | { kind: 'progress'; elapsed: string; total: string; fraction: number }
  | { kind: 'elapsed'; elapsed: string };

type DiscordStatusCardProps = {
  heading: string;
  details: string;
  state?: string;
  largeImage: string;
  largeImageLabel: string;
  smallImage?: string;
  smallImageLabel?: string;
  time?: DiscordStatusTime;
  buttons?: readonly string[];
  className?: string;
};

export type { DiscordStatusCardProps, DiscordStatusTime };
