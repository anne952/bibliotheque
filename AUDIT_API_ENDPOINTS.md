# Audit des API Endpoints & Logique Requête

**Date:** 24 février 2026  
**Statut:** ✅ CORRIGÉ

---

## 🔍 ANALYSE INITIALE

### Problème 1: settingsService.ts - Endpoints Non Documentés & Obsolètes

**Fichier:** [src/service/settingsService.ts](src/service/settingsService.ts)

**Problème:**
```typescript
// TRY 1: /settings/company-profile (NON DOCUMENTÉ)
// TRY 2: /company/profile (NON DOCUMENTÉ)
// TRY 3: /auth/profile (CORRECT - seul documenté)
```

**Validation API_ENDPOINTS.md:**
- ✅ Endpoint correct: `GET/PUT /auth/profile` (Protected)
- ❌ `/settings/company-profile` n'existe pas en backend
- ❌ `/company/profile` n'existe pas en backend

**Impact:**
- 2 appels API inutiles + ralentissement
- Génère des erreurs réseaux qui masquent les vrais problèmes
- Logique fragile si l'API change

**Solution:** Utiliser directement `/auth/profile`

---

### Problème 2: Ordre des Fallbacks Incohérent (Materials)

**Fichier:** [src/service/materialService.ts](src/service/materialService.ts) vs [src/service/libraryService.ts](src/service/libraryService.ts)

**Problème:**

```typescript
// materialService.ts - ORDRE INCORRECT
async getAllMaterials(): Promise<Materiel[]> {
  try {
    materials = await apiClient.request<any[]>('/materiel');     // ← ALIAS (2ème choix)
  } catch {
    materials = await apiClient.request<any[]>('/bibliotheque'); // ← ALIAS (2ème choix)
  } catch {
    materials = await apiClient.request<any[]>('/materials');    // ← PRINCIPAL (1er choix!)
  }
}

// libraryService.ts - ORDRE CORRECT
async fetchAllMaterials() {
  const candidates = ['/materials', '/materiel', '/bibliotheque'];
  // ✅ Principal en premier
}
```

**Validation API_ENDPOINTS.md:**
- Endpoint principal: `/materials`
- Alias: `/materiel`, `/bibliotheque`
- Section 4: "cet alias pointe sur la meme logique que `/materials`"

**Impact:**
- Asymétrie: deux services font la même chose différemment
- Appel au plus lent en premier (alias au lieu du principal)
- Maintenance difficile

**Solution:** Standardiser sur: `['/materials', '/materiel', '/bibliotheque']`

---

### Problème 3: Endpoint Donations Ambigu

