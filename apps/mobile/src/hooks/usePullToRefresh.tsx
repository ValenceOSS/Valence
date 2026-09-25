import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshControl } from 'react-native';
import type { RefreshControlProps } from 'react-native';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ReactElement } from 'react';

/**
 * Pulling down on a screen asks again for everything it shows, and the only place that is drawn.
 *
 * @returns What to hand the screen's scroll view as its refresh control.
 */
const usePullToRefresh = (): ReactElement<RefreshControlProps> => {
  const cache = useQueryClient();
  const colours = useTheColours();
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <RefreshControl
      refreshing={isRefreshing}
      tintColor={colours.textMuted}
      onRefresh={() => {
        setIsRefreshing(true);
        void cache.refetchQueries({ type: 'active' }).finally(() => {
          setIsRefreshing(false);
        });
      }}
    />
  );
};

export { usePullToRefresh };
