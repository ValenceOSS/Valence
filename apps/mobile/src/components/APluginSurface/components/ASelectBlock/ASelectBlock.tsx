import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Check, ChevronDown } from '@keyline-icons/react-native';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import type { ASelectBlockProps } from './ASelectBlock.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  choices: { gap: 8 },
  field: { gap: 8 },
});

/**
 * A choice on a plugin page between a few options: the one chosen shown as a button, which opens a
 * sheet of all of them.
 *
 * @param label - What is being chosen.
 * @param value - The option chosen now.
 * @param options - Every option, by value and what it says.
 * @param onChoose - Told which option was chosen.
 */
const ASelectBlock = ({ label, value, options, onChoose }: ASelectBlockProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const chosen = options.find((option) => option.value === value);

  return (
    <View style={styles.field}>
      <Words size="small" tone="muted">
        {label}
      </Words>

      <Button
        tone="ghost"
        icon={ChevronDown}
        isWide
        label={`${label}: ${chosen?.label ?? say('common.nothingChosen')}`}
        onPress={() => {
          setIsOpen(true);
        }}
      >
        {chosen?.label ?? say('common.choose')}
      </Button>

      <ASheet
        isOpen={isOpen}
        title={label}
        onClose={() => {
          setIsOpen(false);
        }}
      >
        <View style={styles.choices}>
          {options.map((option) => (
            <Button
              key={option.value}
              tone={option.value === value ? 'bold' : 'ghost'}
              isWide
              isChosen={option.value === value}
              {...(option.value === value ? { icon: Check } : {})}
              onPress={() => {
                onChoose(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </Button>
          ))}
        </View>
      </ASheet>
    </View>
  );
};

ASelectBlock.displayName = 'ASelectBlock';

export { ASelectBlock };
