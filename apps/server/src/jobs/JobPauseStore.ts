type JobPauses = { isEverythingPaused: boolean; jobIds: string[] };

type JobPauseStore = {
  read: () => Promise<JobPauses>;
  write: (pauses: JobPauses) => Promise<void>;
};

export type { JobPauses, JobPauseStore };
