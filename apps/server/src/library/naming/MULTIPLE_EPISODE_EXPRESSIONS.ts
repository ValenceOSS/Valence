import type { EpisodeExpression } from './EpisodeExpression.types';

const NAMED = {
  isNamed: true,
  isOptimistic: false,
  isByDate: false,
  supportsAbsoluteNumbers: true,
} as const;

const MULTIPLE_EPISODE_EXPRESSIONS: readonly EpisodeExpression[] = [
  /(?<=^|[\n\r\u2028\u2029]).*(\\|\/)[sS]?(?<seasonnumber>[0-9]{1,4})[xX](?<epnumber>[0-9]{1,3})((-| - )[0-9]{1,4}[eExX](?<endingepnumber>[0-9]{1,3}))+[^\\/]*$/diu,
  /(?<=^|[\n\r\u2028\u2029]).*(\\|\/)[sS]?(?<seasonnumber>[0-9]{1,4})[xX](?<epnumber>[0-9]{1,3})((-| - )[0-9]{1,4}[xX][eE](?<endingepnumber>[0-9]{1,3}))+[^\\/]*$/diu,
  /(?<=^|[\n\r\u2028\u2029]).*(\\|\/)[sS]?(?<seasonnumber>[0-9]{1,4})[xX](?<epnumber>[0-9]{1,3})((-| - )?[xXeE](?<endingepnumber>[0-9]{1,3}))+[^\\/]*$/diu,
  /(?<=^|[\n\r\u2028\u2029]).*(\\|\/)[sS]?(?<seasonnumber>[0-9]{1,4})[xX](?<epnumber>[0-9]{1,3})(-[xE]?[eE]?(?<endingepnumber>[0-9]{1,3}))+[^\\/]*$/diu,
  /(?<=^|[\n\r\u2028\u2029]).*(\\|\/)(?<seriesname>((?![sS]?[0-9]{1,4}[xX][0-9]{1,3})[^\\/])*)?([sS]?(?<seasonnumber>[0-9]{1,4})[xX](?<epnumber>[0-9]{1,3}))((-| - )[0-9]{1,4}[xXeE](?<endingepnumber>[0-9]{1,3}))+[^\\/]*$/diu,
  /(?<=^|[\n\r\u2028\u2029]).*(\\|\/)(?<seriesname>((?![sS]?[0-9]{1,4}[xX][0-9]{1,3})[^\\/])*)?([sS]?(?<seasonnumber>[0-9]{1,4})[xX](?<epnumber>[0-9]{1,3}))((-| - )[0-9]{1,4}[xX][eE](?<endingepnumber>[0-9]{1,3}))+[^\\/]*$/diu,
  /(?<=^|[\n\r\u2028\u2029]).*(\\|\/)(?<seriesname>((?![sS]?[0-9]{1,4}[xX][0-9]{1,3})[^\\/])*)?([sS]?(?<seasonnumber>[0-9]{1,4})[xX](?<epnumber>[0-9]{1,3}))((-| - )?[xXeE](?<endingepnumber>[0-9]{1,3}))+[^\\/]*$/diu,
  /(?<=^|[\n\r\u2028\u2029]).*(\\|\/)(?<seriesname>((?![sS]?[0-9]{1,4}[xX][0-9]{1,3})[^\\/])*)?([sS]?(?<seasonnumber>[0-9]{1,4})[xX](?<epnumber>[0-9]{1,3}))(-[xX]?[eE]?(?<endingepnumber>[0-9]{1,3}))+[^\\/]*$/diu,
  /(?<=^|[\n\r\u2028\u2029]).*(\\|\/)(?<seriesname>[^\\/]*)[sS](?<seasonnumber>[0-9]{1,4})[xX.]?[eE](?<epnumber>[0-9]{1,3})((-| - )?[xXeE](?<endingepnumber>[0-9]{1,3}))+[^\\/]*$/diu,
  /(?<=^|[\n\r\u2028\u2029]).*(\\|\/)(?<seriesname>[^\\/]*)[sS](?<seasonnumber>[0-9]{1,4})[xX.]?[eE](?<epnumber>[0-9]{1,3})(-[xX]?[eE]?(?<endingepnumber>[0-9]{1,3}))+[^\\/]*$/diu,
].map((pattern) => ({ ...NAMED, pattern }));

export { MULTIPLE_EPISODE_EXPRESSIONS };
