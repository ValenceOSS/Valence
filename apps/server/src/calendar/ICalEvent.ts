type ICalEvent = {
  uid: string;
  date: string;
  summary: string;
  description: string | null;
  url: string | null;
};

export type { ICalEvent };
