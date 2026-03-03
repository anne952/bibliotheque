// ============= TYPES DE BASE =============

/**
 * @typedef {Object} EcritureComptable
 * @property {string} id - Identifiant unique
 * @property {string} date - Date de l'écriture
 * @property {string} compte - Numéro de compte
 * @property {string} libelle - Libellé de l'écriture
 * @property {number} debit - Montant au débit
 * @property {number} credit - Montant au crédit
 * @property {string} piece - Référence de la pièce
 * @property {string} journal - Code du journal (ACH, VTE, CAI, etc.)
 * @property {string} periode - Période comptable (MM/YYYY)
 * @property {boolean} valide - État de validation
 */

/**
 * @typedef {Object} Donateur
 * @property {string} id - Identifiant unique
 * @property {string} nom - Nom complet
 * @property {'Physique'|'Moral'} type - Type de donateur
 * @property {number} montant - Montant du don
 * @property {'Espèce'|'Chèque'|'Virement'|'Nature'} mode - Mode de paiement
 * @property {string} description - Description du don
 * @property {string} contact - Email ou téléphone
 * @property {string} date - Date du don
 * @property {string} compteComptable - Compte comptable associé (731)
 */

/**
 * @typedef {Object} OperationCaisse
 * @property {string} id - Identifiant unique
 * @property {string} date - Date de l'opération
 * @property {string} description - Description
 * @property {string} reference - Référence (pièce)
 * @property {number} entree - Montant entrée
 * @property {number} sortie - Montant sortie
 * @property {string} mode - Mode de paiement
 * @property {string} compteContrepartie - Compte comptable associé
 */

/**
 * @typedef {Object} Compte
 * @property {string} numero - Numéro de compte
 * @property {string} intitule - Intitulé du compte
 * @property {string} classe - Classe comptable (1-7)
 * @property {'actif'|'passif'|'charge'|'produit'} nature - Nature du compte
 * @property {number} soldeDebit - Solde débiteur
 * @property {number} soldeCredit - Solde créditeur
 */

/**
 * @typedef {Object} BalanceLigne
 * @property {string} compte - Numéro de compte
 * @property {string} intitule - Intitulé du compte
 * @property {number} totalDebit - Total débit
 * @property {number} totalCredit - Total crédit
 * @property {number} soldeDebiteur - Solde débiteur
 * @property {number} soldeCrediteur - Solde créditeur
 * @property {string} classe - Classe du compte
 * @property {boolean} isHeader - Indique si c'est un en-tête de classe
 */

/**
 * @typedef {Object} BilanSection
 * @property {string} titre - Titre de la section
 * @property {Array<{compte: string, libelle: string, montant: number}>} items - Éléments du bilan
 * @property {number} total - Total de la section
 */

/**
 * @typedef {Object} CompteResultatLigne
 * @property {string} compte - Numéro de compte
 * @property {string} libelle - Libellé
 * @property {number} montant - Montant
 * @property {'produit'|'charge'} type - Type
 * @property {string} classe - Classe (70,71,73 ou 60,61,64,68)
 */

/**
 * @typedef {Object} GrandLivreOperation
 * @property {string} date - Date
 * @property {string} libelle - Libellé
 * @property {string} piece - Pièce
 * @property {number} debit - Débit
 * @property {number} credit - Crédit
 * @property {number} solde - Solde cumulé
 */

/**
 * @typedef {Object} GrandLivreCompte
 * @property {string} compte - Numéro de compte
 * @property {string} intitule - Intitulé
 * @property {number} soldeInitial - Solde initial
 * @property {Array<GrandLivreOperation>} operations - Opérations
 * @property {number} totalDebit - Total débit
 * @property {number} totalCredit - Total crédit
 * @property {number} soldeFinal - Solde final
 */

// ============= PROPS DES COMPOSANTS =============

/**
 * @typedef {Object} AccountingCardProps
 * @property {string} id - Identifiant du module
 * @property {string} title - Titre
 * @property {Function} icon - Composant icône
 * @property {string} color - Classe de couleur
 */

/**
 * @typedef {Object} AccountingPanelProps
 * @property {AccountingCardProps} module - Module sélectionné
 * @property {Function} onClose - Fonction de fermeture
 */

// ============= ÉTATS DES HOOKS =============

/**
 * @typedef {Object} JournalComptableState
 * @property {Array<EcritureComptable>} ecritures - Liste des écritures
 * @property {boolean} loading - État de chargement
 * @property {string|null} error - Erreur éventuelle
 * @property {Object} totals - Totaux débit/crédit
 * @property {number} balance - Balance
 * @property {boolean} isBalanced - Équilibre
 */

/**
 * @typedef {Object} BilanState
 * @property {Object} actif - Actif du bilan
 * @property {Object} passif - Passif du bilan
 * @property {number} totalActif - Total actif
 * @property {number} totalPassif - Total passif
 * @property {boolean} isBalanced - Bilan équilibré
 */

/**
 * @typedef {Object} CompteResultatState
 * @property {Array<CompteResultatLigne>} produits - Produits
 * @property {Array<CompteResultatLigne>} charges - Charges
 * @property {number} totalProduits - Total produits
 * @property {number} totalCharges - Total charges
 * @property {number} resultatNet - Résultat net
 */

// ============= FORMULAIRES =============

/**
 * @typedef {Object} EcritureFormData
 * @property {string} date - Date
 * @property {string} compte - Numéro de compte
 * @property {string} libelle - Libellé
 * @property {number} debit - Montant débit
 * @property {number} credit - Montant crédit
 * @property {string} piece - Référence pièce
 * @property {string} journal - Journal
 */

/**
 * @typedef {Object} DonateurFormData
 * @property {string} nom - Nom complet
 * @property {'Physique'|'Moral'} type - Type
 * @property {number} montant - Montant
 * @property {'Espèce'|'Chèque'|'Virement'|'Nature'} mode - Mode
 * @property {string} description - Description
 * @property {string} contact - Contact
 * @property {string} date - Date
 */

/**
 * @typedef {Object} CaisseFormData
 * @property {string} date - Date
 * @property {string} description - Description
 * @property {string} reference - Référence
 * @property {number} entree - Entrée
 * @property {number} sortie - Sortie
 * @property {string} mode - Mode de paiement
 */