# Rapport de fidélité de la logique backend

## Périmètre audité
- Entrée Electron et passerelle preload : [electron/main.js](electron/main.js), [electron/preload.js](electron/preload.js), [src/types/electron.d.ts](src/types/electron.d.ts)
- Couche services comptables : [src/service/accounting](src/service/accounting)
- Hooks comptables : [src/hooks/accounting](src/hooks/accounting)
- Écran de comptabilité effectivement rendu : [src/pages/principales/comptabilite.tsx](src/pages/principales/comptabilite.tsx), [src/component/accounting/AccountingPage.tsx](src/component/accounting/AccountingPage.tsx), [src/component/accounting/AccountingPanel.tsx](src/component/accounting/AccountingPanel.tsx)
- Composants métiers affichés : [src/component/accounting/JournalComptable.tsx](src/component/accounting/JournalComptable.tsx), [src/component/accounting/JournalCaisse.tsx](src/component/accounting/JournalCaisse.tsx), [src/component/accounting/Donateurs.tsx](src/component/accounting/Donateurs.tsx), [src/component/accounting/Balance.tsx](src/component/accounting/Balance.tsx), [src/component/accounting/Bilan.tsx](src/component/accounting/Bilan.tsx), [src/component/accounting/CompteResultat.tsx](src/component/accounting/CompteResultat.tsx), [src/component/accounting/GrandLivre.tsx](src/component/accounting/GrandLivre.tsx)

## Résumé exécutif
Le projet ne possède pas encore de backend opérationnel au sens persistance/API/transactions. La logique métier visible est majoritairement simulée côté front (state React + tableaux en mémoire), et la passerelle Electron est minimale (ping uniquement).  
Conclusion : la logique est cohérente pour une démonstration UI, mais n’est pas encore fidèle à un backend réel (durabilité, intégrité comptable, traçabilité, concurrence, règles d’écriture).

## Constat détaillé

### 1) Couche backend Electron
- [electron/main.js](electron/main.js) crée la fenêtre et charge Vite, sans handlers IPC métier.
- [electron/preload.js](electron/preload.js) expose seulement api.ping.
- [electron/bd/migrations](electron/bd/migrations) est vide.

Impact : aucune persistence locale/serveur n’est branchée. Les données sont perdues au redémarrage.

### 2) Couche services comptables
- Les services de [src/service/accounting](src/service/accounting) implémentent une « pseudo base » en mémoire (variables module) et des délais simulés.
- Aucune intégration SQL/NoSQL/API distante détectée.
- Les règles comptables sont partielles (agrégations, totaux, exports CSV/PDF simulé), utiles pour maquette mais insuffisantes pour un backend fidèle.

Impact : état non durable et non transactionnel.

### 3) Couche hooks comptables
- Les hooks dans [src/hooks/accounting](src/hooks/accounting) encapsulent bien des cas d’usage (chargement, ajout, suppression, totaux).
- Mais ils ne sont pas consommés par l’écran comptable actif (pas d’usage référencé hors définition).

Impact : la couche « proche backend » existe mais n’alimente pas l’UI actuelle.

### 4) UI comptable active
- [src/component/accounting/AccountingPanel.tsx](src/component/accounting/AccountingPanel.tsx) maintient ses propres tableaux locaux journal/caisse/donateurs.
- [src/component/accounting/Balance.tsx](src/component/accounting/Balance.tsx), [src/component/accounting/Bilan.tsx](src/component/accounting/Bilan.tsx), [src/component/accounting/CompteResultat.tsx](src/component/accounting/CompteResultat.tsx), [src/component/accounting/GrandLivre.tsx](src/component/accounting/GrandLivre.tsx) reposent sur des données codées en dur.

Impact : duplication de logique et risque élevé d’écarts entre « service métier » et « rendu écran ».

### 5) Modèle de données
- Multiplicité de modèles comptables : [src/types/accounting.ts](src/types/accounting.ts), [src/types/comptable.ts](src/types/comptable.ts), [src/types/accounting/index.ts](src/types/accounting/index.ts).
- Terminologie et structures hétérogènes (noms champs, langues, conventions).

