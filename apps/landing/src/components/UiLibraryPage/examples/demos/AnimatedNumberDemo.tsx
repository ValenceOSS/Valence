import { useState } from 'react';
import { Minus, Plus } from '@keyline-icons/react';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';

/**
 * A count that rolls from one value to the next as it is stepped up and down.
 */
const AnimatedNumberDemo = () => {
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

      <AnimatedNumber value={count} suffix=" films" className="text-2xl font-semibold text-text" />

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

AnimatedNumberDemo.displayName = 'AnimatedNumberDemo';

export { AnimatedNumberDemo };
