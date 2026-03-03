import { useState, useEffect, useCallback } from 'react';
import { journalCaisseService } from '../../service/accounting/journalCaisseService';

export const useJournalCaisse = () => {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [solde, setSolde] = useState(0);

  useEffect(() => {
    const chargerOperations = async () => {
      try {
        setLoading(true);
        const data = await journalCaisseService.getOperations();
        setOperations(data);
        calculerSolde(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    chargerOperations();
  }, []);

  const calculerSolde = (ops) => {
    const totalEntrees = ops.reduce((sum, op) => sum + (op.entree || 0), 0);
    const totalSorties = ops.reduce((sum, op) => sum + (op.sortie || 0), 0);
    setSolde(totalEntrees - totalSorties);
  };

  const ajouterOperation = useCallback(async (operation) => {
    try {
      const nouvelleOperation = await journalCaisseService.ajouterOperation(operation);
      const nouvelleListe = [...operations, nouvelleOperation];
      setOperations(nouvelleListe);
      calculerSolde(nouvelleListe);
      return nouvelleOperation;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [operations]);

  const supprimerOperation = useCallback(async (id) => {
    try {
      await journalCaisseService.supprimerOperation(id);
      const nouvelleListe = operations.filter(op => op.id !== id);
      setOperations(nouvelleListe);
      calculerSolde(nouvelleListe);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [operations]);

  const getTotaux = useCallback(() => {
    const totalEntrees = operations.reduce((sum, op) => sum + (op.entree || 0), 0);
    const totalSorties = operations.reduce((sum, op) => sum + (op.sortie || 0), 0);
    return { totalEntrees, totalSorties, solde };
  }, [operations, solde]);

  return {
    operations,
    loading,
    error,
    solde,
    ajouterOperation,
    supprimerOperation,
    getTotaux
  };
};
