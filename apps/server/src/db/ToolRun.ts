type ToolRun = {
  command: string;
  args: readonly string[];
  env?: Record<string, string>;
  file: string;
};

export type { ToolRun };
