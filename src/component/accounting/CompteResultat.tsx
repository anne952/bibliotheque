import { useEffect, useMemo, useState } from 'react';
import { compteResultatService } from '../../service/accounting/compteResultatService';

interface CompteResultatProps {
  period: string | null;
}

interface ResultatItem {
  compte: string;
  libelle: string;
  montant: number;
  type: 'produit' | 'charge';
}

interface ResultatData {
  produits: ResultatItem[];
  charges: ResultatItem[];
}

const emptyResultat: ResultatData = {
  produits: [],
  charges: []
};

const CompteResultat = ({ period }: CompteResultatProps) => {
  const [resultatData, setResultatData] = useState<ResultatData>(emptyResultat);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResultat = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await compteResultatService.getCompteResultat(period);
        setResultatData(data as ResultatData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Chargement du compte de resultat impossible');
      } finally {
        setLoading(false);
      }
    };

    void loadResultat();
  }, [period]);

  const totalProduits = useMemo(() => resultatData.produits.reduce((sum, item) => sum + item.montant, 0), [resultatData]);
  const totalCharges = useMemo(() => resultatData.charges.reduce((sum, item) => sum + item.montant, 0), [resultatData]);
  const resultatNet = totalProduits - totalCharges;
  const hasRows = resultatData.produits.length > 0 || resultatData.charges.length > 0;

  const renderRows = (items: ResultatItem[], kind: 'produit' | 'charge') =>
    items.map((item, idx) => (
      <div key={`${item.compte}-${idx}`} className="resultat-row">
        <span className="resultat-cell resultat-cell--ref">{item.compte || '-'}</span>
        <span className="resultat-cell resultat-cell--libelle">{item.libelle || '-'}</span>
        <span className="resultat-cell resultat-cell--note" />
        <span className={`resultat-cell resultat-cell--montant ${kind === 'produit' ? 'positif' : 'negatif'}`}>
          {item.montant.toLocaleString()} F
        </span>
      </div>
    ));

  return (
    <div className="resultat-container">
      <div className="resultat-header">
        <h2>COMPTE DE RESULTAT</h2>
        <p className="resultat-period">Exercice {period || 'en cours'}</p>
      </div>

      {error && <div className="accounting-empty">{error}</div>}
      {loading && <div className="accounting-empty">Chargement du compte de resultat...</div>}
      {!loading && !error && !hasRows && (
        <div className="accounting-empty">
          Aucune donnee pour cet exercice. Le compte de resultat utilise uniquement les ecritures validees.
        </div>
      )}

      {!loading && (
        <div className="resultat-grid">
          <div className="resultat-section">
            <div className="resultat-section__header">
              <h3>PRODUITS</h3>
            </div>

            <div className="resultat-table">
              <div className="resultat-thead">
                <div className="resultat-row resultat-row--header">
                  <span className="resultat-cell resultat-cell--ref">COMPTE</span>
                  <span className="resultat-cell resultat-cell--libelle">LIBELLE</span>
                  <span className="resultat-cell resultat-cell--note" />
                  <span className="resultat-cell resultat-cell--montant">MONTANT</span>
                </div>
              </div>

              <div className="resultat-tbody">
                {renderRows(resultatData.produits, 'produit')}

                <div className="resultat-row resultat-row--total">
                  <span className="resultat-cell resultat-cell--ref" />
                  <span className="resultat-cell resultat-cell--libelle resultat-cell--total-label">TOTAL PRODUITS</span>
                  <span className="resultat-cell resultat-cell--note" />
                  <span className="resultat-cell resultat-cell--montant total-positif">{totalProduits.toLocaleString()} F</span>
                </div>
              </div>
            </div>
          </div>

          <div className="resultat-section">
            <div className="resultat-section__header">
              <h3>CHARGES</h3>
            </div>

            <div className="resultat-table">
              <div className="resultat-thead">
                <div className="resultat-row resultat-row--header">
                  <span className="resultat-cell resultat-cell--ref">COMPTE</span>
                  <span className="resultat-cell resultat-cell--libelle">LIBELLE</span>
                  <span className="resultat-cell resultat-cell--note" />
                  <span className="resultat-cell resultat-cell--montant">MONTANT</span>
                </div>
              </div>

              <div className="resultat-tbody">
                {renderRows(resultatData.charges, 'charge')}

                <div className="resultat-row resultat-row--total">
                  <span className="resultat-cell resultat-cell--ref" />
                  <span className="resultat-cell resultat-cell--libelle resultat-cell--total-label">TOTAL CHARGES</span>
                  <span className="resultat-cell resultat-cell--note" />
                  <span className="resultat-cell resultat-cell--montant total-negatif">{totalCharges.toLocaleString()} F</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="resultat-net-container">
        <div className="resultat-net-row">
          <span className="resultat-net-label resultat-net-label--title">RESULTAT NET</span>
          <span className={`resultat-net-montant ${resultatNet >= 0 ? 'benefice' : 'perte'}`}>
            {resultatNet >= 0 ? '+' : ''}
            {resultatNet.toLocaleString()} F
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompteResultat;
