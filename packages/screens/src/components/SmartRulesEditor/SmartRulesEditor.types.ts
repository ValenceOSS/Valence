import type { SmartDraft } from '@ValenceClient/smart/SmartDraft';

type SmartRulesEditorProps = {
  of: 'songs' | 'titles';
  draft: SmartDraft;
  onChange: (draft: SmartDraft) => void;
  isChecked: boolean;
};

export type { SmartRulesEditorProps };
