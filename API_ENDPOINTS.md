# API Endpoints Documentation

## Base URL
- Development: `http://localhost:4000/api`
- Production (Render): `https://bibliotheque-backend-1.onrender.com/api`
- **Status**: ✅ **Production Active** (Port 10000, deployed 2026-02-24)

### Exemples d'appels complets
- Health (local): `http://localhost:4000/api/init/health`
- Health (Render): `https://bibliotheque-backend-1.onrender.com/api/init/health`
- Register status (Render): `https://bibliotheque-backend-1.onrender.com/api/auth/register-status`
- **Fiscal Years (Render)**: `https://bibliotheque-backend-1.onrender.com/api/accounting/fiscal-years` ✅
- **Accounts (Render)**: `https://bibliotheque-backend-1.onrender.com/api/accounting/accounts` ✅

### Production Validation (2026-02-24)
- ✅ 901 SYSCOHADA accounts loaded and verified
- ✅ Fiscal Year: `f21982f8-d776-43c0-a2b2-c4a8a2fda8d2` (FY 2026)
- ✅ Test entry created: `FY 2026-00031` with unified `account` field
- ✅ Account resolution: `"57"` → `5775c8f1-5a89-41bc-9e30-43ebdef32fb5` (CAISSE)

---

## 1. INITIALIZATION

### Setup Database
- **POST** `/init/setup`
- Creates default chart of accounts and initial fiscal year
- Response: Success message with timestamp

### Health Check
- **GET** `/init/health`
- Returns API health status
- Response: `{ status: "ok", timestamp: "..." }`

---

## 2. AUTHENTICATION

### Registration Status
- **GET** `/auth/register-status`
- Response: `{ canRegister, usersCount }`
- `canRegister=true` only on first setup (no principal account yet)

### Register
- **POST** `/auth/register`
- Body: `{ email, password, companyName? }`
- Rule: Allowed only once for first setup; afterwards returns `403` and app must use login only
- Response: Principal user object (without password)

### Login
- **POST** `/auth/login`
- Body: `{ email, password }`
- Response: `{ user: {...}, refreshToken }`

### Refresh Token
- **POST** `/auth/refresh`
- Body: `{ refreshToken }`
- Response: `{ user: {...}, refreshToken }`
- Expiration: refresh token valid for 7 days
- Rotation: each successful refresh returns a new refresh token; previous token stays valid for 1 minute (grace period), then becomes invalid
- Frontend rule: always store and use the latest `refreshToken` returned by `/auth/login` or `/auth/refresh`

### Logout
- **POST** `/auth/logout`
- Body: `{ refreshToken }`
- Response: Success message

### Get Profile (Protected)
- **GET** `/auth/profile`
- Headers: `Authorization: Bearer <refreshToken>`
- Response: User profile object

### Update Profile (Protected)
- **PUT** `/auth/profile`
- Headers: `Authorization: Bearer <refreshToken>`
- Body: `{ companyName?, profilePicture? }`
- Response: Updated user object

---

## 3. PERSONS (CRUD)

### Get All Persons
- **GET** `/persons`
- Query params: `?isBorrower=true&isBuyer=true&isDonor=true&isSupplier=true&isVisitor=true`
- Response: Array of person objects

### Get Person by ID
- **GET** `/persons/:id`
- Response: Person object

### Get Person's Loans
- **GET** `/persons/:id/loans`
- Response: Array of loan objects with items

### Get Person's Purchases
- **GET** `/persons/:id/purchases`
- Response: Array of purchase objects with items

### Get Person's Sales
- **GET** `/persons/:id/sales`
- Response: Array of sale objects with items

### Create Person
- **POST** `/persons`
- Body: `{ firstName, lastName, phone?, email?, address?, church?, isBorrower?, isBuyer?, isDonor?, isSupplier?, isVisitor? }`
- Response: Created person object

### Update Person
- **PUT** `/persons/:id`
- Body: Same as create (only provided fields are updated)
- Response: Updated person object

### Delete Person (Soft Delete)
- **DELETE** `/persons/:id`
- Response: 204 No Content

---

## 4. MATERIALS (Inventory)

### Get All Materials
- **GET** `/materials`
- Response: Array of material objects

### Get Low Stock Materials
- **GET** `/materials/low-stock`
- Response: Array of materials where `currentStock <= minStockAlert`

### Get Material by ID
- **GET** `/materials/:id`
- Response: Material object

### Get Material Transactions
- **GET** `/materials/:id/transactions`
- Response: Array of stock movements for this material

### Create Material
- **POST** `/materials`
- Body: `{ type, name, reference?, serialNumber?, category?, language?, volume?, minStockAlert?, unitPrice?, sellingPrice?, location?, description? }`
- Response: Created material object

