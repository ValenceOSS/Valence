type ConfigProbe<Config> = (config: Config) => Promise<boolean>;

type EnginesBrowser = {
  isSecureContext: boolean;
  hasGpu: () => Promise<boolean>;
  canDecodeVideo: ConfigProbe<{ codec: string; codedWidth: number; codedHeight: number }> | null;
  canDecodeAudio: ConfigProbe<{
    codec: string;
    sampleRate: number;
    numberOfChannels: number;
  }> | null;
  canEncodeAudio: ConfigProbe<{
    codec: string;
    sampleRate: number;
    numberOfChannels: number;
    bitrate: number;
  }> | null;
  canStream: ((mimeType: string) => boolean) | null;
  canToneMap: ((codec: string) => Promise<boolean>) | null;
  hasDecoders: () => Promise<boolean>;
};

export type { EnginesBrowser };