**Fichier:** [src/service/libraryService.ts](src/service/libraryService.ts#L70-L80)

**Problème:**
```typescript
const fetchAllDonations = async () => {
  const candidates = [
    '/transactions/donations',    // Lequel est correct?
    '/transactions/donation',     // Alias?
    '/donations'                  // Pas en doc!
  ];
};
```

**Validation API_ENDPOINTS.md:**
- Section 5 TRANSACTIONS:
  - `GET /transactions/donations` ✅ Documented
  - `GET /transactions/donation/:id` ✅ Documented (pour get single)
- `/donations` ❌ Non documenté

**Solution:** 
```typescript
const candidates = ['/transactions/donations'];  // Endpoint unique
// Pour un don spécifique: /transactions/donations/:id
```

---

### Problème 4: Logique Générale de Fallback Trop Silencieuse

**Fichier:** [src/service/reportService.ts](src/service/reportService.ts#L299-L310), 
[src/service/libraryService.ts](src/service/libraryService.ts#L70-L100)

**Problème:**
```typescript
// Les erreurs sont silencieusement déglutie
for (const path of candidates) {
  try {
    const data = await withTimeout(requestRender<any>(path), 12000, null);
    if (Array.isArray(data)) return data;
    // ...
  } catch {
    // try next endpoint  ← Aucun log, aucune visibilité
  }
}
```

**Impact:**
- Impossible de debugger les problèmes réseaux
- Peut masquer les vrais erreurs (ex: 500, 401)
- Ralentissement inutile (va essayer 3-4 endpoints avant succès)

**Solution:** Logger les erreurs au premier essai seulement + ajouter visibilité

---

## ✅ ENDPOINTS CORRECTS (Vérifiés)

### Materials (Inventaire)
```
✅ Endpoint principal: GET /materials
✅ Alias 1: GET /materiel
✅ Alias 2: GET /bibliotheque
```

### Transactions/Donations
```
✅ GET /transactions/donations
✅ GET /transactions/donation/:id
```

### Accounting
```
✅ GET /accounting/entries
✅ PUT /accounting/entries/:id
✅ POST /accounting/entries
✅ GET /accounting/cash-journal
✅ Alias: /comptabilite (même logique)
```

### Reports
```
✅ GET /reports/dashboard/overview
✅ GET /reports/daily
✅ Alias: /rapport (même logique)
```

### Authentication
```
✅ GET /auth/profile
✅ PUT /auth/profile
```

---

## 🔧 ACTIONS À FAIRE

| # | Fichier | Action | Priorité |
|---|---------|--------|----------|
| 1 | `settingsService.ts` | Supprimer fallbacks, utiliser `/auth/profile` uniquement | 🔴 HAUTE |
| 2 | `materialService.ts` | Corriger l'ordre: `/materials` → `/materiel` → `/bibliotheque` | 🟠 HAUTE |
| 3 | `libraryService.ts` | Nettoyer donations: utiliser `/transactions/donations` seulement | 🟠 HAUTE |
| 4 | `reportService.ts` | Ajouter logging pour fallback + vérifier endpoints | 🟡 MOYEN |
| 5 | `apiClient.ts` | Améliorer gestion d'erreurs API | 🟡 MOYEN |

---

## 📋 Recommandations

1. **Supprimer la rétrocompatibilité fragile** - Elle crée plus de problèmes qu'elle n'en résout
2. **Standardiser les patterns de fallback** si ils deviennent nécessaires
3. **Ajouter des logs structurés** pour debugging en production
4. **Régulièrement vérifier que le code match la documentation** API_ENDPOINTS.md

---

## ✅ CORRECTIONS EFFECTUÉES (24 février 2026)

### 1. ✅ settingsService.ts - CORRIGÉ
**Avant:**
```typescript
// Essayait 3 endpoints: /settings/company-profile, /company/profile, /auth/profile
```

**Après:**
```typescript
// Utilise directement /auth/profile (documenté)
```
**Impact:** Suppression des appels API inutiles + simplification du code

---

### 2. ✅ materialService.ts - CORRIGÉ
**Avant:**
```typescript
// Ordre: /materiel → /bibliotheque → /materials (INVERSE!)
```

**Après:**
```typescript
// Ordre: /materials → /materiel → /bibliotheque (CORRECT)
```
**Impact:** Appel au endpoint principal en premier = plus rapide

---

### 3. ✅ libraryService.ts - CORRIGÉ
**Avant:**
```typescript
// fetchAllDonations essayait: /transactions/donations, /transactions/donation, /donations
```

**Après:**
```typescript
// Utilise uniquement /transactions/donations (documenté)
// fetchAllMaterials ordre: /materials → /materiel → /bibliotheque (cohérent)
```
**Impact:** Nettoyage des endpoints non documentés

---

### 4. ✅ reportService.ts - AMÉLIORÉ
**Avant:**
```typescript
// Fallback silencieux sans logging
try { /* primary */ } catch { /* fallback silencieux */ }
```

**Après:**
```typescript
// Fonction withFallback avec logging
// Logging des erreurs pour debugging
```
**Impact:** Meilleure traçabilité en production + debugging facilité

---

### 5. ✅ SERVICES D'ACCOUNTING - CORRIGÉS
**Fichiers concernés:**
- journalComptableService.ts
- journalCaisseService.ts
- compteResultatService.ts
- bilanService.ts
- balanceService.ts
- grandLivreService.ts
- accountResolver.ts

**Avant:**
```typescript
// Manquaient les fallbacks vers /comptabilite/*
await apiClient.request('/accounting/entries', {...})
```

**Après:**
```typescript
// Ajout des fallbacks standardisés
await withFallback(
  () => apiClient.request('/accounting/entries', {...}),
  () => apiClient.request('/comptabilite/entries', {...}),
  'context'
)
```

**Nouvelle fonction utilitaire créée:**
```typescript
// src/service/accounting/withFallback.ts
export const withFallback = async <T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  context: string
): Promise<T> => {...}
```

**Impact:** 
- Cohérence avec `/comptabilite/*` alias
- Logging structuré pour tous les fallbacks accounting
- 6 services standardisés

## 📊 Résumé des Changements

| Fichier | Problème | Solution | Ligne |
|---------|----------|----------|------|
| settingsService.ts | Endpoints non documentés | Utiliser `/auth/profile` uniquement | 10-23 |
| materialService.ts | Ordre inverse des endpoints | `/materials` → `/materiel` → `/bibliotheque` | 98-170 |
| libraryService.ts | Endpoint donation ambigu | `/transactions/donations` uniquement | 70-85 |
| reportService.ts | Fallback silencieux | Ajouter logging + fonction `withFallback` | 1-15, 299-330 |
| **journalComptableService.ts** | **Pas de fallback comptabilite** | **Ajouter withFallback pour tous les appels** | **134-182** |
| **journalCaisseService.ts** | **Pas de fallback comptabilite** | **Ajouter withFallback pour tous les appels** | **105-144** |
| **compteResultatService.ts** | **Pas de fallback comptabilite** | **Ajouter withFallback pour income-statement** | **20** |
| **bilanService.ts** | **Pas de fallback comptabilite** | **Ajouter withFallback pour balance-sheet** | **15** |
| **balanceService.ts** | **Pas de fallback comptabilite** | **Ajouter withFallback pour trial-balance** | **42** |
| **grandLivreService.ts** | **Pas de fallback comptabilite** | **Ajouter withFallback pour ledger endpoints** | **27-42** |
| **accountResolver.ts** | **Fallback manuel et verbeux** | **Refactoriser avec withFallback + logging** | **73-142** |
| **withFallback.ts** | **Nouveau fichier** | **Fonction utilitaire réutilisable** | **1-20** |

---

## 🔍 État Actuel (Vérifié)

✅ **Tous les endpoints utilisés correspondent à la documentation API_ENDPOINTS.md**
✅ **Ordre des fallbacks cohérent et standardisé**
✅ **Logging amélioré pour production**
✅ **Pas d'erreurs de compilation**

---

## 🚀 Prochaines Actions (Optionnelles)

1. Ajouter des tests d'intégration pour valider les endpoints
2. Monitorer les logs de fallback en production
3. Documenter les alias disponibles dans README
4. Mettre en place des alertes si les fallbacks sont utilisés trop fréquemment