Impact : ambiguïtés, mappages fragiles, bugs d’intégration futurs.

## Niveau de fidélité backend actuel
- Persistance : Faible
- Intégrité comptable : Faible à moyenne
- Traçabilité/Audit : Faible
- Cohérence modèle métier ↔ UI : Faible
- Préparation industrialisation : Faible

## Risques prioritaires
1. Perte de données (redémarrage application).
2. Incohérence entre états calculés (services/hooks) et affichage (composants statiques).
3. Absence de journal d’audit et de validation métier stricte (écritures non verrouillées, non versionnées).
4. Difficulté de maintenance due aux types dupliqués.

## Données concrètes nécessaires pour construire le backend

### A) Formulaires à supporter (issus de l’UI actuelle)

Références: [src/component/accounting/AccountingEntryForm.tsx](src/component/accounting/AccountingEntryForm.tsx), [src/component/accounting/JournalComptableForm.tsx](src/component/accounting/JournalComptableForm.tsx), [src/component/accounting/JournalCaisseForm.tsx](src/component/accounting/JournalCaisseForm.tsx), [src/component/accounting/DonateurForm.tsx](src/component/accounting/DonateurForm.tsx)

#### 1. Formulaire Journal comptable
Champs:
- date (texte JJ/MM/AAAA)
- piece (texte, optionnel)
- compte (texte, requis, regex actuel: 3 à 4 chiffres)
- journal (enum: ACH, VTE, CAI, BAN, OD)
- libelle (texte, requis)
- debit (nombre positif, exclusif avec credit)
- credit (nombre positif, exclusif avec debit)

Règles métier UI déjà visibles:
- compte obligatoire
- libelle obligatoire
- debit XOR credit (jamais les 2 à la fois, jamais les 2 vides)
- montant strictement positif

#### 2. Formulaire Journal de caisse
Champs:
- date (texte JJ/MM/AAAA)
- mode (enum: Espece, Cheque, Virement, Carte)
- description (texte, requis)
- reference (texte, requis)
- entree (nombre positif, exclusif avec sortie)
- sortie (nombre positif, exclusif avec entree)

Règles métier UI déjà visibles:
- description obligatoire
- reference obligatoire
- entree XOR sortie
- montant strictement positif

#### 3. Formulaire Donateur
Champs:
- date (texte JJ/MM/AAAA)
- type (enum: Physique, Moral)
- nom (texte, requis)
- montant (nombre > 0)
- mode (enum: Espece, Cheque, Virement, Nature)
- description (texte, requis)

Règles métier UI déjà visibles:
- nom obligatoire
- montant > 0
- description obligatoire

### B) Enregistrements à persister (modèle minimal backend)

#### 1. Table journal_comptable
- id (uuid)
- date_operation (date)
- piece_ref (varchar, nullable)
- compte_numero (varchar)
- journal_code (varchar)
- libelle (varchar)
- debit (decimal(15,2), default 0)
- credit (decimal(15,2), default 0)
- periode (varchar MM/YYYY)
- statut_validation (boolean)
- created_at, updated_at