### Import Materials from Excel Paste (1 ligne = 1 materiel)
- **POST** `/materials/import-paste`
- Objectif: recevoir un tableau colle depuis Excel, le transformer en JSON, puis creer un materiel par ligne.
- Body:
```json
{
  "pastedData": "Type\tNom\tReference\tPrix Achat\tPrix Vente\nBOOK\tLe Petit Prince\tBK-001\t3500\t5000",
  "defaultType": "BOOK"
}
```
- Alternative: envoyer directement `rows` (JSON) au lieu de `pastedData`.
- Colonnes supportees (insensibles aux accents/casse):
  - Type: `type`, `materialType`, `type materiel` (optionnel si `defaultType` fourni)
  - Nom: `name`, `nom`, `designation`
  - Reference: `reference`, `ref`
  - Numero serie: `serialNumber`, `numero serie`
  - Categorie: `category`, `categorie`
  - Langue: `language`, `langue`
  - Volume: `volume`, `tome`
  - Stock min: `minStockAlert`, `stock minimum`
  - Prix achat: `unitPrice`, `prix achat`, `prix unitaire`
  - Prix vente: `sellingPrice`, `prix vente`
  - Emplacement: `location`, `emplacement`
  - Description: `description`, `details`
- Regles:
  - Chaque ligne doit contenir au moins `name` et un `type` valide (`BOOK`, `SD_CARD`, `TABLET`, `PHOTOCOPIER`, `PRINTER`, `CHAIR`, `OTHER`) ou utiliser `defaultType`.
  - Delimiteurs supportes pour `pastedData`: tabulation, `;`, `,`.
  - Priorite payload: si `rows` est present, le backend ignore `pastedData`.
  - Doublons pris en charge en mode upsert/update: si `reference` ou `serialNumber` existe deja, le materiel existant est mis a jour au lieu de provoquer une erreur.
  - En cas de conflit ambigu (`reference` et `serialNumber` pointant vers 2 materiels differents), la ligne est ignoree et retournee dans `lineErrors`.
  - Si un materiel est soft-delete et matche par `reference`/`serialNumber`, il est reactive (`deletedAt=null`).
- Traitement: par lots (batch) avec succes partiel (pas de rollback global).
- Response: `{ receivedRows, jsonRows, createdCount, updatedCount, failedCount, errors, lineErrors, processedCount, createdMaterials }`

### Update Material
- **PUT** `/materials/:id`
- Body: Any updatable fields
- Response: Updated material object

### Delete Material (Soft Delete)
- **DELETE** `/materials/:id`
- Response: 204 No Content

### Alias Module Bibliotheque (meme CRUD)
- **GET** `/bibliotheque`
- **GET** `/bibliotheque/low-stock`
- **GET** `/bibliotheque/:id`
- **GET** `/bibliotheque/:id/transactions`
- **POST** `/bibliotheque`
- **POST** `/bibliotheque/import-paste`
- **PUT** `/bibliotheque/:id`
- **DELETE** `/bibliotheque/:id`
- Notes: cet alias pointe sur la meme logique que `/materials` et couvre bien les actions modifier/supprimer.

### Alias Module Materiel (meme CRUD)
- **GET** `/materiel`
- **GET** `/materiel/low-stock`
- **GET** `/materiel/:id`
- **GET** `/materiel/:id/transactions`
- **POST** `/materiel`
- **POST** `/materiel/import-paste`
- **PUT** `/materiel/:id`
- **DELETE** `/materiel/:id`
- Notes: cet alias pointe sur la meme logique que `/materials`.

---

## 5. TRANSACTIONS (Stock Movements)

### Get All Stock Movements
- **GET** `/transactions`
- Response: Array of stock movement objects

### Get Stock Movement by ID
- **GET** `/transactions/:id`
- Response: Stock movement object

### Create Purchase
- **POST** `/transactions/purchase`
- Body: `{ quantity, unitPrice, itemName?, paymentMethod?, paymentStatus?, supplierId?, invoiceNumber?, notes?, reference?, purchaseDate? }`
- `itemName` (optionnel): libelle metier pour la comptabilite (ex: `livre`, `meuble`)
- `purchaseDate` (optionnel): date explicite de l'achat (accepte une date anterieure si un exercice comptable ouvert couvre cette date)
- Creates Purchase record + synchronized accounting journal entry (source `PURCHASE`)
- Response: Created purchase object
- Exemple:
```json
{
  "quantity": 12,
  "unitPrice": 2500,
  "itemName": "livre",
  "paymentMethod": "CASH",
  "paymentStatus": "PAID",
  "invoiceNumber": "ACH-2026-001",
  "notes": "Achat de stock lecture"
}
```

### Update Purchase
- **PUT** `/transactions/purchase/:id`
- Body: `{ supplierId?, paymentMethod?, paymentStatus?, invoiceNumber?, notes?, purchaseDate?, unitPrice?/montant? }`
- Updates purchase metadata and optional item pricing
- Si `purchaseDate` est fourni et qu'une ecriture comptable auto existe (`source=PURCHASE`), la date comptable est resynchronisee automatiquement
- Validation metier: la date cible doit appartenir a un exercice comptable ouvert pour conserver la synchronisation
- Response: Updated purchase object

### Delete Purchase
- **DELETE** `/transactions/purchase/:id`
- Deletes purchase record (and removes legacy purchase stock movements if present)
- Response: 204 No Content

