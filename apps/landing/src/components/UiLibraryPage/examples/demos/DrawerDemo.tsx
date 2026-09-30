import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Drawer } from '@ValenceUI/Drawer';

/**
 * A button that slides a real drawer in from the edge, with something to read and a way to close it.
 */
const DrawerDemo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        Open the drawer
      </Button>

      <Drawer
        label="Up next"
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      >
        <div className="flex flex-col gap-3 p-5">
          <p className="text-base font-semibold text-text">Up next</p>
          <p className="text-sm text-text-muted">A drawer holds what sits beside the page.</p>
          <Button
            variant="secondary"
            onClick={() => {
              setIsOpen(false);
            }}
          >
            Close
          </Button>
        </div>
      </Drawer>
    </>
  );
};

DrawerDemo.displayName = 'DrawerDemo';

export { DrawerDemo };
