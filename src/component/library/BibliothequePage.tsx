import React, { useMemo, useState } from 'react';
import type { TabType, Emprunt, Visiteur, Vente, DonFinancier, DonMateriel, Achat } from '../../types/biblio';
import { FiClipboard } from 'react-icons/fi';
import Navbar from './navbar';
import ActionButtons from './ActionButtons';
import DataTable from './DataTable';
import ModalForm from './ModalForm';
import SearchBar from '../SearchBar';
import PasteImportModal from '../common/PasteImportModal';
import { deletionService, isDeletionBackendMissingError } from '../../service/deletionService';
import { normalizeImportKey, parseClipboardTable, parseImportBoolean, parseImportNumber } from '../../utils/pasteImport';
import {
  useCreateLibraryRecordMutation,
  useDeleteLibraryRecordMutation,
  useImportLibraryPasteMutation,
  useLibraryBooksCatalogQuery,
  useLibraryDataQuery,
  useUpdateLibraryRecordMutation
} from '../../hooks/queries/libraryQueries';
import './css/BibliothequePage.css';

const BibliothequePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('emprunt');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [apiError, setApiError] = useState('');

  const { data: libraryData, isLoading, error: libraryLoadError } = useLibraryDataQuery();
  const { data: booksCatalog = [] } = useLibraryBooksCatalogQuery();
  const createRecordMutation = useCreateLibraryRecordMutation();
  const updateRecordMutation = useUpdateLibraryRecordMutation();
  const deleteRecordMutation = useDeleteLibraryRecordMutation();
  const importPasteMutation = useImportLibraryPasteMutation();

  const restoredData = useMemo(() => {
    const source = libraryData || {
      emprunts: [],
      visiteurs: [],
      ventes: [],
      donsFinanciers: [],
      donsMateriel: [],
      achats: []
    };

    return {
      emprunts: deletionService.applyRestorePosition('emprunt', source.emprunts as Emprunt[]),
      visiteurs: deletionService.applyRestorePosition('visite', source.visiteurs as Visiteur[]),
      ventes: deletionService.applyRestorePosition('vente', source.ventes as Vente[]),
      donsFinanciers: deletionService.applyRestorePosition('dons-financier', source.donsFinanciers as DonFinancier[]),
      donsMateriel: deletionService.applyRestorePosition('dons-materiel', source.donsMateriel as DonMateriel[]),
      achats: deletionService.applyRestorePosition('achat', source.achats as Achat[])
    };
  }, [libraryData]);

  const emprunts = restoredData.emprunts;
  const visiteurs = restoredData.visiteurs;
  const ventes = restoredData.ventes;
  const donsFinanciers = restoredData.donsFinanciers;
  const donsMateriel = restoredData.donsMateriel;
  const achats = restoredData.achats;

  const loading =
    isLoading ||
    createRecordMutation.isPending ||
    updateRecordMutation.isPending ||
    deleteRecordMutation.isPending ||
    importPasteMutation.isPending;

  const effectiveError = apiError || (libraryLoadError instanceof Error ? libraryLoadError.message : '');

  const getCurrentData = () => {
    switch (activeTab) {
      case 'emprunt': return emprunts;
      case 'visite': return visiteurs;
      case 'vente': return ventes;
      case 'dons-financier': return donsFinanciers;
      case 'dons-materiel': return donsMateriel;
      case 'achat': return achats;
      default: return [];
    }
  };

  const filterData = (data: any[]) => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase().trim();

    return data.filter(item => {
      switch (activeTab) {
        case 'emprunt':
          return (
            item.nom?.toLowerCase().includes(query) ||
            item.prenom?.toLowerCase().includes(query) ||
            item.email?.toLowerCase().includes(query) ||
            item.telephone?.toLowerCase().includes(query) ||
            item.livres?.some((l: any) =>
              l.titre?.toLowerCase().includes(query) ||
              l.reference?.toLowerCase().includes(query)
            )
          );
        case 'visite':
          return (
            item.nom?.toLowerCase().includes(query) ||
            item.prenom?.toLowerCase().includes(query) ||
            item.email?.toLowerCase().includes(query) ||
            item.adresse?.toLowerCase().includes(query)
          );
        case 'vente':
          return (
            item.nom?.toLowerCase().includes(query) ||
            item.prenom?.toLowerCase().includes(query) ||
            item.titres?.some((t: any) => t?.toLowerCase().includes(query)) ||
            item.references?.some((r: any) => r?.toLowerCase().includes(query))
          );
        case 'dons-financier':
          return (
            item.donateur?.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query) ||
            item.montant?.toString().includes(query)
          );
        case 'dons-materiel':
          return (
            item.materiel?.toLowerCase().includes(query) ||
            item.typeMateriel?.toLowerCase().includes(query) ||
            item.institutionDestinaire?.toLowerCase().includes(query)
          );
        case 'achat':
          return (
            item.intitule?.toLowerCase().includes(query) ||
            item.fournisseur?.toLowerCase().includes(query) ||
            item.montant?.toString().includes(query)
          );
        default:
          return true;
      }
    });
  };

  const getDisplayData = () => filterData(getCurrentData());

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Etes-vous sur de vouloir supprimer cet element ?')) {
      const currentData = getCurrentData() as any[];
      const target = currentData.find((item) => item.id === id);
      const originalIndex = currentData.findIndex((item) => item.id === id);

      if (!target) return;

      try {
        setApiError('');
        await deleteRecordMutation.mutateAsync({ tab: activeTab, target });
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Suppression non synchronisee avec le serveur');
        return;
      }

      try {
        const getDeletionName = () => {
          const fullName = [target.prenom, target.nom].filter(Boolean).join(' ').trim();

          switch (activeTab) {
            case 'emprunt': {
              const firstBook = Array.isArray(target.livres) && target.livres.length > 0
                ? target.livres[0]?.titre
                : '';
              return fullName
                ? `Emprunt - ${fullName}${firstBook ? ` (${firstBook})` : ''}`
                : 'Emprunt';
            }
            case 'visite':
              return fullName ? `Visiteur - ${fullName}` : 'Visiteur';
            case 'vente': {
              const firstTitle = Array.isArray(target.titres) && target.titres.length > 0
                ? target.titres[0]
                : '';
              return fullName
                ? `Vente - ${fullName}${firstTitle ? ` (${firstTitle})` : ''}`
                : 'Vente';
            }
            case 'dons-financier':
              return target.donateur ? `Don financier - ${target.donateur}` : 'Don financier';
            case 'dons-materiel':
              return target.materiel ? `Don materiel - ${target.materiel}` : 'Don materiel';
            case 'achat':
              return target.intitule ? `Achat - ${target.intitule}` : 'Achat';
            default:
              return 'Element';
          }
        };

        await deletionService.recordDeletion({
          sourceId: id,
          name: getDeletionName(),
          type: activeTab,
          originalIndex: originalIndex >= 0 ? originalIndex : undefined
        });
      } catch (error) {
        if (isDeletionBackendMissingError(error)) {
          setApiError('Suppression effectuee. Logique backend manquante: suppression recente indisponible.');
        } else {
          setApiError(error instanceof Error ? error.message : 'Journalisation de suppression impossible');
        }
      }
    }
  };

  const preparePayloadForTab = (tab: TabType, formData: any) => {
    const payload = { ...formData };
    const normalize = (value: string) => value.trim().toLowerCase();
    const bookByTitle = new Map(booksCatalog.map((book) => [normalize(book.titre), book]));

    if (tab === 'emprunt') {
      const livres = [];
      if (payload.livre1_titre) {
        const match = bookByTitle.get(normalize(payload.livre1_titre));
        if (!match) throw new Error(`Le livre "${payload.livre1_titre}" n'existe pas dans le stock.`);
        livres.push({ titre: match.titre, reference: match.reference, quantite: payload.livre1_quantite || 1 });
      }
      if (payload.livre2_titre) {
        const match = bookByTitle.get(normalize(payload.livre2_titre));
        if (!match) throw new Error(`Le livre "${payload.livre2_titre}" n'existe pas dans le stock.`);
        livres.push({ titre: match.titre, reference: match.reference, quantite: payload.livre2_quantite || 1 });
      }
      if (payload.livre3_titre) {
        const match = bookByTitle.get(normalize(payload.livre3_titre));
        if (!match) throw new Error(`Le livre "${payload.livre3_titre}" n'existe pas dans le stock.`);
        livres.push({ titre: match.titre, reference: match.reference, quantite: payload.livre3_quantite || 1 });
      }
      payload.livres = livres;
      delete payload.livre1_titre;
      delete payload.livre1_reference;
      delete payload.livre1_quantite;
      delete payload.livre2_titre;
      delete payload.livre2_reference;
      delete payload.livre2_quantite;
      delete payload.livre3_titre;
      delete payload.livre3_reference;
      delete payload.livre3_quantite;
    }

    if (tab === 'vente') {
      const titre = String(payload.titre || '').trim();
      if (!titre) throw new Error('Le titre du livre est obligatoire.');

      const match = bookByTitle.get(normalize(titre));
      if (!match) throw new Error(`Le livre "${titre}" n'existe pas dans le stock.`);

      payload.titre = match.titre;
      payload.reference = match.reference || '';
      payload.titres = [match.titre];
      payload.references = [match.reference || ''];
    }

    if (tab === 'dons-materiel' && String(payload.typeMateriel || '').toLowerCase() === 'livre') {
      const match = bookByTitle.get(normalize(payload.materiel || ''));
      if (!match) throw new Error(`Le livre "${payload.materiel}" n'existe pas dans le stock.`);
      payload.materiel = match.titre;
    }

    return payload;
  };

  const getPasteColumns = () => {
    switch (activeTab) {
      case 'emprunt':
        return ['nom', 'prenom', 'telephone', 'email', 'egliseProvenance', 'dateRetour', 'renouvele', 'livre1_titre', 'livre1_quantite', 'livre2_titre', 'livre2_quantite', 'livre3_titre', 'livre3_quantite'];
      case 'visite':
        return ['nom', 'prenom', 'adresse', 'egliseProvenance', 'telephone', 'email', 'dateVisite'];
      case 'vente':
        return ['nom', 'prenom', 'adresse', 'montant', 'dateVente', 'titre1', 'titre2', 'titre3'];
      case 'dons-financier':
        return ['donateur', 'type', 'montant', 'mode', 'dateDon', 'description'];
      case 'dons-materiel':
        return ['typeMateriel', 'materiel', 'quantite', 'institutionDestinaire', 'dateDon', 'description'];
      case 'achat':
        return ['intitule', 'montant', 'dateAchat', 'fournisseur'];
      default:
        return [];
    }
  };

  const buildImportPayload = (tab: TabType, row: string[], headers: string[] | null) => {
    const columnOrder = getPasteColumns();
    const getCell = (key: string, index: number) => {
      if (headers) {
        const headerIndex = headers.findIndex((header) => normalizeImportKey(header) === normalizeImportKey(key));
        if (headerIndex >= 0) return row[headerIndex] || '';
      }
      return row[index] || '';
    };

    if (tab === 'emprunt') {
      return {
        nom: getCell('nom', 0),
        prenom: getCell('prenom', 1),
        telephone: getCell('telephone', 2),
        email: getCell('email', 3),
        egliseProvenance: getCell('egliseProvenance', 4),
        dateRetour: getCell('dateRetour', 5),
        renouvele: parseImportBoolean(getCell('renouvele', 6)),
        livre1_titre: getCell('livre1_titre', 7),
        livre1_quantite: parseImportNumber(getCell('livre1_quantite', 8), 1),
        livre2_titre: getCell('livre2_titre', 9),
        livre2_quantite: parseImportNumber(getCell('livre2_quantite', 10), 1),
        livre3_titre: getCell('livre3_titre', 11),
        livre3_quantite: parseImportNumber(getCell('livre3_quantite', 12), 1)
      };
    }

    if (tab === 'visite') {
      return {
        nom: getCell('nom', 0),
        prenom: getCell('prenom', 1),
        adresse: getCell('adresse', 2),
        egliseProvenance: getCell('egliseProvenance', 3),
        telephone: getCell('telephone', 4),
        email: getCell('email', 5),
        dateVisite: getCell('dateVisite', 6)
      };
    }

    if (tab === 'vente') {
      return {
        nom: getCell('nom', 0),
        prenom: getCell('prenom', 1),
        adresse: getCell('adresse', 2),
        montant: parseImportNumber(getCell('montant', 3), 0),
        dateVente: getCell('dateVente', 4),
        titre1: getCell('titre1', 5),
        titre2: getCell('titre2', 6),
        titre3: getCell('titre3', 7)
      };
    }

    if (tab === 'dons-financier') {
      return {
        donateur: getCell('donateur', 0),
        type: (getCell('type', 1) || 'physique').toLowerCase(),
        montant: parseImportNumber(getCell('montant', 2), 0),
        mode: (getCell('mode', 3) || 'espece').toLowerCase(),
        dateDon: getCell('dateDon', 4),
        description: getCell('description', 5)
      };
    }

    if (tab === 'dons-materiel') {
      return {
        typeMateriel: (getCell('typeMateriel', 0) || 'autre').toLowerCase(),
        materiel: getCell('materiel', 1),
        quantite: parseImportNumber(getCell('quantite', 2), 1),
        institutionDestinaire: getCell('institutionDestinaire', 3),
        dateDon: getCell('dateDon', 4),
        description: getCell('description', 5)
      };
    }

    if (tab === 'achat') {
      return {
        intitule: getCell('intitule', 0),
        montant: parseImportNumber(getCell('montant', 1), 0),
        dateAchat: getCell('dateAchat', 2),
        fournisseur: getCell('fournisseur', 3)
      };
    }

    return columnOrder.reduce((acc, key, index) => ({ ...acc, [key]: getCell(key, index) }), {});
  };

  const handleImportPaste = async (raw: string) => {
    const rows = parseClipboardTable(raw);
    if (rows.length === 0) {
      return { success: 0, failed: 1, errors: ['Aucune ligne detectee.'] };
    }

    try {
      const backendResult = await importPasteMutation.mutateAsync({ tab: activeTab, raw });
      const createdCount = Number(
        backendResult?.createdCount ??
        backendResult?.created ??
        backendResult?.count ??
        0
      );

      if (createdCount > 0) {
        return { success: createdCount, failed: 0, errors: [] as string[] };
      }
    } catch {
      // fallback local ligne par ligne
    }

    const expectedHeaders = getPasteColumns();
    const normalizedExpected = expectedHeaders.map(normalizeImportKey);
    const firstRowLooksLikeHeader = rows[0].some((cell) => normalizedExpected.includes(normalizeImportKey(cell))) || rows[0].some((cell) => normalizeImportKey(cell).includes('date'));
    const headers = firstRowLooksLikeHeader ? rows[0] : null;
    const dataRows = firstRowLooksLikeHeader ? rows.slice(1) : rows;

    const created: any[] = [];
    const errors: string[] = [];

    for (let index = 0; index < dataRows.length; index += 1) {
      const row = dataRows[index];
      try {
        const rowPayload = buildImportPayload(activeTab, row, headers);
        const preparedPayload = preparePayloadForTab(activeTab, rowPayload);
        const saved = await createRecordMutation.mutateAsync({ tab: activeTab, payload: preparedPayload });
        created.push(saved);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur import';
        errors.push(`Ligne ${index + (headers ? 2 : 1)}: ${message}`);
      }
    }

    return { success: created.length, failed: errors.length, errors };
  };

  const handleSubmit = async (formData: any) => {
    let payload = { ...formData };
    try {
      payload = preparePayloadForTab(activeTab, payload);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Donnees invalides');
      return;
    }

    if (editingItem) {
      try {
        setApiError('');
        await updateRecordMutation.mutateAsync({ tab: activeTab, payload: {
          ...editingItem,
          ...payload,
          id: editingItem.id
        } });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Modification non synchronisee avec le serveur';
        if (message.toLowerCase().includes('aucun exercice comptable ouvert')) {
          setApiError('Aucun exercice comptable ouvert pour cette date. Choisissez une date dans un exercice ouvert ou ouvrez un exercice en comptabilite.');
        } else {
          setApiError(message);
        }
      }
    } else {
      let newItem: any = { ...payload };

      try {
        setApiError('');
        await createRecordMutation.mutateAsync({ tab: activeTab, payload: newItem });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Enregistrement API echoue';
        if (message.toLowerCase().includes('aucun exercice comptable ouvert')) {
          setApiError('Aucun exercice comptable ouvert pour cette date. Choisissez une date dans un exercice ouvert ou ouvrez un exercice en comptabilite.');
        } else {
          setApiError(message);
        }
        return;
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="bibliotheque-page">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="page-content">
        {loading && <p>Chargement des donnees bibliotheque...</p>}
        {effectiveError && <p>{effectiveError}</p>}
        <div className="library-actions-row">
          <ActionButtons
            onAdd={handleAdd}
            showFilter={false}
          />
          <button type="button" className="action-btn secondary-btn" onClick={() => setIsPasteModalOpen(true)}>
            <FiClipboard size={16} />
            <span>Copie/Coller</span>
          </button>
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher par nom, email, reference..."
          size="small"
          align="right"
        />

        <DataTable
          data={getDisplayData()}
          type={activeTab}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <ModalForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          type={activeTab}
          initialData={editingItem}
          booksCatalog={booksCatalog}
        />

        <PasteImportModal
          isOpen={isPasteModalOpen}
          title={`Import Excel - ${activeTab}`}
          subtitle="Collez les lignes depuis Excel pour creer de nouvelles lignes du tableau courant."
          columns={getPasteColumns()}
          onClose={() => setIsPasteModalOpen(false)}
          onImport={handleImportPaste}
        />
      </main>
    </div>
  );
};

export default BibliothequePage;