### Create Sale
- **POST** `/transactions/sale`
- Body: `{ materialId?, itemName?, quantity, unitPrice, personId?, paymentMethod?, paymentStatus?, invoiceNumber?, notes?, reference?, saleDate? }`
- Rule: provide at least one of `materialId` or `itemName`
- `saleDate` (optionnel): date explicite de la vente (accepte une date anterieure si un exercice comptable ouvert couvre cette date)
- If `materialId` is provided: creates Sale + StockMovement (SALE_OUT) + updates Material stock + synchronized accounting journal entry (source `SALE`)
- If `itemName` is provided without `materialId`: creates Sale (vente libre) with synchronized accounting journal entry, without stock movement
- Response: Created sale object
- Exemple vente libre (`itemName` sans `materialId`):
```json
{
  "itemName": "meuble TV",
  "quantity": 1,
  "unitPrice": 75000,
  "paymentMethod": "CASH",
  "paymentStatus": "PAID",
  "invoiceNumber": "VNT-2026-015",
  "notes": "Vente directe exposition"
}
```

### Update Sale
- **PUT** `/transactions/sale/:id`
- Body: `{ personId?, paymentMethod?, paymentStatus?, invoiceNumber?, notes?, saleDate?, unitPrice?/montant? }`
- Updates sale metadata and optional item pricing
- Si `saleDate` est fourni: les `StockMovement` lies a la vente sont redates, et l'ecriture comptable auto (`source=SALE`) est resynchronisee si elle existe
- Validation metier: la date cible doit appartenir a un exercice comptable ouvert pour conserver la synchronisation
- Response: Updated sale object

### Delete Sale
- **DELETE** `/transactions/sale/:id`
- Reverts SALE_OUT stock impact, removes related stock movements, then deletes sale
- Response: 204 No Content

### Create Loan
- **POST** `/transactions/loan`
- Body: `{ personId, expectedReturnAt, notes?, items: [{ materialId, quantity }] }`
- Constraint: Max 3 books per loan, only BOOK type materials
- Creates Loan record + LoanItems + StockMovements (LOAN_OUT) + updates Material stock
- Response: Created loan object with items

### Update Loan
- **PUT** `/transactions/loan/:id`
- Body: `{ personId?, expectedReturnAt?, notes? }`
- Updates loan metadata
- Response: Updated loan object

### Delete Loan
- **DELETE** `/transactions/loan/:id`
- If ACTIVE/OVERDUE: restores stock for loaned items, removes LOAN/RETURN stock movements, then deletes loan
- Response: 204 No Content

### Return Loan
- **POST** `/transactions/return`
- Body: `{ loanId, notes? }`
- Updates Loan status to RETURNED + creates StockMovements (RETURN_IN) + restores Material stock
- Response: Updated loan object

### Get All Donations
- **GET** `/transactions/donations`
- Query params:
  - `?donorId=<id>` — filter by donor
  - `?kind=FINANCIAL|MATERIAL` — filter by donation type
  - `?from=<YYYY-MM-DD>&to=<YYYY-MM-DD>` — filter by date range
  - `?limit=50&offset=0` — pagination (max 500)
- Response: `{ donations: [...], pagination: { total, limit, offset, hasMore } }`

### Get Single Donation
- **GET** `/transactions/donation/:id`
- Response: Donation object with donor details and items (includes material info for material donations)

### Create Donation
- **POST** `/transactions/donation`
- Body: `{ donorId?, donorName?, donorType?, donationKind, direction?, amount?, paymentMethod?, description?, institution?, items?, donationDate? }`
- For material donations: requires items array
- For material donations: direction is always forced to `OUT`
- For financial donations: requires amount
- `donationDate` (optionnel): date explicite du don (accepte une date anterieure si un exercice comptable ouvert couvre cette date pour les dons financiers entrants)
- Financial donations (direction `IN`) create synchronized accounting journal entries (source `DONATION_FINANCIAL`, `journalType=DONATION`)
- Response: Created donation object

### Update Donation
- **PUT** `/transactions/donation/:id`
- Body: `{ donorId?, donorName?, donorType?, paymentMethod?, donationDate?, description?, institution?, amount? }`
- Updates donation metadata
- Si `donationDate` est fourni: les mouvements matieres lies au don sont redates; pour un don financier entrant, l'ecriture comptable auto (`source=DONATION_FINANCIAL`) est resynchronisee
- Validation metier: la date cible doit appartenir a un exercice comptable ouvert quand une synchronisation comptable est attendue
- Response: Updated donation object

### Audit Donation Sync
- **GET** `/transactions/donation/:id/audit`
- Retourne en une réponse:
  - le don (avec donateur + items)
  - le statut de synchronisation donateur (`sync.donor`)
  - le statut de synchronisation comptable (`sync.accounting`)
- Règle comptable: `sync.accounting.expected=true` seulement pour un don financier entrant (`FINANCIAL` + `IN`)

### Delete Donation
- **DELETE** `/transactions/donation/:id`
- For material donations: reverts stock impact before deletion, then removes related stock movements
- Response: 204 No Content

### Enum tolerance (transactions)
- `paymentMethod`, `paymentStatus`, `donationKind`, `direction`, `donorType` accept uppercase values and common lowercase/FR aliases (e.g. `cash`/`espece`, `materiel`, `moral`, `physique`)

