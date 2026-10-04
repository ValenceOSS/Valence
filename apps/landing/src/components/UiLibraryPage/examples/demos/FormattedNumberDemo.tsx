import { useState } from 'react';
import { Minus, Plus } from '@keyline-icons/react';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';

/**
 * A count written in the reader's own format, stepped up and down.
 */
const FormattedNumberDemo = () => {
  const [count, setCount] = useState(128);

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="secondary"
        isIconOnly
        label="One fewer"
        onClick={() => {
          setCount((was) => was - 1);
        }}
      >
        <Icon of={Minus} size={16} />
      </Button>

      <FormattedNumber value={count} suffix=" films" className="text-2xl font-semibold text-text" />

      <Button
        variant="secondary"
        isIconOnly
        label="One more"
        onClick={() => {
          setCount((was) => was + 1);
        }}
      >
        <Icon of={Plus} size={16} />
      </Button>
    </div>
  );
};

FormattedNumberDemo.displayName = 'FormattedNumberDemo';

export { FormattedNumberDemo };
