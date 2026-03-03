// types/accounting.ts
export interface JournalEntry {
  id: string;
  date: Date;
  accountNumber: string;
  accountLabel: string;
  description: string;
  debit: number;
  credit: number;
  reference: string;
  validated: boolean;
}

export interface Account {
  number: string;
  label: string;
  category: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  subCategory?: string;
  balance: number;
}

export interface BalanceSheet {
  assets: {
    immobilized: number;
    current: number;
    cash: number;
    total: number;
  };
  liabilities: {
    equity: number;
    provisions: number;
    debts: number;
    total: number;
  };
}

export interface Donor {
  id: string;
  date: Date;
  name: string;
  type: 'individual' | 'organization';
  amount: number;
  description: string;
  paymentMethod: 'cash' | 'check' | 'transfer' | 'kind';
  contact: string;
}

export type AccountingEntryDTO = {
  businessLabel?: string;
  description?: string;
  sync?: {
    sourceType?: string | null;
    identifier?: string | null;
  };
  sourceType?: string | null;
  sourceId?: string | null;
};