### Stock Adjustment
- **POST** `/transactions/adjustment`
- Body: `{ materialId, quantityDelta, description?, reference? }`
- Creates StockMovement (ADJUSTMENT) + updates Material stock
- Response: Created stock movement object

---

## 6. ACCOUNTING

### Get Fiscal Years
- **GET** `/accounting/fiscal-years`
- Response: Array of fiscal year objects with id, name, startDate, endDate, isClosed
- **Status**: ✅ **Production Ready** (Render + Local)
- Example:
```json
[{
  "id": "f21982f8-d776-43c0-a2b2-c4a8a2fda8d2",
  "name": "FY 2026",
  "startDate": "2026-01-01T00:00:00.000Z",
  "endDate": "2026-12-31T00:00:00.000Z",
  "isClosed": false
}]
```

### Get All Accounts
- **GET** `/accounting/accounts`
- Response: Array of 901 SYSCOHADA accounts with id, accountNumber, name, type
- **Status**: ✅ **Production Ready** (Render + Local)
- Filter: Only active accounts (`isActive: true`)
- Example:
```json
[
  {"id": "5775c8f1-5a89-41bc-9e30-43ebdef32fb5", "accountNumber": "57", "name": "CAISSE", "type": "ASSET"},
  {"id": "85307468-040f-4e5f-818a-e216c028873a", "accountNumber": "701", "name": "Ventes de livres", "type": "REVENUE"}
]
```

### Get Journal Entries
- **GET** `/accounting/entries`
- Response: Array of journal entries with lines

### Get Journal Entry by ID
- **GET** `/accounting/entries/:id`
- Response: Journal entry with lines

### Create Journal Entry
- **POST** `/accounting/entries`
- Body: `{ fiscalYearId, date, journalType, businessLabel|description, pieceNumber?, sync?: { sourceType?, identifier? }, sourceType?, sourceId?, lines: [{ account, debit?, credit?, description? }] }`
- Separation claire des donnees:
  - `businessLabel` (ou `description`) = libelle metier de l'ecriture
  - `sync.identifier` (ou `sourceId`) = identifiant technique de synchronisation
  - `sync.sourceType` (ou `sourceType`) = type de source technique
- **Status**: ✅ **Production Ready** (Testé Render: Entry FY 2026-00031 créée avec succès)
- **Champ unifié `account`**: Accepte automatiquement soit un UUID soit un numéro de compte (ex: "57", "521")
  - Détection UUID: Si le format correspond à un UUID, recherche directe par ID
  - Détection numéro: Sinon, recherche par numéro de compte
  - Rétrocompatibilité: Les champs `accountId` et `accountNumber` restent supportés
  - **Validation Production**: `"account": "57"` → résolu en `5775c8f1-5a89-41bc-9e30-43ebdef32fb5` ✅
- **journalType** valeurs possibles: `GENERAL`, `CASH`, `PURCHASE`, `SALES`, `DONATION`, `BANK`
- Validation: Debit total must equal credit total, min 2 lines
- **Contrepartie automatique**: **NON** sur cet endpoint.
  - Le backend **ne complete pas** automatiquement une ligne manquante.
  - Chaque ligne doit fournir explicitement `debit` et `credit` (un seul > 0 par ligne).
  - L'ecriture est refusee si `lines.length < 2` ou si `sum(debit) !== sum(credit)`.
- Response: Created journal entry

**Comptes disponibles:**
- **901 comptes SYSCOHADA** pré-chargés en base de données
- **Distribution par type:**
  - ASSET: 385 comptes
  - LIABILITY: 2 comptes
  - EQUITY: 149 comptes
  - REVENUE: 110 comptes
  - EXPENSE: 199 comptes
  - CONTINGENT: 56 comptes
- **Vérification:** `GET /accounting/accounts/resolve?accountNumber=<number>`

**Exemples:**
```json
// Avec numéros de compte (Production Tested ✅)
{
  "fiscalYearId": "f21982f8-d776-43c0-a2b2-c4a8a2fda8d2",
  "date": "2026-02-24",
  "journalType": "GENERAL",
  "description": "Test production Render",
  "lines": [
    { "account": "57", "debit": 5000, "credit": 0, "description": "Caisse" },
    { "account": "701", "debit": 0, "credit": 5000, "description": "Ventes" }
  ]
}

// Avec UUIDs directs
{
  "fiscalYearId": "f21982f8-d776-43c0-a2b2-c4a8a2fda8d2",
  "date": "2026-02-24",
  "journalType": "GENERAL",
  "description": "Écriture mixte",
  "lines": [
    { "account": "5775c8f1-5a89-41bc-9e30-43ebdef32fb5", "debit": 10000, "credit": 0 },
    { "account": "701", "debit": 0, "credit": 10000 }
  ]
}
```

**Workflow complet:**
1. `GET /accounting/fiscal-years` → Récupérer le `fiscalYearId`
2. `GET /accounting/accounts` → (Optionnel) Lister les comptes disponibles
3. `POST /accounting/entries` → Créer une écriture avec numéros de compte ou UUID

