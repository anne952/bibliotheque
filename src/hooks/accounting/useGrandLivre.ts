import { useState, useEffect, useCallback } from 'react';
import { grandLivreService } from '../../service/accounting/grandLivreService';

export const useGrandLivre = (periode, comptesFiltres = []) => {
  const [grandLivre, setGrandLivre] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAccounts, setExpandedAccounts] = useState([]);

  useEffect(() => {
    const chargerGrandLivre = async () => {
      try {
        setLoading(true);
        const data = await grandLivreService.getGrandLivre(periode, comptesFiltres);
        setGrandLivre(data);
        
        // Par dÃ©faut, Ã©tendre les comptes 5,6,7
        const comptesParDefaut = data
          .filter(c => ['5', '6', '7'].includes(c.compte.charAt(0)))
          .map(c => c.compte);
        setExpandedAccounts(comptesParDefaut);
        
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    chargerGrandLivre();
  }, [periode, comptesFiltres.join(',')]);

  const toggleCompte = useCallback((compte) => {
    setExpandedAccounts(prev =>
      prev.includes(compte)
        ? prev.filter(c => c !== compte)
        : [...prev, compte]
    );
  }, []);

  const ajouterOperation = useCallback(async (compte, operation) => {
    try {
      const nouvelleOperation = await grandLivreService.ajouterOperation(compte, operation);
      setGrandLivre(prev => prev.map(c => 
        c.compte === compte
          ? { ...c, operations: [...c.operations, nouvelleOperation] }
          : c
      ));
      return nouvelleOperation;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const modifierOperation = useCallback(async (compte, index, operation) => {
    try {
      const operationModifiee = await grandLivreService.modifierOperation(compte, index, operation);
      setGrandLivre(prev => prev.map(c =>
        c.compte === compte
          ? { ...c, operations: c.operations.map((op, i) => i === index ? operationModifiee : op) }
          : c
      ));
      return operationModifiee;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const supprimerOperation = useCallback(async (compte, index) => {
    try {
      await grandLivreService.supprimerOperation(compte, index);
      setGrandLivre(prev => prev.map(c =>
        c.compte === compte
          ? { ...c, operations: c.operations.filter((_, i) => i !== index) }
          : c
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    grandLivre,
    loading,
    error,
    expandedAccounts,
    toggleCompte,
    ajouterOperation,
    modifierOperation,
    supprimerOperation
  };
};
