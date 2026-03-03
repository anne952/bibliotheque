import { useState, useEffect, useCallback } from 'react';
import { balanceService } from '../../service/accounting/balanceService';

export const useBalance = (periode) => {
  const [balance, setBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totaux, setTotaux] = useState({ totalDebit: 0, totalCredit: 0 });

  useEffect(() => {
    const chargerBalance = async () => {
      try {
        setLoading(true);
        const data = await balanceService.getBalance(periode);
        setBalance(data);
        
        const calculTotaux = data
          .filter(item => !item.isHeader)
          .reduce((acc, item) => ({
            totalDebit: acc.totalDebit + (item.totalDebit || 0),
            totalCredit: acc.totalCredit + (item.totalCredit || 0)
          }), { totalDebit: 0, totalCredit: 0 });
        
        setTotaux(calculTotaux);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    chargerBalance();
  }, [periode]);

  const modifierLigne = useCallback(async (compte, valeurs) => {
    try {
      const ligneModifiee = await balanceService.modifierLigne(compte, valeurs);
      setBalance(prev => prev.map(item => 
        item.compte === compte ? ligneModifiee : item
      ));
      return ligneModifiee;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const rafraichir = useCallback(async () => {
    try {
      const data = await balanceService.rafraichirBalance(periode);
      setBalance(data);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [periode]);

  return {
    balance,
    loading,
    error,
    totaux,
    isEquilibree: Math.abs(totaux.totalDebit - totaux.totalCredit) < 0.01,
    modifierLigne,
    rafraichir
  };
};