### Import Excel Paste (1 ligne = 1 ecriture)
- **POST** `/accounting/entries/import-paste`
- Objectif: recevoir un tableau colle depuis Excel, le transformer en JSON, puis creer une ecriture par ligne.
- Body:
```json
{
  "fiscalYearId": "f21982f8-d776-43c0-a2b2-c4a8a2fda8d2",
  "pastedData": "Date\tLibelle\tCompte Debit\tCompte Credit\tMontant\n2026-02-28\tVente comptoir\t57\t701\t25000",
  "defaultJournalType": "GENERAL",
  "defaultSourceType": "OTHER"
}
```
- Alternative: envoyer directement `rows` (JSON) au lieu de `pastedData`.
- Colonnes supportees (insensibles aux accents/casse):
  - Date: `date`, `jour`, `date operation`
  - Libelle: `description`, `libelle`, `motif`
  - Piece: `pieceNumber`, `piece`, `numero piece` (optionnel)
  - Journal: `journalType`, `journal` (optionnel, sinon `defaultJournalType` ou `GENERAL`)
  - Compte debit: `debitAccount`, `compte debit`
  - Compte credit: `creditAccount`, `compte credit`
  - Montant: `amount`, `montant`, `valeur`
  - Source (optionnel): `sourceType`, `sourceId`
- Regles:
  - Chaque ligne doit contenir une date, un libelle, un compte debit, un compte credit, un montant > 0.
  - Delimiteurs supportes pour `pastedData`: tabulation, `;`, `,`.
  - Priorite payload: si `rows` est present, le backend ignore `pastedData`.
  - Le backend cree automatiquement 2 lignes comptables par ligne importee (debit/credit, meme montant).
  - Doublons pris en charge en mode upsert/update: si une ecriture equivalente existe deja (meme date, journal, piece, description, source, comptes debit/credit et montant), elle est mise a jour.
  - Une ecriture equivalente deja validee n'est pas modifiable: la ligne est refusee et remontee dans `lineErrors`.
  - `fiscalYearId` doit exister et ne pas etre ferme.
  - Traitement: par lots (batch) avec succes partiel (pas de rollback global).
- Response:
```json
{
  "receivedRows": 1,
  "jsonRows": [
    {
      "Date": "2026-02-28",
      "Libelle": "Vente comptoir",
      "Compte Debit": "57",
      "Compte Credit": "701",
      "Montant": "25000"
    }
  ],
  "createdCount": 1,
  "updatedCount": 0,
  "failedCount": 0,
  "errors": [],
  "lineErrors": [],
  "processedCount": 1,
  "createdEntries": [
    {
      "id": "uuid",
      "entryNumber": "FY 2026-00032",
      "rowNumber": 1,
      "operation": "created"
    }
  ]
}
```

### Update Journal Entry
- **PUT** `/accounting/entries/:id`
- Body: Any updatable fields from create payload (`fiscalYearId`, `date`, `journalType`, `businessLabel|description`, `pieceNumber`, `sync`, `sourceType`, `sourceId`, `lines`)
- **Note**: Les lignes utilisent le champ unifié `account` (UUID ou numéro) - rétrocompatible avec `accountId` et `accountNumber`
- Validation: Cannot update validated entries; if `lines` are provided, debit total must equal credit total and min 2 lines
- **Contrepartie automatique**: **NON** sur cet endpoint (mêmes règles strictes que la création).
- Response: Updated journal entry

### Structure de reponse comptable (entries)
- Les endpoints `GET/POST/PUT /accounting/entries...` exposent maintenant en plus:
  - `businessLabel` (miroir de `description`)
  - `sync: { sourceType, identifier }` (miroir de `sourceType/sourceId`)
- Compatibilite conservee: `description`, `sourceType`, `sourceId` restent presentes.

### Validate Journal Entry
- **PUT** `/accounting/entries/:id/validate`
- Marks entry as validated (can only delete unvalidated entries)
- Response: Updated entry

### Delete Journal Entry
- **DELETE** `/accounting/entries/:id`
- Only unvalidated entries can be deleted
- Logs to DeletedItem for audit trail
- Response: 204 No Content

### Get Trial Balance
- **GET** `/accounting/trial-balance?fiscalYearId=<id>`
- Response: Array of accounts with total debits and credits

### Get Account Balances
- **GET** `/accounting/account-balances?fiscalYearId=<id>`
- Response: Array of accounts with calculated balances

### Get General Ledger (for an account)
- **GET** `/accounting/general-ledger?accountId=<id>&fiscalYearId=<id>`
- Response: Account detail with running balance for each transaction

### Resolve Account by Number
- **GET** `/accounting/accounts/resolve?accountNumber=<number>`
- Converts account number (e.g., "57", "521") to account UUID with details
- Response: `{ id, accountNumber, name, type }`
- Example: `/accounting/accounts/resolve?accountNumber=57`

### Account Reference - 901 SYSCOHADA Accounts (Verified)
**All 901 SYSCOHADA accounts are pre-loaded and available for use.**

**Status: ✅ VERIFIED - All accounts present and resolvable**

**Available Account Types:**
- **ASSET** (Classes 1-5): 385 comptes
  - 101-109: Fixed Assets
  - 201-209: Capital & Equity
  - 301-309: Inventory
  - 521-529: Bank/Cash accounts
  - etc.
  
