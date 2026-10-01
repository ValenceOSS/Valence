import {
  blocklistedRelease,
  downloadClient,
  indexer,
  indexerDefinition,
  mediaRequest,
  qualityProfile,
  requestItem,
  requestLog,
  sentDownload,
  serviceEvent,
  setting,
} from '@ValenceRequests/db/postgres/Schema';

const REQUESTS_SCHEMA = {
  blocklistedRelease,
  downloadClient,
  indexer,
  indexerDefinition,
  mediaRequest,
  qualityProfile,
  requestItem,
  requestLog,
  sentDownload,
  serviceEvent,
  setting,
};

export { REQUESTS_SCHEMA };
