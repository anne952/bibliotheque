/**
 * Formate un montant en devise XOF
 * @param {number} montant - Montant à formater
 * @returns {string}
 */
export const formatCurrency = (montant) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(montant).replace('XOF', 'F').trim();
};

/**
 * Formate une date du format JJ/MM/AAAA vers un objet Date
 * @param {string} dateStr - Date au format JJ/MM/AAAA
 * @returns {Date}
 */
export const parseDate = (dateStr) => {
  const [jour, mois, annee] = dateStr.split('/');
  return new Date(annee, mois - 1, jour);
};

/**
 * Formate une date objet vers JJ/MM/AAAA
 * @param {Date} date - Objet Date
 * @returns {string}
 */
export const formatDate = (date) => {
  const jour = date.getDate().toString().padStart(2, '0');
  const mois = (date.getMonth() + 1).toString().padStart(2, '0');
  const annee = date.getFullYear();
  return `${jour}/${mois}/${annee}`;
};

/**
 * Formate un numéro de compte comptable
 * @param {string} compte - Numéro de compte
 * @returns {string}
 */
export const formatAccountNumber = (compte) => {
  return compte.padStart(3, '0');
};

/**
 * Génère le libellé complet d'un compte
 * @param {string} numero - Numéro de compte
 * @param {string} intitule - Intitulé du compte
 * @returns {string}
 */
export const formatAccountFull = (numero, intitule) => {
  return `${numero} - ${intitule}`;
};

/**
 * Formate un pourcentage
 * @param {number} valeur - Valeur (ex: 0.25)
 * @returns {string}
 */
export const formatPercent = (valeur) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(valeur);
};

/**
 * Formate une période comptable
 * @param {string} periode - Période (MM/YYYY ou YYYY)
 * @returns {string}
 */
export const formatPeriode = (periode) => {
  if (periode.includes('/')) {
    const [mois, annee] = periode.split('/');
    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${moisNoms[parseInt(mois, 10) - 1]} ${annee}`;
  }
  return `Exercice ${periode}`;
};