- **LIABILITY** (Class 2): 2 comptes
  - Short and long-term liabilities
  
- **EQUITY** (Class 2-3): 149 comptes
  - Capital accounts, retained earnings
  
- **REVENUE** (Class 7): 110 comptes
  - Sales, service income, donations
  - Examples: 701 (Ventes de livres), 702 (Ventes de matieres)
  
- **EXPENSE** (Class 6): 199 comptes
  - Cost of goods sold, operating expenses
  - Examples: 601 (Achats de livres), 602 (Transport)
  
- **CONTINGENT** (Class 8-9): 56 comptes
  - Contingent assets and liabilities

**Usage Examples:**
```
Account 57 (Caisse): Cash account
Account 521 (Banque): Bank account
Account 701 (Ventes de livres): Revenue from book sales
Account 601 (Achats de livres): Cost of book purchases
Account 103 (Immobilisations corporelles): Tangible assets
```

**Verification Endpoint:**
- Check if an account exists: `GET /accounting/accounts/resolve?accountNumber=57`
- Lists all available accounts with metadata (auto-populated at database initialization)

### Get Balance Sheet
- **GET** `/accounting/balance-sheet?fiscalYearId=<id>`
- Response: Assets, Liabilities, Equity with totals

### Get Income Statement
- **GET** `/accounting/income-statement?fiscalYearId=<id>`
- Response: Revenues, Expenses with net income

### Get Cash Journal
- **GET** `/accounting/cash-journal?fiscalYearId=<id>`
- Response: All cash journal entries (JOURNAL_TYPE in `CASH`, `PURCHASE`, `SALES`)
- Notes: financial donations use `journalType=DONATION` and are not included here
- **Important**:
  - Ce endpoint est un **journal de consultation** (lecture), il ne génère aucune contrepartie.
  - Les écritures visibles ici sont créées soit manuellement via `/accounting/entries`, soit automatiquement via certains flux métiers.

### Règle Contrepartie (important)
- **Manuelle (pas auto)**: `/accounting/entries` et `/accounting/entries/:id`
- **Automatique (générée par le backend)**: `/transactions/purchase`, `/transactions/sale`, `/transactions/donation` (financier entrant `direction=IN`)

### Exemples validation (front)

**Valide (201 Created)**
```json
{
  "fiscalYearId": "f21982f8-d776-43c0-a2b2-c4a8a2fda8d2",
  "date": "2026-02-24",
  "journalType": "CASH",
  "description": "Encaissement vente",
  "lines": [
    { "account": "57", "debit": 15000, "credit": 0 },
    { "account": "701", "debit": 0, "credit": 15000 }
  ]
}
```

**Invalide 1 (400 Bad Request: moins de 2 lignes)**
```json
{
  "fiscalYearId": "f21982f8-d776-43c0-a2b2-c4a8a2fda8d2",
  "date": "2026-02-24",
  "journalType": "GENERAL",
  "description": "Ecriture incomplète",
  "lines": [
    { "account": "57", "debit": 15000, "credit": 0 }
  ]
}
```
Erreur attendue (`message`):
```json
{ "message": "Une ecriture doit contenir au moins 2 lignes (partie double). Une seule ligne a ete envoyee." }
```

**Invalide 2 (400 Bad Request: écriture non équilibrée)**
```json
{
  "fiscalYearId": "f21982f8-d776-43c0-a2b2-c4a8a2fda8d2",
  "date": "2026-02-24",
  "journalType": "GENERAL",
  "description": "Ecriture non equilibree",
  "lines": [
    { "account": "57", "debit": 10000, "credit": 0 },
    { "account": "701", "debit": 0, "credit": 9000 }
  ]
}
```
Erreur attendue (`message`):
```json
{ "message": "Le total debit doit etre egal au total credit." }
```

### Etats comptables (pour le front)
- **Compte de resultat**: `GET /accounting/income-statement?fiscalYearId=<id>`
- **Bilan**: `GET /accounting/balance-sheet?fiscalYearId=<id>`
- **Balance**: `GET /accounting/trial-balance?fiscalYearId=<id>`
- **Grand livre**: `GET /accounting/general-ledger?accountId=<id>&fiscalYearId=<id>`
- Notes:
  - Tous ces endpoints filtrent par `fiscalYearId`.
  - Seules les ecritures `isValidated=true` sont prises en compte.
- Exemples (a titre indicatif):
  - `GET /accounting/income-statement?fiscalYearId=fy_2025`
  - `GET /accounting/balance-sheet?fiscalYearId=fy_2025`
  - `GET /accounting/trial-balance?fiscalYearId=fy_2025`
  - `GET /accounting/general-ledger?accountId=acc_101&fiscalYearId=fy_2025`

### Export Excel (implémenté)
- **GET** `/accounting/export/excel?section=<type>&fiscalYearId=<id>&accountId=<id>`
- Retourne un fichier `.xlsx` téléchargeable
- `section` possibles:
  - `all` (défaut): journal comptable + journal caisse + donateurs + grand livre + bilan + balance + compte de résultat
  - `journal`
  - `cash-journal`
  - `donors`
  - `general-ledger`
  - `balance-sheet`
  - `trial-balance`
  - `income-statement`
