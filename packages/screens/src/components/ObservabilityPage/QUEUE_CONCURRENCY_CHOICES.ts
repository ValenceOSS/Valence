import { say } from '@ValenceI18n/say';

const MOST_TO_OFFER = 16;

const QUEUE_CONCURRENCY_CHOICES = Array.from({ length: MOST_TO_OFFER }, (_, index) => {
  const count = (index + 1).toString();

  return {
    id: count,
    label: `${count}${say('screens.observabilityPage.queueConcurrency.atATime')}`,
  };
});

export { QUEUE_CONCURRENCY_CHOICES };
