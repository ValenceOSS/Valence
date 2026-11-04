import { useState } from 'react';
import { CERTIFICATE_AGES } from '@ValenceCore/constants/CERTIFICATE_AGES';
import { ChevronRight as ChevronRightIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { SelectField } from '@ValenceUI/SelectField';
import { TextField } from '@ValenceUI/TextField';
import { regionName } from '@ValenceScreens/live/regionName';
import { describeRatingAge } from './describeRatingAge';
import type { ContentRatingFieldProps } from './ContentRatingField.types';
import { say } from '@ValenceI18n/say';

const COUNTRY_CODE = /^[a-z]{2}$/iu;

/**
 * Leaves out the countries given no rating, so an empty field is a rating taken away.
 *
 * @param ratings - The ratings by country.
 * @returns Those that say something.
 */
const keptOf = (ratings: Readonly<Record<string, string>>): Record<string, string> =>
  Object.fromEntries(Object.entries(ratings).filter(([, rating]) => rating.trim() !== ''));

/**
 * A title's content ratings: the server's own country first, picked from the ratings it knows with
 * the age each is for, since that one decides what a child's profile may see, then every other
 * country's as written, folded away behind how many there are so a title rated in forty countries
 * takes no more room than one rated in two, and a way to add another country.
 *
 * @param ratings - The ratings by country.
 * @param region - The server's own country, whose rating decides ages.
 * @param onRatingsChange - Told the ratings as they now stand.
 */
const ContentRatingField = ({ ratings, region, onRatingsChange }: ContentRatingFieldProps) => {
  const [added, setAdded] = useState<readonly string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const known = CERTIFICATE_AGES[region];
  const own = ratings[region] ?? '';
  const others = [
    ...new Set([...Object.keys(ratings), ...added].filter((country) => country !== region)),
  ].sort();
  const code = typed.trim().toUpperCase();
  const canAdd = COUNTRY_CODE.test(code) && code !== region && !others.includes(code);

  /**
   * Sets one country's rating.
   *
   * @param country - The country.
   * @param rating - Its rating, or nothing to take it away.
   */
  const rate = (country: string, rating: string) => {
    onRatingsChange(keptOf({ ...ratings, [country]: rating }));
  };

  const ownAge = own === '' ? null : describeRatingAge(region, own);

  return (
    <div className="flex flex-col gap-4">
      {known === undefined ? (
        <TextField
          label={regionName(region)}
          value={own}
          {...(ownAge === null ? {} : { description: ownAge, descriptionPlacement: 'below' })}
          onValueChange={(next) => {
            rate(region, next);
          }}
          className="sm:max-w-xs"
        />
      ) : (
        <SelectField
          label={regionName(region)}
          value={own}
          options={[
            { id: '', label: say('screens.adminArea.contentRatingField.noRating') },
            ...Object.keys(known).flatMap((rating) => {
              const age = describeRatingAge(region, rating);

              return age === null ? [] : [{ id: rating, label: rating, detail: age }];
            }),
            ...(own !== '' && !Object.hasOwn(known, own) ? [{ id: own, label: own }] : []),
          ]}
          onSelect={(rating) => {
            rate(region, rating);
          }}
          className="sm:max-w-xs"
        />
      )}

      <div className="flex flex-col gap-3 border-t border-[var(--surface-line)] pt-3">
        <Button
          variant="bare"
          size="none"
          aria-expanded={isOpen}
          className="flex items-center gap-2 self-start text-sm text-text"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        >
          <Icon
            of={ChevronRightIcon}
            size={14}
            className={cn(
              'transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)] motion-reduce:transition-none',
              isOpen ? 'rotate-90' : '',
            )}
          />
          {say('screens.adminArea.contentRatingField.otherCountries')}
          <Badge size="sm">{others.length.toLocaleString()}</Badge>
        </Button>

        {isOpen ? (
          <>
            {others.length === 0 ? null : (
              <div className="grid grid-cols-2 gap-3">
                {others.map((country) => (
                  <TextField
                    key={country}
                    label={regionName(country)}
                    value={ratings[country] ?? ''}
                    onValueChange={(next) => {
                      rate(country, next);
                    }}
                  />
                ))}
              </div>
            )}

            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();

                if (canAdd) {
                  setAdded([...added, code]);
                  setTyped('');
                }
              }}
            >
              <TextField
                label={say('screens.adminArea.contentRatingField.countryCode')}
                isLabelHidden
                placeholder={say('screens.adminArea.contentRatingField.countryCode')}
                value={typed}
                onValueChange={setTyped}
                className="w-36"
              />
              <Button type="submit" variant="secondary" disabled={!canAdd}>
                {say('screens.adminArea.contentRatingField.addCountry')}
              </Button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
};

ContentRatingField.displayName = 'ContentRatingField';

export { ContentRatingField };