- Règles paramètres:
  - `fiscalYearId` obligatoire pour: `all`, `general-ledger`, `balance-sheet`, `trial-balance`, `income-statement`
  - `accountId` optionnel pour `general-ledger` (si absent: export global de toutes les lignes du grand livre)

### Alias Module Comptabilite (meme endpoints)
- Base alias: `/comptabilite`
- Exemples:
  - **PUT** `/comptabilite/entries/:id` (modifier une ecriture)
  - **DELETE** `/comptabilite/entries/:id` (supprimer une ecriture non validee)
  - **GET** `/comptabilite/trial-balance?fiscalYearId=<id>`
- Notes: cet alias pointe sur la meme logique que `/accounting`.

---

## 7. REPORTS

### Dashboard Overview (optimisé)
- **GET** `/reports/dashboard/overview?from=<YYYY-MM-DD>&to=<YYYY-MM-DD>&fiscalYearId=<id>`
- Retourne des KPI agrégés et légers pour le tableau de bord (transactions, montants, stock, personnes, comptabilité, tops)
- Par défaut, la période est les 30 derniers jours si `from/to` ne sont pas fournis

### Dashboard Activity Feed (optimisé)
- **GET** `/reports/dashboard/activity?limit=20`
- Retourne un flux d’évènements récents fusionnés (vente, achat, don, emprunt) avec payload minimal
- Limite bornée côté serveur pour éviter les charges trop lourdes

### Dashboard Stock Alerts (optimisé)
- **GET** `/reports/dashboard/stock-alerts?limit=10`
- Retourne uniquement les articles en alerte de stock (LOW/OUT) avec un payload compact

### Daily Report
- **GET** `/reports/daily?date=<YYYY-MM-DD>`
- Shows all transactions for a specific date (defaults to today)
- Response: Sales, purchases, donations, loans, returns counts + details

### Alias Module Rapport (meme endpoints)
- **GET** `/rapport/dashboard/overview?from=<YYYY-MM-DD>&to=<YYYY-MM-DD>&fiscalYearId=<id>`
- **GET** `/rapport/dashboard/activity?limit=20`
- **GET** `/rapport/dashboard/stock-alerts?limit=10`
- **GET** `/rapport/daily?date=<YYYY-MM-DD>`
- **GET** `/rapport/donors`
- **GET** `/rapport/most-borrowed?limit=10`
- **GET** `/rapport/inventory`
- Notes: cet alias pointe sur la meme logique que `/reports`.

### Donors Report
- **GET** `/reports/donors`
- Response: List of donors sorted by number of donations
- Includes: total donations, financial total, material total, last donation date

### Most Borrowed Materials
- **GET** `/reports/most-borrowed?limit=10`
- Response: Top N most borrowed materials with statistics

### Inventory Report
- **GET** `/reports/inventory`
- Response: Inventory summary (by type, total, low stock, out of stock) + item details

### Mapping Frontend Dashboard (recommandé)
- Objectif: charger le tableau de bord rapidement avec 3 appels légers en parallèle.

#### 1) Appels à lancer en parallèle
- `GET /reports/dashboard/overview?from=<YYYY-MM-DD>&to=<YYYY-MM-DD>&fiscalYearId=<id>`
- `GET /reports/dashboard/activity?limit=20`
- `GET /reports/dashboard/stock-alerts?limit=10`

#### 2) Mapping UI conseillé
- Cartes KPI:
  - `overview.kpis.transactions.salesCount`
  - `overview.kpis.transactions.purchasesCount`
  - `overview.kpis.transactions.donationsCount`
  - `overview.kpis.amounts.salesRevenue`
  - `overview.kpis.amounts.purchasesCost`
  - `overview.kpis.amounts.financialDonationsIn`
  - `overview.kpis.inventory.lowStockCount`
  - `overview.kpis.inventory.outOfStockCount`
  - `overview.kpis.accounting.validatedEntries`
  - `overview.kpis.accounting.unvalidatedEntries`
- Top listes:
  - `overview.top.mostBorrowed`
  - `overview.top.donorsFinancial`
- Fil activité récente:
  - `activity.events` (types: `SALE`, `PURCHASE`, `DONATION`, `LOAN`)
- Alertes stock:
  - `stockAlerts.alerts` (severity: `LOW` | `OUT`)

#### 3) Stratégie de performance côté front
- Lancer les 3 appels en `Promise.all`.
- Afficher les KPI dès que `overview` est reçu (les autres widgets peuvent arriver ensuite).
- Rafraîchissement recommandé:
  - `overview`: toutes les 30 à 60 secondes
  - `activity`: toutes les 15 à 30 secondes
  - `stock-alerts`: toutes les 60 à 120 secondes

#### 4) Fallback si un appel échoue
- Si `activity` échoue: garder KPI + stock alerts.
- Si `stock-alerts` échoue: garder KPI + activity.
- Si `overview` échoue: afficher un état vide du dashboard + message d’erreur principal.

---

## 8. DELETED ITEMS (Corbeille) - Protected

Toutes les routes de cette section exigent:
```
Authorization: Bearer <refreshToken>
```

