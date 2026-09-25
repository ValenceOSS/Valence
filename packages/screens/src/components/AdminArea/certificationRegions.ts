import type { StringKey } from '@ValenceI18n/StringKey';

const certificationRegions: readonly { id: string; labelKey: StringKey; detailKey: StringKey }[] = [
  {
    id: 'GB',
    labelKey: 'admin.certificationRegions.gb',
    detailKey: 'admin.certificationRegions.gbRatings',
  },
  {
    id: 'US',
    labelKey: 'admin.certificationRegions.us',
    detailKey: 'admin.certificationRegions.usRatings',
  },
  {
    id: 'IE',
    labelKey: 'admin.certificationRegions.ie',
    detailKey: 'admin.certificationRegions.ieRatings',
  },
  {
    id: 'AU',
    labelKey: 'admin.certificationRegions.au',
    detailKey: 'admin.certificationRegions.auRatings',
  },
  {
    id: 'DE',
    labelKey: 'admin.certificationRegions.de',
    detailKey: 'admin.certificationRegions.deRatings',
  },
  {
    id: 'FR',
    labelKey: 'admin.certificationRegions.fr',
    detailKey: 'admin.certificationRegions.frRatings',
  },
  {
    id: 'NL',
    labelKey: 'admin.certificationRegions.nl',
    detailKey: 'admin.certificationRegions.nlRatings',
  },
  {
    id: 'ES',
    labelKey: 'admin.certificationRegions.es',
    detailKey: 'admin.certificationRegions.esRatings',
  },
];

export { certificationRegions };
