export const calculateTotals = (entries, debitField = 'debit', creditField = 'credit') => {
  return entries.reduce(
    (acc, entry) => ({
      debit: acc.debit + (entry[debitField] || 0),
      credit: acc.credit + (entry[creditField] || 0)
    }),
    { debit: 0, credit: 0 }
  );
};

export const calculateBalance = (debit, credit) => debit - credit;

export const isBalanced = (debit, credit) => Math.abs(debit - credit) < 0.01;

export const calculateBilanTotal = (actif, passif) => ({
  totalActif: actif.reduce((sum, section) => 
    sum + section.items.reduce((s, item) => s + item.montant, 0), 0),
  totalPassif: passif.reduce((sum, section) => 
    sum + section.items.reduce((s, item) => s + item.montant, 0), 0)
});