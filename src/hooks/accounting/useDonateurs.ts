import { useState, useEffect, useCallback } from 'react';
import { donateursService } from '../../service/accounting/donateursService';

export const useDonateurs = () => {
  const [donateurs, setDonateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalDons: 0,
    moyenneDons: 0,
    parMode: {},
    parType: {}
  });

  useEffect(() => {
    const chargerDonateurs = async () => {
      try {
        setLoading(true);
        const data = await donateursService.getDonateurs();
        setDonateurs(data);
        calculerStats(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    chargerDonateurs();
  }, []);

  const calculerStats = (data) => {
    const total = data.reduce((sum, d) => sum + d.montant, 0);
    
    const parMode = data.reduce((acc, d) => {
      acc[d.mode] = (acc[d.mode] || 0) + d.montant;
      return acc;
    }, {});
    
    const parType = data.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + 1;
      return acc;
    }, {});

    setStats({
      totalDons: total,
      moyenneDons: total / (data.length || 1),
      parMode,
      parType
    });
  };

  const ajouterDonateur = useCallback(async (donateur) => {
    try {
      const nouveauDonateur = await donateursService.ajouterDonateur(donateur);
      const nouvelleListe = [...donateurs, nouveauDonateur];
      setDonateurs(nouvelleListe);
      calculerStats(nouvelleListe);
      return nouveauDonateur;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [donateurs]);

  const supprimerDonateur = useCallback(async (id) => {
    try {
      await donateursService.supprimerDonateur(id);
      const nouvelleListe = donateurs.filter(d => d.id !== id);
      setDonateurs(nouvelleListe);
      calculerStats(nouvelleListe);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [donateurs]);

  return {
    donateurs,
    loading,
    error,
    stats,
    ajouterDonateur,
    supprimerDonateur
  };
};
