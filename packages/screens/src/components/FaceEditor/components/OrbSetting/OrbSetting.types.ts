import type { OrbParam } from '@ValenceUI/orbs/OrbVariant';

type OrbSettingProps = {
  param: OrbParam;
  value: number;
  onChange: (value: number) => void;
};

export type { OrbSettingProps };
