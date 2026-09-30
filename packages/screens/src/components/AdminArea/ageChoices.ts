import { say } from '@ValenceI18n/say';

const AGE_CHOICES = [
  {
    id: 'none',
    label: say('common.noCeiling'),
    detail: say('screens.adminArea.ageChoices.anythingInThisLibrary'),
  },
  {
    id: '0',
    label: say('common.suitableForAll'),
    detail: say('screens.adminArea.ageChoices.uAndGOnly'),
  },
  {
    id: '8',
    label: say('screens.adminArea.ageChoices.upTo8'),
    detail: say('screens.adminArea.ageChoices.pGAndBelow'),
  },
  {
    id: '12',
    label: say('screens.adminArea.ageChoices.upTo12'),
    detail: say('screens.adminArea.ageChoices.n1212AAndBelow'),
  },
  {
    id: '15',
    label: say('screens.adminArea.ageChoices.upTo15'),
    detail: say('screens.adminArea.ageChoices.n15AndBelow'),
  },
  {
    id: '18',
    label: say('screens.adminArea.ageChoices.upTo18'),
    detail: say('screens.adminArea.ageChoices.everythingCertificated'),
  },
];

export { AGE_CHOICES };
