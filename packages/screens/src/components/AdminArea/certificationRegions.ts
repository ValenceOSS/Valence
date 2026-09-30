import { say } from '@ValenceI18n/say';

const certificationRegions = [
  {
    id: 'GB',
    label: say('screens.adminArea.certificationRegions.unitedKingdom'),
    detail: say('screens.adminArea.certificationRegions.uPG121518'),
  },
  {
    id: 'US',
    label: say('screens.adminArea.certificationRegions.unitedStates'),
    detail: say('screens.adminArea.certificationRegions.gPGPG13RNC'),
  },
  {
    id: 'IE',
    label: say('screens.adminArea.certificationRegions.ireland'),
    detail: say('screens.adminArea.certificationRegions.gPG12A15A1618'),
  },
  {
    id: 'AU',
    label: say('screens.adminArea.certificationRegions.australia'),
    detail: say('screens.adminArea.certificationRegions.gPGMMA15R18'),
  },
  {
    id: 'DE',
    label: say('screens.adminArea.certificationRegions.germany'),
    detail: say('screens.adminArea.certificationRegions.fSK06121618'),
  },
  {
    id: 'FR',
    label: say('screens.adminArea.certificationRegions.france'),
    detail: '0, 12, 16, 18',
  },
  {
    id: 'NL',
    label: say('screens.adminArea.certificationRegions.netherlands'),
    detail: '0, 6, 9, 12, 14, 16, 18',
  },
  {
    id: 'ES',
    label: say('screens.adminArea.certificationRegions.spain'),
    detail: '0, 7, 12, 16, 18',
  },
];

export { certificationRegions };
