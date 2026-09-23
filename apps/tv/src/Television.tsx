import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { buildQueryClient } from '@ValenceClient/query/queryClient';
import { TheWayIn } from '@ValenceTv/screens/TheWayIn/TheWayIn';

/**
 * Valence on a television: the whole application, from choosing a server to watching something.
 *
 * The answers the server gives live in the same cache the web keeps them in, built the same way, so a
 * query that means something on a laptop means the same thing here.
 */
const Television = () => {
  const [answers] = useState(buildQueryClient);

  return (
    <QueryClientProvider client={answers}>
      <TheWayIn />
    </QueryClientProvider>
  );
};

Television.displayName = 'Television';

export { Television };
