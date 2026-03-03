// Plan comptable standard
export const PLAN_COMPTABLE = {
  // CLASSE 1 - RESSOURCES DURABLES
  '101': { intitule: 'Fonds propres', nature: 'passif', classe: 1 },
  '106': { intitule: 'Réserves', nature: 'passif', classe: 1 },
  '11': { intitule: 'Report à nouveau', nature: 'passif', classe: 1 },
  '12': { intitule: 'Résultat de l\'exercice', nature: 'passif', classe: 1 },
  '13': { intitule: 'Subventions d\'investissement', nature: 'passif', classe: 1 },
  '14': { intitule: 'Provisions réglementées', nature: 'passif', classe: 1 },
  
  // CLASSE 2 - ACTIF IMMOBILISÉ
  '211': { intitule: 'Terrains', nature: 'actif', classe: 2 },
  '213': { intitule: 'Constructions', nature: 'actif', classe: 2 },
  '214': { intitule: 'Mobilier', nature: 'actif', classe: 2 },
  '215': { intitule: 'Matériel informatique', nature: 'actif', classe: 2 },
  '218': { intitule: 'Autres immobilisations', nature: 'actif', classe: 2 },
  '281': { intitule: 'Amortissements', nature: 'actif', classe: 2, subtractive: true },
  
  // CLASSE 3 - STOCKS
  '311': { intitule: 'Livres en stock', nature: 'actif', classe: 3 },
  '312': { intitule: 'Fournitures', nature: 'actif', classe: 3 },
  '313': { intitule: 'Matériel pédagogique', nature: 'actif', classe: 3 },
  
  // CLASSE 4 - TIERS
  '401': { intitule: 'Fournisseurs', nature: 'passif', classe: 4 },
  '404': { intitule: 'Fournisseurs d\'immobilisations', nature: 'passif', classe: 4 },
  '411': { intitule: 'Clients', nature: 'actif', classe: 4 },
  '421': { intitule: 'Personnel', nature: 'passif', classe: 4 },
  '431': { intitule: 'Sécurité sociale', nature: 'passif', classe: 4 },
  '444': { intitule: 'Organismes sociaux', nature: 'passif', classe: 4 },
  '445': { intitule: 'État - TVA', nature: 'passif', classe: 4 },
  '467': { intitule: 'Autres comptes débiteurs/créditeurs', nature: 'actif', classe: 4 },
  
  // CLASSE 5 - TRÉSORERIE
  '57': { intitule: 'Caisse', nature: 'actif', classe: 5 },
  '531': { intitule: 'Banque', nature: 'actif', classe: 5 },
  '58': { intitule: 'Virements internes', nature: 'actif', classe: 5 },
  
  // CLASSE 6 - CHARGES
  '601': { intitule: 'Achats de livres', nature: 'charge', classe: 6 },
  '602': { intitule: 'Achats de fournitures', nature: 'charge', classe: 6 },
  '606': { intitule: 'Achats non stockés', nature: 'charge', classe: 6 },
  '609': { intitule: 'Dons en nature', nature: 'charge', classe: 6 },
  '611': { intitule: 'Sous-traitance', nature: 'charge', classe: 6 },
  '613': { intitule: 'Locations', nature: 'charge', classe: 6 },
  '614': { intitule: 'Charges locatives', nature: 'charge', classe: 6 },
  '615': { intitule: 'Entretien et réparations', nature: 'charge', classe: 6 },
  '616': { intitule: 'Assurances', nature: 'charge', classe: 6 },
  '618': { intitule: 'Documentation', nature: 'charge', classe: 6 },
  '621': { intitule: 'Personnel extérieur', nature: 'charge', classe: 6 },
  '622': { intitule: 'Rémunérations d\'intermédiaires', nature: 'charge', classe: 6 },
  '623': { intitule: 'Publicité', nature: 'charge', classe: 6 },
  '624': { intitule: 'Transports', nature: 'charge', classe: 6 },
  '625': { intitule: 'Déplacements', nature: 'charge', classe: 6 },
  '626': { intitule: 'Frais postaux', nature: 'charge', classe: 6 },
  '627': { intitule: 'Services bancaires', nature: 'charge', classe: 6 },
  '628': { intitule: 'Cotisations', nature: 'charge', classe: 6 },
  '641': { intitule: 'Salaires', nature: 'charge', classe: 6 },
  '645': { intitule: 'Charges sociales', nature: 'charge', classe: 6 },
  '681': { intitule: 'Dotations aux amortissements', nature: 'charge', classe: 6 },
  '691': { intitule: 'Subventions accordées', nature: 'charge', classe: 6 },
  
  // CLASSE 7 - PRODUITS
  '701': { intitule: 'Ventes de livres', nature: 'produit', classe: 7 },
  '704': { intitule: 'Prestations de services', nature: 'produit', classe: 7 },
  '706': { intitule: 'Cotisations', nature: 'produit', classe: 7 },
  '708': { intitule: 'Produits annexes', nature: 'produit', classe: 7 },
  '71': { intitule: 'Production stockée', nature: 'produit', classe: 7 },
  '72': { intitule: 'Production immobilisée', nature: 'produit', classe: 7 },
  '73': { intitule: 'Subventions d\'exploitation', nature: 'produit', classe: 7 },
  '74': { intitule: 'Autres produits', nature: 'produit', classe: 7 },
  '75': { intitule: 'Transferts de charges', nature: 'produit', classe: 7 },
  '76': { intitule: 'Produits financiers', nature: 'produit', classe: 7 },
  '77': { intitule: 'Produits exceptionnels', nature: 'produit', classe: 7 }
};

// Codes journaux
export const JOURNAUX = {
  ACH: { code: 'ACH', libelle: 'Achats' },
  VTE: { code: 'VTE', libelle: 'Ventes' },
  CAI: { code: 'CAI', libelle: 'Caisse' },
  BAN: { code: 'BAN', libelle: 'Banque' },
  OD: { code: 'OD', libelle: 'Opérations diverses' },
  DON: { code: 'DON', libelle: 'Dons' }
};

// Modes de paiement
export const MODES_PAIEMENT = [
  'Espèce',
  'Chèque',
  'Virement',
  'Carte bancaire',
  'Prélèvement',
  'Nature'
];

// Types de donateurs
export const TYPES_DONATEURS = [
  'Physique',
  'Moral'
];

// Mois en français
export const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Couleurs pour les graphiques
export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#8b5cf6',
  gray: '#6b7280',
  success: '#22c55e'
};

// Seuils et limites
export const SEUILS = {
  maxEcrituresParPage: 50,
  alertSoldeMinimum: 50000,
  alertEcartBalance: 1,
  maxLignesBilan: 100
};