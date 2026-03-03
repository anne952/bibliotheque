/**
 * Valide un numéro de compte comptable
 * @param {string} compte - Numéro de compte
 * @returns {boolean}
 */
export const validateAccountNumber = (compte) => {
  return /^\d{3,4}$/.test(compte);
};

/**
 * Valide une date au format JJ/MM/AAAA
 * @param {string} date - Date à valider
 * @returns {boolean}
 */
export const validateDate = (date) => {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!regex.test(date)) return false;
  
  const [, jour, mois, annee] = date.match(regex);
  const dateObj = new Date(annee, mois - 1, jour);
  
  return dateObj.getDate() === parseInt(jour, 10) &&
         dateObj.getMonth() === parseInt(mois, 10) - 1 &&
         dateObj.getFullYear() === parseInt(annee, 10);
};

/**
 * Valide une écriture comptable
 * @param {Object} ecriture - Écriture à valider
 * @returns {Object} Résultat de la validation
 */
export const validateEcriture = (ecriture: any) => {
  const errors: Record<string, string> = {};
  
  if (!ecriture.compte) {
    errors.compte = 'Le numéro de compte est requis';
  } else if (!validateAccountNumber(ecriture.compte)) {
    errors.compte = 'Format de compte invalide';
  }
  
  if (!ecriture.libelle) {
    errors.libelle = 'Le libellé est requis';
  }
  
  if (!ecriture.debit && !ecriture.credit) {
    errors.debit = 'Un montant est requis';
    errors.credit = 'Un montant est requis';
  }
  
  if (ecriture.debit && ecriture.credit) {
    errors.debit = 'Une écriture ne peut pas être à la fois au débit et au crédit';
    errors.credit = 'Une écriture ne peut pas être à la fois au débit et au crédit';
  }
  
  if (ecriture.debit && ecriture.debit <= 0) {
    errors.debit = 'Le montant doit être positif';
  }
  
  if (ecriture.credit && ecriture.credit <= 0) {
    errors.credit = 'Le montant doit être positif';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Valide un don
 * @param {Object} don - Don à valider
 * @returns {Object} Résultat de la validation
 */
export const validateDon = (don: any) => {
  const errors: Record<string, string> = {};
  
  if (!don.nom) {
    errors.nom = 'Le nom est requis';
  }
  
  if (!don.montant || don.montant <= 0) {
    errors.montant = 'Le montant doit être supérieur à 0';
  }
  
  if (don.contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(don.contact)) {
    errors.contact = 'Format email invalide';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