### List Deleted Items
- **GET** `/deleted-items`
- Query params:
  - `includeRestored=true|false` (default: `false`)
  - `includeExpired=true|false` (default: `false`)
  - `table=<originalTable>` (ex: `Person`, `Material`, `JournalEntry`)
  - `limit=<1..500>` (default: `100`)
- Response: Array of DeletedItem records

### Restore Deleted Item
- **POST** `/deleted-items/:id/restore`
- Restores supported records:
  - `Person` (annule le soft delete)
  - `Material` (annule le soft delete)
  - `JournalEntry` (recreation de l'ecriture + lignes)
- Constraints:
  - Fails if item already restored
  - Fails if item is expired (delai depasse)
- Response: Updated DeletedItem (with `restoredAt`, `restoredById`)

### Delete One Deleted Item (hard delete in audit table)
- **DELETE** `/deleted-items/:id`
- Removes one record from `DeletedItem`
- Response: 204 No Content

### Purge Expired Deleted Items
- **DELETE** `/deleted-items/purge-expired`
- Removes all `DeletedItem` with `expiresAt <= now`
- Response: `{ deletedCount }`

### Purge Recent Deleted Items (bulk with where)
- **DELETE** `/deleted-items/purge-recent`
- Removes `DeletedItem` created recently using explicit `where` filters.
- Query params:
  - `days=<1..365>` (default: `7`) → window on `deletedAt`
  - `table=<originalTable>` (optional)
  - `onlyNotRestored=true|false` (default: `true`)
- Where applied:
  - `deletedAt: { gte: cutoff, lte: now }`
  - `originalTable = table` (if provided)
  - `restoredAt = null` (if `onlyNotRestored=true`)
- Response: `{ deletedCount, days, table, onlyNotRestored, range: { from, to } }`

### Alias Module Corbeille (meme endpoints)
- **GET** `/corbeille`
- **POST** `/corbeille/:id/restore`
- **DELETE** `/corbeille/:id`
- **DELETE** `/corbeille/purge-expired`
- **DELETE** `/corbeille/purge-recent`

---

## Error Handling

All endpoints return error responses in this format:
```json
{
  "message": "Error description"
}
```

Common HTTP status codes:
- `200`: OK
- `201`: Created
- `204`: No Content (successful delete)
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required/failed)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (e.g., duplicate email)
- `500`: Internal Server Error
- `501`: Not Implemented

---

## Authentication

Protected endpoints require the `Authorization` header:
```
Authorization: Bearer <refreshToken>
```

The refresh token is obtained from login/register endpoints.

---

## Sync API (Server-side)

Base path: `/offline-sync`

### Synchroniser un lot client -> serveur
- **POST** `/offline-sync/sync`
- Body:
```json
{
  "items": [
    {
      "clientId": "task-mobile-001",
      "title": "Ma tache",
      "payload": { "x": 1 },
      "clientUpdatedAt": "2026-03-01T12:00:00.000Z",
      "baseVersion": 1,
      "deleted": false
    }
  ]
}
```
- Validation serveur: version + timestamp
- Détection conflit: retour `409` avec `serverTask`
- Sauvegarde: base distante (PostgreSQL via Prisma)
- Réponse: version serveur à jour par item

### Synchroniser un item client -> serveur
- **POST** `/offline-sync/task/sync`
- Même contrat que le batch, pour un seul enregistrement

### Récupérer l'état serveur actuel d'un item
- **GET** `/offline-sync/task/:clientId`

### Récupérer les changements depuis `last_sync`
- **GET** `/offline-sync/changes?since=<ISO_TIMESTAMP>&limit=500`
- Retourne uniquement les éléments modifiés côté serveur depuis `since`
- Le champ `serverNow` sert de nouveau `last_sync` côté client

### Variables d'environnement
- `SYNC_CHANGES_MAX_LIMIT` (défaut `500`)

---

## Key Business Rules

1. **Loans**: Max 3 books per loan, only BOOK type materials
2. **Stock**: All stock movements are tracked in `StockMovement` table
3. **Accounting**: Journal entries must be balanced (debit = credit)
4. **Soft Delete**: All deletions use soft delete with 30-day retention
5. **Fiscal Year**: Must not be closed to accept new entries
6. **Role-Based Access**: (Not implemented yet, can be added to auth middleware)
7. **Comptabilite sync**: Transactions `purchase`, `sale`, and financial donations (`direction=IN`) generate accounting entries automatically
8. **Etats comptables**: Trial balance, account balances, bilan, compte de resultat, grand livre are built progressively from validated entries

---

## Data Models Summary

- **User**: Authentication + profile
- **Person**: Persons (visitors, borrowers, buyers, donors, suppliers)
- **Material**: Inventory items
- **StockMovement**: All stock transactions audit trail
- **Loan/LoanItem**: Book borrowing with return tracking
- **Sale/SaleItem**: Sales transactions
- **Purchase/PurchaseItem**: Purchase transactions
- **Donation/DonationItem**: Material and financial donations
- **JournalEntry/JournalLine**: Accounting double-entry records
- **Account**: Chart of accounts
- **FiscalYear**: Accounting periods
- **Session**: User authentication sessions
- **DeletedItem**: Soft-deleted items audit trail

---

Generated: February 19, 2026
