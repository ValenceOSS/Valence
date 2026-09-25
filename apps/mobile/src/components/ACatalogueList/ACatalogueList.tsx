import { useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { ACatalogueCard } from '@ValenceMobile/components/ACatalogueCard/ACatalogueCard';
import { APosterGrid } from '@ValenceMobile/components/APosterGrid/APosterGrid';
import { Words } from '@ValenceMobile/components/Words/Words';
import { whatAPhoneAsksFor } from '@ValenceMobile/components/TheSearch/whatAPhoneAsksFor';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { ACatalogueListProps } from './ACatalogueList.types';

/**
 * What a card is known by in the grid, since a film and a series can share a number.
 *
 * @param title - The card.
 * @returns Its key.
 */
const keyOfTitle = (title: CatalogueTitle): string => `${title.kind}:${title.id}`;

/**
 * The whole of one Discover list, as the web opens it from the end of its shelf: every title in a
 * grid to ask for, the next page read before the last is reached, so it scrolls without end.
 *
 * @param browsing - Which list, of which kind, and whose studio where one was chosen.
 * @param title - What the list is called.
 * @param onAsk - Told which title somebody wants to see.
 * @param onBack - Told they are done with it.
 */
const ACatalogueList = ({ browsing, title, onAsk, onBack }: ACatalogueListProps) => {
  const colours = useTheColours();
  const pages = useInfiniteQuery(requestsQueries.catalogueBrowse(browsing));
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = pages;
  const titles = useMemo(
    () =>
      (pages.data?.pages ?? [])
        .flatMap((page) => page.titles)
        .filter((one) => whatAPhoneAsksFor(one.kind)),
    [pages.data],
  );

  const readOn = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const drawn = useCallback(
    (one: CatalogueTitle, wide: number) => <ACatalogueCard title={one} onAsk={onAsk} wide={wide} />,
    [onAsk],
  );

  return (
    <APosterGrid
      header={
        <>
          <Words size="title">{title}</Words>
          {pages.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}
          {pages.isError ? <Words tone="danger">That could not be read.</Words> : null}
        </>
      }
      items={titles}
      keyOf={keyOfTitle}
      drawn={drawn}
      onNearTheEnd={readOn}
      footer={isFetchingNextPage ? <ActivityIndicator color={colours.textMuted} /> : null}
      onBack={onBack}
    />
  );
};

ACatalogueList.displayName = 'ACatalogueList';

export { ACatalogueList };
