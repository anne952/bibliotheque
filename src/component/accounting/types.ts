import type { IconType } from 'react-icons';

export type AccountingModuleId =
  | 'journal'
  | 'caisse'
  | 'donateurs'
  | 'bilan'
  | 'resultat'
  | 'balance'
  | 'grandlivre';

export interface AccountingModule {
  id: AccountingModuleId;
  title: string;
  icon: IconType;
}

export interface AccountingPeriod {
  id: number;
  label: string;
  value: string;
}
