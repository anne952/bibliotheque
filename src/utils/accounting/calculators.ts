/**
 * Calcule les totaux débit/crédit d'un tableau d'écritures
 * @param {Array} entries - Tableau d'écritures
 * @param {string} debitField - Nom du champ débit
 * @param {string} creditField - Nom du champ crédit
 * @returns {Object}
 */
export const calculateTotals = (entries, debitField = 'debit', creditField = 'credit') => {
  return entries.reduce(
    (acc, entry) => ({
      debit: acc.debit + (entry[debitField] || 0),
      credit: acc.credit + (entry[creditField] || 0)
    }),
    { debit: 0, credit: 0 }
  );
};

/**
 * Calcule la balance (différence débit - crédit)
 * @param {number} debit - Total débit
 * @param {number} credit - Total crédit
 * @returns {number}
 */
export const calculateBalance = (debit, credit) => {
  return debit - credit;
};

/**
 * Vérifie si une balance est équilibrée
 * @param {number} debit - Total débit
 * @param {number} credit - Total crédit
 * @returns {boolean}
 */
export const isBalanced = (debit, credit) => {
  return Math.abs(debit - credit) < 0.01;
};

/**
 * Calcule le total d'une section de bilan
 * @param {Array} items - Tableau d'éléments
 * @returns {number}
 */
export const calculateBilanTotal = (items) => {
  if (!Array.isArray(items)) {
    return Object.values(items).reduce((sum, section) => {
      return sum + (Array.isArray(section) 
        ? section.reduce((s, item) => s + (item.montant || 0), 0)
        : 0);
    }, 0);
  }
  return items.reduce((sum, item) => sum + (item.montant || 0), 0);
};

/**
 * Calcule le solde cumulé d'une série d'opérations
 * @param {Array} operations - Opérations avec débit/crédit
 * @returns {Array}
 */
export const calculateCumulativeBalance = (operations) => {
  let solde = 0;
  return operations.map(op => {
    solde += (op.debit || 0) - (op.credit || 0);
    return { ...op, solde };
  });
};

/**
 * Calcule les statistiques des dons
 * @param {Array} donateurs - Liste des dons
 * @returns {Object}
 */
export const calculateDonationsStats = (donateurs) => {
  const total = donateurs.reduce((sum, d) => sum + d.montant, 0);
  const nombre = donateurs.length;
  
  const parMode = donateurs.reduce((acc, d) => {
    acc[d.mode] = (acc[d.mode] || 0) + d.montant;
    return acc;
  }, {});
  
  const parType = donateurs.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total,
    nombre,
    moyenne: nombre > 0 ? total / nombre : 0,
    parMode,
    parType,
    plusGrand: donateurs.length > 0 ? Math.max(...donateurs.map(d => d.montant)) : 0,
    plusPetit: donateurs.length > 0 ? Math.min(...donateurs.map(d => d.montant)) : 0
  };
};