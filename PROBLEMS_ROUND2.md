# 📋 Problèmes API Endpoints - Ronde 2

**Date:** 24 février 2026

## 🔴 Problèmes Identifiés

### 1. Donations - Moks & Routes Ambigus

**Problème identifié:**
- Service `donateursService.ts` utilise `/reports/donors` pour lister
- Mais API_ENDPOINTS.md documenté: `GET /transactions/donations` pour liste
- Endpoint `/reports/donors` n'apparaît pas dans API_ENDPOINTS.md
- Confusion entre `/reports/donors` (rapport) vs `/transactions/donations` (données principales)

**Routes API documentées:**
- ✅ `GET /transactions/donations` - Listerne tous les dons
- ✅ `GET /transactions/donation/:id` - Un don spécifique  
- ✅ `POST /transactions/donation` - Créer un don
- ✅ `PUT /transactions/donation/:id` - Modifier un don
- ✅ `DELETE /transactions/donation/:id` - Supprimer un don
- ❓ `GET /reports/donors` - Non documenté (rapport?)

**À corriger:**
```typescript
// Avant (service récupère depuis /reports/donors)
const data = await apiClient.request('/reports/donors');

// Après (utiliser la route principale)
const data = await apiClient.request('/transactions/donations');
```

---

### 2. Bilan & Compte Résultat Vides

**Problème identifié:**
- Endpoints retournent probablement des données vides
- Causes possibles:
  1. Pas d'écritures comptables validées (`isValidated=true`)
  2. Mauvaise fiscalYearId passée
  3. Le backend requiert des données de base existantes

**Routes documentées:**
- `GET /accounting/balance-sheet?fiscalYearId=<id>` 
- `GET /accounting/income-statement?fiscalYearId=<id>`

**À vérifier:**
1. Y a-t-il une fiscalYearId par défaut?
2. Y a-t-il des écritures comptables validées?
3. Le backend crée-t-il une fiscalYearId par défaut lors de l'init?

---

### 3. Journal Caisse & Journal Comptable

**État actuel:**
- `journalComptableService.ts` récupère de `/accounting/entries`
- `journalCaisseService.ts` récupère de `/accounting/cash-journal`
- Pas de fallbacks vers `/comptabilite/*` (MAINTENANT CORRIGÉ)

**Routes documentées:**
- ✅ `GET /accounting/entries` - Journal comptable général
- ✅ `GET /accounting/cash-journal` - Journal caisse spécifique
- ✅ Alias: `/comptabilite/entries`, `/comptabilite/cash-journal`

**État:**
- ✅ Fallbacks ajoutés
- ✅ Logging structuré
- ⚠️ À tester en production pour vérifier les données

---

## 🎯 Prochaines Actions

1. **Vérifier les Donations:**
   - Remplacer `/reports/donors` par `/transactions/donations` dans donateursService
   - Ajouter fallback `/transactions/donations` ← `/rapport/donations` si alias existe

2. **Vérifier Bilan & Compte Résultat:**
   - Tester avec fiscalYearId valide
   - Vérifier qu'il y a au minimum une fiscalYearId en base
   - Vérifier qu'il y a des écritures validées

3. **Tester en Production:**
   - Journal comptable: appeler `/accounting/entries` avec fiscalYearId
   - Journal caisse: appeler `/accounting/cash-journal` avec fiscalYearId
   - Vérifier les données retournées

