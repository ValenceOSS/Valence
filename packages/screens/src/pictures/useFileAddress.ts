import { useEffect, useState } from 'react';

/**
 * An address a chosen file can be drawn from before it is sent anywhere, let go of once the file is
 * no longer drawn.
 *
 * @param file - The file, or nothing.
 * @returns Its address, or nothing until there is one.
 */
const useFileAddress = (file: File | null): string | null => {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (file === null) {
      setAddress(null);

      return;
    }

    const made = URL.createObjectURL(file);

    setAddress(made);

    return () => {
      URL.revokeObjectURL(made);
    };
  }, [file]);

  return address;
};

export { useFileAddress };
