import type { ArrApp } from '@ValenceContracts/schemas/ArrApp';
import type { RecordStore } from '@ValenceRequests/stores/RecordStore';

type ArrAppRecord = Omit<ArrApp, 'hasApiKey'> & { apiKey: string };

type ArrAppStore = RecordStore<ArrAppRecord>;

export type { ArrAppRecord, ArrAppStore };