Contraintes minimales:
- check (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
- compte_numero non vide
- libelle non vide

#### 2. Table journal_caisse
- id (uuid)
- date_operation (date)
- description (varchar)
- reference_piece (varchar)
- mode_paiement (varchar)
- entree (decimal(15,2), default 0)
- sortie (decimal(15,2), default 0)
- periode (varchar)
- created_at, updated_at

Contraintes minimales:
- check (entree > 0 AND sortie = 0) OR (sortie > 0 AND entree = 0)

#### 3. Table donateurs
- id (uuid)
- date_don (date)
- nom (varchar)
- type_donateur (Physique|Moral)
- montant (decimal(15,2))
- mode_paiement (Espece|Cheque|Virement|Nature)
- description (text)
- created_at, updated_at

Contraintes minimales:
- montant > 0
- nom non vide
- description non vide

#### 4. Tables de référence et agrégats
- plan_comptable (compte_numero, intitule, classe)
- grand_livre_lignes (générable depuis journal_comptable, ou matérialisé)
- snapshots_bilan, snapshots_resultat, snapshots_balance (optionnel si calcul à la volée)

### C) En-têtes et détails affichés à exposer via backend

#### 1. Journal comptable (liste)
Référence: [src/component/accounting/JournalComptable.tsx](src/component/accounting/JournalComptable.tsx)

Entêtes:
- Date
- N compte
- Libelle
- Debit
- Credit
- Actions

Détails de bas de tableau:
- TOTAL debit
- TOTAL credit
- BALANCE (équilibrée ou écart)

#### 2. Journal de caisse (liste)
Référence: [src/component/accounting/JournalCaisse.tsx](src/component/accounting/JournalCaisse.tsx)

Entêtes:
- Date
- Description
- Reference
- Entree
- Sortie
- Actions

Détails de bas de tableau:
- TOTAL entree
- TOTAL sortie
- Solde caisse

#### 3. Donateurs (liste)
Référence: [src/component/accounting/Donateurs.tsx](src/component/accounting/Donateurs.tsx)

Entêtes:
- Date
- Nom complet
- Type
- Montant
- Mode
- Description
- Actions

#### 4. Balance générale
Référence: [src/component/accounting/Balance.tsx](src/component/accounting/Balance.tsx)

Entêtes:
- N Compte
- Intitule
- Total Debit
- Total Credit
- Solde Debiteur
- Solde Crediteur
- Actions

Détails:
- lignes d’en-tête de classe comptable
- ligne TOTAUX
- statut BALANCE EQUILIBREE / NON EQUILIBREE

#### 5. Grand livre
Référence: [src/component/accounting/GrandLivre.tsx](src/component/accounting/GrandLivre.tsx)

Niveau compte (header):
- compte
- intitule
- solde affiché
- actions (edit/delete)

Niveau opérations (détail):
- Date
- Libelle
- Piece
- Debit
- Credit
- Solde

Détails de bas de tableau:
- TOTAL debit
- TOTAL credit
- Solde final

### D) Actions fonctionnelles à couvrir côté backend

#### Actions globales panneau
Référence: [src/component/accounting/AccountingPanel.tsx](src/component/accounting/AccountingPanel.tsx)

- Changer période (mensuelle / exercice / presets)
- Rechercher (texte)
- Exporter (xlsx actuellement simulé)
- Ajouter (modules journal, caisse, donateurs)
- Basculer Graphique pour journal

#### Actions de ligne
- Modifier ligne (journal, caisse, donateurs, balance, grand livre)
- Supprimer ligne (journal, caisse, donateurs, balance, grand livre)

#### Actions calculées
- Recalcul totaux journal
- Recalcul totaux caisse
- Vérification équilibre balance
- Calcul soldes grand livre

### E) Contrats API/IPC minimaux recommandés (prêts pour implémentation)

#### Journal comptable
- createJournalEntry(payload)
- updateJournalEntry(id, payload)
- deleteJournalEntry(id)
- listJournalEntries({periode, search, page, pageSize})
- validateJournalEntry(id)
- getJournalTotals({periode, search})

#### Journal caisse
- createCashEntry(payload)
- updateCashEntry(id, payload)
- deleteCashEntry(id)
- listCashEntries({periode, search, page, pageSize})
- getCashTotals({periode, search})

#### Donateurs
- createDonor(payload)
- updateDonor(id, payload)
- deleteDonor(id)
- listDonors({periode, search, page, pageSize})
- getDonorStats({periode})

#### États comptables
- getBalance({periode, search})
- getGrandLivre({periode, search, comptes})
- getBilan({exercice})
- getCompteResultat({exercice})
- exportAccountingData({module, periode, format})

### F) Priorité de mise en œuvre backend (très pratique)
1. Journal comptable CRUD + totals + validation.
2. Journal caisse CRUD + totals.
3. Donateurs CRUD + stats.
4. Balance et grand livre calculés depuis écritures persistées.
5. Bilan/compte résultat calculés depuis balance.
6. Export réel xlsx/pdf branché sur données persistées.

## Extension du périmètre backend (Bibliothèque, Matériel, Paramètre, Dashboard, Auth)

### 1) Module Bibliothèque

Références principales: [src/component/library/BibliothequePage.tsx](src/component/library/BibliothequePage.tsx), [src/component/library/ModalForm.tsx](src/component/library/ModalForm.tsx), [src/component/library/DataTable.tsx](src/component/library/DataTable.tsx), [src/types/biblio.ts](src/types/biblio.ts)

#### A. Formulaires et champs

- Emprunt (multi-pages):
	- nom, prenom, telephone, email
	- livre1_titre/reference/quantite (+ livre2, livre3 optionnels)
	- dateEmprunt, dureeEmprunt, dateRetour, renouvele, egliseProvenance
- Visiteur:
	- nom, prenom, adresse, egliseProvenance, telephone, email, dateVisite
- Vente:
	- titre1/reference1 (+ titre2/reference2, titre3/reference3 optionnels)
	- nom, prenom, adresse, montant, dateVente
- Don financier:
	- donateur, type (physique|moral), montant, mode, dateDon, description
- Don matériel:
	- typeMateriel, materiel, quantite, institutionDestinaire, dateDon, description
- Achat:
	- intitule, montant, dateAchat, fournisseur

#### B. Entêtes de détails affichés

- Emprunts: Nom, Prénom, Livres, Date Emprunt, Date Retour, Actions
- Visiteurs: Nom, Prénom, Adresse, Église, Date Visite, Actions
- Ventes: Titre, Référence, Nom, Prénom, Montant, Date, Actions
- Dons financiers: Donateur, Type, Montant, Mode, Date, Description, Actions
- Dons matériel: Type Matériel, Matériel, Quantité, Institution, Date, Actions
- Achats: Intitulé, Montant, Date, Fournisseur, Actions

#### C. Actions à couvrir backend

- Changer d’onglet (jeu de données par type)
- Recherche full-text par onglet
- Ajouter / modifier / supprimer une ligne
- Préparer export (bouton prévu via ActionButtons)

#### D. Enregistrements backend minimaux

- emprunts(id, nom, prenom, telephone, email, date_emprunt, duree_jours, date_retour, renouvele, eglise_provenance, created_at, updated_at)
- emprunt_livres(id, emprunt_id, titre, reference, quantite)
- visiteurs(id, nom, prenom, adresse, eglise_provenance, telephone, email, date_visite, created_at, updated_at)
- ventes(id, nom, prenom, adresse, montant, date_vente, created_at, updated_at)
- vente_lignes(id, vente_id, titre, reference)
- dons_financiers(id, donateur, type_donateur, montant, mode, date_don, description, created_at, updated_at)
- dons_materiels(id, type_materiel, materiel, quantite, institution_destinaire, date_don, description, created_at, updated_at)
- achats(id, intitule, montant, date_achat, fournisseur, created_at, updated_at)

#### E. Contrats API/IPC minimaux

- listBibliothequeItems({tab, search, page, pageSize})
- createBibliothequeItem({tab, payload})
- updateBibliothequeItem({tab, id, payload})
- deleteBibliothequeItem({tab, id})
- exportBibliotheque({tab, filters, format})

### 2) Module Matériel

Références principales: [src/pages/principales/materiel.tsx](src/pages/principales/materiel.tsx), [src/component/materiel/AddMaterielModal.tsx](src/component/materiel/AddMaterielModal.tsx), [src/component/materiel/StockOperationModale.tsx](src/component/materiel/StockOperationModale.tsx), [src/component/materiel/MaterielList.tsx](src/component/materiel/MaterielList.tsx), [src/component/materiel/MaterielDetail.tsx](src/component/materiel/MaterielDetail.tsx), [src/types/materiel.ts](src/types/materiel.ts)

#### A. Formulaires et champs

- Ajout matériel (commun): type, etat
- Livre: titre, reference, volume, langue, categorie
- Carte SD: categorie
- Tablette: nom, numeroSerie
- Photocopieuse/Imprimante/Chaise/Autre: nom
- Opération de stock (modale): type (actuellement entrée), quantite, raison, description

#### B. Entêtes de détails affichés

- Liste type livre: Titre, Référence, Volume, Langue, Date d’ajout, État, Stock, Actions
- Liste type carte-sd: Catégorie, Date d’ajout, État, Stock, Actions
- Liste type tablette: Nom, Numéro de série, Date d’ajout, État, Stock, Actions
- Liste autres types: Nom, Type, Date d’ajout, État, Stock, Actions
- Détail stock: Date, Quantité, Raison, Description

#### C. Actions à couvrir backend

- Filtrer par type
- Recherche sur titre/référence/nom/numéro série/catégorie
- Ajouter matériel
- Modifier état matériel
- Supprimer matériel
- Consulter détail matériel
- Ajouter opération de stock
- Calculer stock courant (entrées - sorties)

#### D. Enregistrements backend minimaux

- materiels(id, type, nom, titre, reference, volume, langue, categorie, numero_serie, etat, date_ajout, created_at, updated_at)
- stock_operations(id, materiel_id, date_operation, type_operation, quantite, raison, description, created_at)

Contraintes:
- quantite > 0
- etat in ('fonctionnel','défectueux','en réparation','inutilisable')
- type in ('livre','carte-sd','tablette','photocopieuse','imprimante','chaise','autre')

#### E. Contrats API/IPC minimaux

- listMateriels({type, search, page, pageSize})
- getMaterielById(id)
- createMateriel(payload)
- updateMaterielEtat({id, etat})
- deleteMateriel(id)
- createStockOperation({materielId, payload})
- getStockHistory({materielId})

### 3) Module Paramètre

Références principales: [src/pages/principales/parametre.tsx](src/pages/principales/parametre.tsx), [src/component/parametre/adminInfo.tsx](src/component/parametre/adminInfo.tsx), [src/component/parametre/adminInfoform.tsx](src/component/parametre/adminInfoform.tsx), [src/component/parametre/recentDeletions.tsx](src/component/parametre/recentDeletions.tsx), [src/component/parametre/deleteConfirmationModal.tsx](src/component/parametre/deleteConfirmationModal.tsx)

#### A. Formulaires et champs

- Profil admin/entreprise:
	- companyName, companyNumber, companyEmail, profilePhoto
	- changement mot de passe: currentPassword, newPassword, confirmPassword

#### B. Entêtes de détails affichés

- Carte infos admin: nom entreprise, numéro, email, mot de passe masqué
- Suppressions récentes: nom élément, type, âge suppression, délai restant, statut restauré

#### C. Actions à couvrir backend

- Mettre à jour profil entreprise
- Changer mot de passe avec vérification ancien mot de passe
- Upload photo profil
- Lister éléments supprimés récemment
- Restaurer élément
- Supprimer définitivement
- Nettoyage auto des suppressions > 30 jours

#### D. Enregistrements backend minimaux

- settings_admin(id, company_name, company_number, company_email, password_hash, profile_photo_url, updated_at)
- deleted_items(id, entity_type, entity_id, display_name, deleted_at, restored_at, purge_after)

#### E. Contrats API/IPC minimaux

- getAdminSettings()
- updateAdminSettings(payload)
- changeAdminPassword({currentPassword, newPassword})
- uploadAdminProfilePhoto(file)
- listRecentDeletions({status})
- restoreDeletedItem({entityType, entityId})
- hardDeleteItem({entityType, entityId})
- cleanupExpiredDeletions()

### 4) Module Dashboard

Références principales: [src/pages/principales/dashbord.tsx](src/pages/principales/dashbord.tsx), [src/component/dashboardHeader.tsx](src/component/dashboardHeader.tsx), [src/component/startCard.tsx](src/component/startCard.tsx), [src/component/monthlyChart.tsx](src/component/monthlyChart.tsx), [src/types/dashboard.ts](src/types/dashboard.ts)

#### A. Données à fournir

- KPIs:
	- visiteurs
	- emprunts
	- dons
	- ventes
- Série mensuelle:
	- mois
	- livres
	- dons

#### B. Actions backend

- Charger agrégats dashboard
- Charger série mensuelle filtrée (année/période)

#### C. Contrats API/IPC minimaux

- getDashboardStats({period})
- getDashboardMonthlyChart({year})

### 5) Authentification (Login / Register)

Références principales: [src/pages/principales/login.tsx](src/pages/principales/login.tsx), [src/pages/intermediare/register.tsx](src/pages/intermediare/register.tsx), [src/App.tsx](src/App.tsx)

#### A. Formulaires et champs

- Login:
	- name
	- password
- Register entreprise:
	- nomEntreprise
	- emailEntreprise
	- motDePasse
	- confirmerMotDePasse

#### B. Validations visibles côté UI

- Register:
	- nomEntreprise requis
	- emailEntreprise requis + format email
	- motDePasse requis + longueur minimale 6
	- confirmerMotDePasse doit correspondre

#### C. Actions backend à implémenter

- Inscription entreprise
- Connexion
- Gestion session/token
- Route guard (aujourd’hui non appliqué sur les pages sous layout)

#### D. Enregistrements backend minimaux

- entreprises(id, nom, email_unique, created_at)
- utilisateurs(id, entreprise_id, display_name, email, password_hash, role, active, created_at)
- sessions(id, utilisateur_id, token_hash, expires_at, created_at, revoked_at)

#### E. Contrats API/IPC minimaux

- registerEntreprise({nomEntreprise, emailEntreprise, motDePasse})
- login({nameOrEmail, password})
- logout()
- getCurrentSession()
- refreshSession()

### 6) Priorisation de mise en œuvre hors comptabilité

1. Auth (register/login/session) + garde de routes.
2. Paramètres admin (profil + mot de passe).
3. Bibliothèque CRUD par onglet.
4. Matériel CRUD + opérations de stock.
5. Dashboard branché sur agrégats réels.

## Plan d’alignement recommandé (ordre d’exécution)

### Phase 1 — Socle backend local fiable (priorité haute)
- Introduire une base locale (SQLite) côté Electron main process.
- Créer schéma minimal : journal_comptable, journal_caisse, donateurs, comptes, lignes_grand_livre, metadata_exercice.
- Ajouter migrations réelles dans [electron/bd/migrations](electron/bd/migrations).
- Exposer des IPC métiers CRUD + lecture agrégée (balance, bilan, résultat).

Critère de sortie : données persistantes et récupérées à froid.

### Phase 2 — Unifier la source de vérité (priorité haute)
- Brancher [src/hooks/accounting](src/hooks/accounting) sur IPC preload.
- Retirer les jeux de données codés en dur des composants d’affichage.
- Faire de [src/service/accounting](src/service/accounting) une couche d’accès réelle (IPC client), plus simulation.

Critère de sortie : toutes les vues comptables lisent/écrivent la même source.

### Phase 3 — Contrôles métier comptables (priorité haute)
- Validation stricte date, compte, pièce, sens débit/crédit.
- Verrouillage d’écriture validée.
- Contrôle balance par écriture et par période.
- Génération de numérotation/horodatage cohérents.

Critère de sortie : impossibilité de créer un état comptable incohérent.

### Phase 4 — Rationaliser les types (priorité moyenne)
- Fusionner les modèles autour d’un seul contrat (DTO + entités UI).
- Standardiser les noms de champs (fr ou en, mais unique).

Critère de sortie : un seul modèle canonique utilisé partout.

### Phase 5 — Auditabilité et export fidèle (priorité moyenne)
- Ajouter historique des modifications (qui, quand, avant/après).
- Faire reposer export PDF/Excel sur données backend persistées.

Critère de sortie : exports traçables et reproductibles.

## Décision architecture conseillée
Pour ce projet Electron, la voie la plus robuste et simple est :
- Backend local embarqué dans Electron main process.
- IPC sécurisé via preload.
- Front React strictement consommateur.

Cette stratégie minimise la complexité opérationnelle tout en rendant la logique backend fidèle, persistante et contrôlable.

## Conclusion
Le code actuel est solide pour une maquette métier et une démonstration fonctionnelle. Pour atteindre une fidélité backend réelle, la priorité est de connecter l’UI à une source de vérité persistante (SQLite + IPC), puis d’unifier modèles et validations comptables. Sans cela, la logique restera divergente entre écran et « pseudo backend » en mémoire.
