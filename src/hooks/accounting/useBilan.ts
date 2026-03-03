import { useState, useEffect, useCallback } from 'react';
import { bilanService } from '../../service/accounting/bilanService';
import { calculateBilanTotal } from '../../utils/accounting/calculators';

/**
 * Hook pour la gestion du bilan
 * @param {string} exercice - Exercice comptable
 * @returns {BilanState & { modifierElement: Function, recalculer: Function }}
 */
export const useBilan = (exercice) => {
  const [bilan, setBilan] = useState({
    actif: {
      immobilisations: [],
      stocks: [],
      tresorerie: []
    },
    passif: {
      fondsPropres: [],
      dettes: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const chargerBilan = async () => {
      try {
        setLoading(true);
        const data = await bilanService.getBilan(exercice);
        setBilan(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    chargerBilan();
  }, [exercice]);

  const totalActif = calculateBilanTotal(Object.values(bilan.actif));
  const totalPassif = calculateBilanTotal(Object.values(bilan.passif));
  const isBalanced = Math.abs(totalActif - totalPassif) < 0.01;

  const modifierElement = useCallback(async (section, type, index, nouvellesValeurs) => {
    try {
      const elementModifie = await bilanService.modifierElement(
        section, type, index, nouvellesValeurs
      );
      
      setBilan(prev => {
        const nouveauBilan = { ...prev };
        nouveauBilan[section][type][index] = elementModifie;
        return nouveauBilan;
      });
      
      return elementModifie;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const recalculer = useCallback(async () => {
    try {
      const nouveauBilan = await bilanService.recalculerBilan(exercice);
      setBilan(nouveauBilan);
      return nouveauBilan;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [exercice]);

  return {
    bilan,
    loading,
    error,
    totalActif,
    totalPassif,
    isBalanced,
    modifierElement,
    recalculer
  };
};
