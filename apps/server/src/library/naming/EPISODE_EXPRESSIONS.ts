import type { EpisodeExpression } from './EpisodeExpression.types';

const PLAIN = {
  isNamed: false,
  isOptimistic: false,
  isByDate: false,
  supportsAbsoluteNumbers: true,
} as const;

const EPISODE_EXPRESSIONS: readonly EpisodeExpression[] = [
  {
    ...PLAIN,
    isNamed: true,
    pattern:
      /.*(\\|\/)(?<seriesname>((?![Ss]([0-9]+)[\][ ._-]*[Ee]([0-9]+))[^\\/])*)?[Ss](?<seasonnumber>[0-9]+)[\][ ._-]*[Ee](?<epnumber>[0-9]+)([^\\/]*)$/diu,
  },
  { ...PLAIN, pattern: /[._ -]()[Ee][Pp]_?([0-9]+)([^\\/]*)$/diu },
  { ...PLAIN, pattern: /[^\\/]*?()\.?[Ee]([0-9]+)\.([^\\/]*)$/diu },
  {
    ...PLAIN,
    isByDate: true,
    pattern: /(?<year>[0-9]{4})[._ -](?<month>[0-9]{2})[._ -](?<day>[0-9]{2})/diu,
  },
  {
    ...PLAIN,
    isByDate: true,
    pattern: /(?<day>[0-9]{2})[._ -](?<month>[0-9]{2})[._ -](?<year>[0-9]{4})/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    pattern:
      /.*[\\/]((?<seriesname>[^\\/]+?)\s)?[Ss](?:eason)?\s*(?<seasonnumber>[0-9]+)\s+[Ee](?:pisode)?\s*(?<epnumber>[0-9]+).*$/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    pattern:
      /.*[\\/](?![Ee]pisode)(?![^\\/]*[Ss][0-9]+[\][ ._-]*[Ee][0-9]+)(?<seriesname>[\p{L}\p{M}\p{Nd}\p{Pc}\s]+?)\s(?<epnumber>[0-9]{1,4})(-(?<endingepnumber>[0-9]{2,4}))*[^\\/x]*$/diu,
  },
  {
    ...PLAIN,
    pattern: /[\\/._ [(-]([0-9]+)x([0-9]+(?:(?:[a-i]|\.[1-9])(?![0-9]))?)([^\\/]*)$/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    pattern:
      /.*[\\/]?.*?(\[.*?\])+.*?(?<seriesname>[-\p{L}\p{M}\p{Nd}\p{Pc}\s]+?)[\s_]*-[\s_]*(?<epnumber>[0-9]+).*$/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    pattern:
      /.*[\\/](?<seriesname>[^\\/]+?)[\s_]+-[\s_]+(?<epnumber>[0-9]+)[\s_]*(?:\[.*?\]|\(.*?\))*[\s_]*(?:\.[\p{L}\p{M}\p{Nd}\p{Pc}]+)?$/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    isOptimistic: true,
    supportsAbsoluteNumbers: false,
    pattern:
      /[\\/._ -](?<seriesname>(?![0-9]+[0-9][0-9])([^\\/_])*)[\\/._ -](?<seasonnumber>[0-9]+)(?<epnumber>[0-9][0-9](?:(?:[a-i]|\.[1-9])(?![0-9]))?)([._ -][^\\/]*)$/diu,
  },
  { ...PLAIN, pattern: /[/._ -]p(?:ar)?t[_. -]()([ivx]+|[0-9]+)([._ -][^/]*)$/diu },
  {
    ...PLAIN,
    isNamed: true,
    pattern: /[Ee]pisode (?<epnumber>[0-9]+)(-(?<endingepnumber>[0-9]+))?[^\\/]*$/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    pattern: /.*(\\|\/)[sS]?(?<seasonnumber>[0-9]+)[xX](?<epnumber>[0-9]+)[^\\/]*$/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    pattern: /.*(\\|\/)[sS](?<seasonnumber>[0-9]+)[x,X]?[eE](?<epnumber>[0-9]+)[^\\/]*$/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    pattern:
      /.*(\\|\/)(?<seriesname>((?![sS]?[0-9]{1,4}[xX][0-9]{1,3})[^\\/])*)?([sS]?(?<seasonnumber>[0-9]{1,4})[xX](?<epnumber>[0-9]+))[^\\/]*$/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    pattern:
      /.*(\\|\/)(?<seriesname>[^\\/]*)[sS](?<seasonnumber>[0-9]{1,4})[xX.]?[eE](?<epnumber>[0-9]+)[^\\/]*$/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    isOptimistic: true,
    pattern:
      /.*[\\/](?<epnumber>[0-9]+)(-(?<endingepnumber>[0-9]+))*\.[\p{L}\p{M}\p{Nd}\p{Pc}]+$/diu,
  },
  { ...PLAIN, pattern: /([0-9]+)-([0-9]+)/diu },
  {
    ...PLAIN,
    isNamed: true,
    isOptimistic: true,
    pattern: /.*(\\|\/)(?<epnumber>[0-9]{1,3})(-(?<endingepnumber>[0-9]{2,3}))*\s?-\s?[^\\/]*$/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    isOptimistic: true,
    pattern: /.*(\\|\/)(?<epnumber>[0-9]{1,3})(-(?<endingepnumber>[0-9]{2,3}))*\.[^\\/]+$/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    isOptimistic: true,
    pattern: /.*[\\/][^\\/]* - (?<epnumber>[0-9]{1,3})(-(?<endingepnumber>[0-9]{2,3}))*[^\\/]*$/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    isOptimistic: true,
    pattern: /[Ss]eason[._ ](?<seasonnumber>[0-9]+)[\\/](?<epnumber>[0-9]{1,3})([^\\/]*)$/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    pattern: /(.*(\\|\/))*(?<seriesname>.+)\/[Ss](eason)?[. _-]*(?<seasonnumber>[0-9]+)/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    pattern: /(.*(\\|\/))*(?<seriesname>.+)[. _-]+[sS](eason)?[. _-]*(?<seasonnumber>[0-9]+)/diu,
  },
  {
    ...PLAIN,
    isNamed: true,
    pattern: /(?:\[(?:[^\]]+)\]\s*)?(?<seriesname>\[[^\]]+\]|[^[\]]+)\s*\[(?<epnumber>[0-9]+)\]/diu,
  },
];

export { EPISODE_EXPRESSIONS };
