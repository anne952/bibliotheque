import { useState, useEffect, useCallback } from 'react';
import { compteResultatService } from '../../service/accounting/compteResultatService';

export const useCompteResultat = (exercice) => {
  const [compteResultat, setCompteResultat] = useState({
    produits: [],
    charges: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const chargerCompteResultat = async () => {
      try {
        setLoading(true);
        const data = await compteResultatService.getCompteResultat(exercice);
        setCompteResultat(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    chargerCompteResultat();
  }, [exercice]);

  const totalProduits = compteResultat.produits.reduce((sum, p) => sum + p.montant, 0);
  const totalCharges = compteResultat.charges.reduce((sum, c) => sum + c.montant, 0);
  const resultatNet = totalProduits - totalCharges;

  const modifierLigne = useCallback(async (type, index, nouvellesValeurs) => {
    try {
      const ligneModifiee = await compteResultatService.modifierLigne(
        type, index, nouvellesValeurs
      );
      
      setCompteResultat(prev => ({
        ...prev,
        [type]: prev[type].map((item, i) => i === index ? ligneModifiee : item)
      }));
      
      return ligneModifiee;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const ajouterLigne = useCallback(async (type, ligne) => {
    try {
      const nouvelleLigne = await compteResultatService.ajouterLigne(type, ligne);
      
      setCompteResultat(prev => ({
        ...prev,
        [type]: [...prev[type], nouvelleLigne]
      }));
      
      return nouvelleLigne;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const supprimerLigne = useCallback(async (type, index) => {
    try {
      await compteResultatService.supprimerLigne(type, index);
      
      setCompteResultat(prev => ({
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      }));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    compteResultat,
    loading,
    error,
    totalProduits,
    totalCharges,
    resultatNet,
    modifierLigne,
    ajouterLigne,
    supprimerLigne
  };
};
