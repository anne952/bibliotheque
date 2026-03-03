import { useState, useEffect, useCallback } from 'react';
import { journalComptableService } from '../../service/accounting/journalComptableService';
import { calculateTotals, calculateBalance, isBalanced } from '../../utils/accounting/calculators';

/**
 * Hook pour la gestion du journal comptable
 * @param {string} periode - PÃ©riode sÃ©lectionnÃ©e
 * @returns {JournalComptableState & { ajouterEcriture: Function, modifierEcriture: Function, supprimerEcriture: Function, validerEcriture: Function }}
 */
export const useJournalComptable = (periode) => {
  const [ecritures, setEcritures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chargement des Ã©critures
  useEffect(() => {
    const chargerEcritures = async () => {
      try {
        setLoading(true);
        const data = await journalComptableService.getEcritures(periode);
        setEcritures(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    chargerEcritures();
  }, [periode]);

  // Calcul des totaux
  const totals = calculateTotals(ecritures);
  const balance = calculateBalance(totals.debit, totals.credit);
  const balanced = isBalanced(totals.debit, totals.credit);

  // Ajouter une Ã©criture
  const ajouterEcriture = useCallback(async (ecriture) => {
    try {
      const nouvelleEcriture = await journalComptableService.ajouterEcriture(ecriture);
      setEcritures(prev => [...prev, nouvelleEcriture].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
      return nouvelleEcriture;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Modifier une Ã©criture
  const modifierEcriture = useCallback(async (id, ecriture) => {
    try {
      const ecritureModifiee = await journalComptableService.modifierEcriture(id, ecriture);
      setEcritures(prev => prev.map(e => e.id === id ? ecritureModifiee : e));
      return ecritureModifiee;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Supprimer une Ã©criture
  const supprimerEcriture = useCallback(async (id) => {
    try {
      await journalComptableService.supprimerEcriture(id);
      setEcritures(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Valider une Ã©criture
  const validerEcriture = useCallback(async (id) => {
    try {
      const ecritureValidee = await journalComptableService.validerEcriture(id);
      setEcritures(prev => prev.map(e => e.id === id ? ecritureValidee : e));
      return ecritureValidee;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    ecritures,
    loading,
    error,
    totals,
    balance,
    isBalanced: balanced,
    ajouterEcriture,
    modifierEcriture,
    supprimerEcriture,
    validerEcriture
  };
};
