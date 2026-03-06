import { useMemo } from 'react';
import { useBilanQuery } from '../../hooks/queries/accountingQueries';

interface BilanProps {
  period: string | null;
}

interface ApiBilanItem {
  compte: string;
  libelle: string;
  montant: number;
}

interface BilanData {
  actif: {
    immobilisations: ApiBilanItem[];
    stocks: ApiBilanItem[];
    tresorerie: ApiBilanItem[];
  };
  passif: {
    fondsPropres: ApiBilanItem[];
    dettes: ApiBilanItem[];
  };
}

const emptyBilan: BilanData = {
  actif: {
    immobilisations: [],
    stocks: [],
    tresorerie: []
  },
  passif: {
    fondsPropres: [],
    dettes: []
  }
};

const Bilan = ({ period }: BilanProps) => {
  const bilanQuery = useBilanQuery(period);
  const bilanData = (bilanQuery.data as BilanData) || emptyBilan;
  const loading = bilanQuery.isLoading;
  const error = (bilanQuery.error as Error | null)?.message ?? null;

  const totalActif = useMemo(
    () => [...bilanData.actif.immobilisations, ...bilanData.actif.stocks, ...bilanData.actif.tresorerie].reduce((sum, item) => sum + item.montant, 0),
    [bilanData]
  );

  const totalPassif = useMemo(
    () => [...bilanData.passif.fondsPropres, ...bilanData.passif.dettes].reduce((sum, item) => sum + item.montant, 0),
    [bilanData]
  );

  const isBalanced = Math.abs(totalActif - totalPassif) < 0.01;
  const hasRows =
    bilanData.actif.immobilisations.length > 0 ||
    bilanData.actif.stocks.length > 0 ||
    bilanData.actif.tresorerie.length > 0 ||
    bilanData.passif.fondsPropres.length > 0 ||
    bilanData.passif.dettes.length > 0;

  const renderRows = (items: ApiBilanItem[]) =>
    items.map((item, idx) => (
      <div key={`${item.compte}-${idx}`} className="bilan-row">
        <span className="bilan-cell bilan-cell--ref">{item.compte || '-'}</span>
        <span className="bilan-cell bilan-cell--libelle">{item.libelle || '-'}</span>
        <span className="bilan-cell bilan-cell--note" />
        <span className="bilan-cell bilan-cell--montant">{item.montant.toLocaleString()} F</span>
      </div>
    ));

  return (
    <div className="bilan-container">
      <div className="bilan-header">
        <h2>BILAN</h2>
        <p className="bilan-period">Exercice {period || 'en cours'}</p>
      </div>

      {error && <div className="accounting-empty">{error}</div>}
      {loading && <div className="accounting-empty">Chargement du bilan...</div>}
      {!loading && !error && !hasRows && (
        <div className="accounting-empty">
          Aucun element pour cet exercice. Verifiez la periode selectionnee et validez les ecritures comptables.
        </div>
      )}

      {!loading && (
        <div className="bilan-grid">
          <div className="bilan-section bilan-section--actif">
            <div className="bilan-section__header">
              <h3>ACTIF</h3>
            </div>
            <div className="bilan-table">
              <div className="bilan-thead">
                <div className="bilan-row bilan-row--header">
                  <span className="bilan-cell bilan-cell--ref">COMPTE</span>
                  <span className="bilan-cell bilan-cell--libelle">LIBELLE</span>
                  <span className="bilan-cell bilan-cell--note" />
                  <span className="bilan-cell bilan-cell--montant">MONTANT</span>
                </div>
              </div>
              <div className="bilan-tbody">
                <div className="bilan-category">
                  <div className="bilan-category__title">IMMOBILISATIONS</div>
                  {renderRows(bilanData.actif.immobilisations)}
                </div>
                <div className="bilan-category">
                  <div className="bilan-category__title">STOCKS</div>
                  {renderRows(bilanData.actif.stocks)}
                </div>
                <div className="bilan-category">
                  <div className="bilan-category__title">TRESORERIE</div>
                  {renderRows(bilanData.actif.tresorerie)}
                </div>
                <div className="bilan-row bilan-row--total">
                  <span className="bilan-cell bilan-cell--ref" />
                  <span className="bilan-cell bilan-cell--libelle bilan-cell--total-label">TOTAL ACTIF</span>
                  <span className="bilan-cell bilan-cell--note" />
                  <span className="bilan-cell bilan-cell--montant">{totalActif.toLocaleString()} F</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bilan-section bilan-section--passif">
            <div className="bilan-section__header">
              <h3>PASSIF</h3>
            </div>
            <div className="bilan-table">
              <div className="bilan-thead">
                <div className="bilan-row bilan-row--header">
                  <span className="bilan-cell bilan-cell--ref">COMPTE</span>
                  <span className="bilan-cell bilan-cell--libelle">LIBELLE</span>
                  <span className="bilan-cell bilan-cell--note" />
                  <span className="bilan-cell bilan-cell--montant">MONTANT</span>
                </div>
              </div>
              <div className="bilan-tbody">
                <div className="bilan-category">
                  <div className="bilan-category__title">FONDS PROPRES</div>
                  {renderRows(bilanData.passif.fondsPropres)}
                </div>
                <div className="bilan-category">
                  <div className="bilan-category__title">DETTES</div>
                  {renderRows(bilanData.passif.dettes)}
                </div>
                <div className="bilan-row bilan-row--total">
                  <span className="bilan-cell bilan-cell--ref" />
                  <span className="bilan-cell bilan-cell--libelle bilan-cell--total-label">TOTAL PASSIF</span>
                  <span className="bilan-cell bilan-cell--note" />
                  <span className="bilan-cell bilan-cell--montant">{totalPassif.toLocaleString()} F</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`bilan-equilibre ${isBalanced ? 'bilan-equilibre--equilibre' : 'bilan-equilibre--non-equilibre'}`}>
        <span>{isBalanced ? 'BILAN EQUILIBRE' : 'BILAN NON EQUILIBRE'}</span>
        <strong>Ecart: {(totalActif - totalPassif).toLocaleString()} F</strong>
      </div>
    </div>
  );
};

export default Bilan;
