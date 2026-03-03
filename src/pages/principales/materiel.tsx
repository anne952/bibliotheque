import React, { useState } from 'react';
import { FiClipboard, FiTrash2 } from 'react-icons/fi';
import NavigationVerticale from '../../component/materiel/NavigationVerticale';
import MaterielTable from '../../component/materiel/MaterielList';
import MaterielDetail from '../../component/materiel/MaterielDetail';
import AddMaterielModal from '../../component/materiel/AddMaterielModal';
import StockOperationModal from '../../component/materiel/StockOperationModale';
import SearchBar from '../../component/SearchBar';
import PasteImportModal from '../../component/common/PasteImportModal';
import type { Materiel, TypeMateriel, EtatMateriel, StockOperation } from '../../types/materiel';
import { materialService } from '../../service/materialService';
import { dataSyncService } from '../../service/dataSyncService';
import { deletionService, isDeletionBackendMissingError, type DeletedItemRecord } from '../../service/deletionService';
import { buildHeaderIndex, getImportCell, hasHeaderAliases, normalizeImportKey, parseClipboardTable, parseImportNumber, type HeaderIndex } from '../../utils/pasteImport';
import '../principales/css/material.css';

const GestionMaterielPage: React.FC = () => {
  const [materiels, setMateriels] = useState<Materiel[]>([]);

  const [selectedType, setSelectedType] = useState<TypeMateriel>('livre');
  const [selectedMateriel, setSelectedMateriel] = useState<Materiel | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [deletedMaterialItems, setDeletedMaterialItems] = useState<DeletedItemRecord[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

  React.useEffect(() => {
    const loadMaterials = async () => {
      try {
        setLoading(true);
        setApiError('');
        const [data, deletedItems] = await Promise.all([
          dataSyncService.getMaterials(true),
          deletionService.listDeletedItems().catch(() => [] as DeletedItemRecord[])
        ]);
        const restoredOrder = deletionService.applyRestorePosition('materiel', data);
        setMateriels(restoredOrder);
        setDeletedMaterialItems(
          deletedItems.filter((item) => item.type === 'materiel' && !item.restored)
        );
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'Erreur de chargement des materiels');
      } finally {
        setLoading(false);
      }
    };

    void loadMaterials();
  }, []);

  const refreshDeletedMaterials = async () => {
    try {
      const deletedItems = await deletionService.listDeletedItems();
      setDeletedMaterialItems(
        deletedItems.filter((item) => item.type === 'materiel' && !item.restored)
      );
    } catch (error) {
      if (!isDeletionBackendMissingError(error)) {
        setApiError(error instanceof Error ? error.message : 'Erreur chargement corbeille materiel');
        setDeletedMaterialItems([]);
      }
    }
  };

  const filteredMateriels = materiels.filter((m) => m.type === selectedType);

  const filterMaterielsBySearch = (items: Materiel[]) => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase().trim();

    return items.filter((item) => {
      const titre = (item as any).titre?.toLowerCase() || '';
      const reference = (item as any).reference?.toLowerCase() || '';
      const nom = (item as any).nom?.toLowerCase() || '';
      const numeroSerie = (item as any).numeroSerie?.toLowerCase() || '';
      const categorie = (item as any).categorie?.toLowerCase() || '';

      return (
        titre.includes(query) ||
        reference.includes(query) ||
        nom.includes(query) ||
        numeroSerie.includes(query) ||
        categorie.includes(query)
      );
    });
  };

  const getDisplayMateriels = () => filterMaterielsBySearch(filteredMateriels);

  const handleAddMateriel = async (nouveauMateriel: Materiel) => {
    try {
      setApiError('');
      const created = await materialService.addMaterial(nouveauMateriel);
      const next = [...materiels, created];
      setMateriels(next);
      dataSyncService.setMaterials(next);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Ajout impossible');
    }
  };

  const handleAddStockOperation = async (materielId: string, operation: StockOperation) => {
    try {
      setApiError('');
      const createdOperation = await materialService.addStockEntry(materielId, operation);
      const updatedMateriels = materiels.map((m) => {
        if (m.id === materielId) {
          return { ...m, stockOperations: [...m.stockOperations, createdOperation] };
        }
        return m;
      });

      setMateriels(updatedMateriels);
      dataSyncService.setMaterials(updatedMateriels);

      if (selectedMateriel?.id === materielId) {
        const updatedMateriel = updatedMateriels.find((m) => m.id === materielId);
        if (updatedMateriel) {
          setSelectedMateriel(updatedMateriel);
        }
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Operation de stock impossible');
    }
  };

  const handleUpdateEtat = (materielId: string, nouvelEtat: EtatMateriel) => {
    const updatedMateriels = materiels.map((m) => {
      if (m.id === materielId) {
        return { ...m, etat: nouvelEtat };
      }
      return m;
    });

    setMateriels(updatedMateriels);
    dataSyncService.setMaterials(updatedMateriels);

    if (selectedMateriel?.id === materielId) {
      setSelectedMateriel({ ...selectedMateriel, etat: nouvelEtat });
    }
  };

  const handleSelectMateriel = (materiel: Materiel) => {
    setSelectedMateriel(materiel);
  };

  const handleBackToList = () => {
    setSelectedMateriel(null);
  };

  const handleDeleteMateriel = async (materielId: string) => {
    if (!window.confirm('Etes-vous sur de vouloir supprimer ce materiel ?')) {
      return;
    }

    const target = materiels.find((materiel) => materiel.id === materielId);
    const originalIndex = materiels.findIndex((materiel) => materiel.id === materielId);

    try {
      await materialService.deleteMaterial(materielId);
      const updatedMateriels = materiels.filter((m) => m.id !== materielId);
      setMateriels(updatedMateriels);
      dataSyncService.setMaterials(updatedMateriels);
      setSelectedMaterialIds((prev) => prev.filter((id) => id !== materielId));

      if (selectedMateriel?.id === materielId) {
        setSelectedMateriel(null);
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Suppression impossible');
      return;
    }

    try {
      const deletedRecord = await deletionService.recordDeletion({
        sourceId: materielId,
        name: (() => {
          const nom = target?.nom || (target as any)?.titre || '';
          const reference = (target as any)?.reference ? ` (${(target as any).reference})` : '';
          return nom ? `Materiel - ${nom}${reference}` : `Materiel ${materielId}`;
        })(),
        type: 'materiel',
        originalIndex: originalIndex >= 0 ? originalIndex : undefined
      });
      if (!deletedRecord.restored) {
        setDeletedMaterialItems((prev) => [deletedRecord, ...prev.filter((item) => item.id !== deletedRecord.id)]);
      }
      await refreshDeletedMaterials();
    } catch (error) {
      if (isDeletionBackendMissingError(error)) {
        setApiError('Suppression effectuee. Logique backend manquante: suppression recente indisponible.');
      } else {
        setApiError(error instanceof Error ? error.message : 'Journalisation de suppression impossible');
      }
    }
  };

  const handleToggleMaterialSelection = (materielId: string) => {
    setSelectedMaterialIds((prev) => (
      prev.includes(materielId)
        ? prev.filter((id) => id !== materielId)
        : [...prev, materielId]
    ));
  };

  const handleDeleteSelectedMateriels = async () => {
    const visibleIds = new Set(getDisplayMateriels().map((item) => item.id));
    const targets = filteredMateriels.filter((item) => selectedMaterialIds.includes(item.id) && visibleIds.has(item.id));
    if (targets.length === 0) {
      setApiError('Aucun materiel selectionne a supprimer.');
      return;
    }

    if (!window.confirm(`Supprimer ${targets.length} element(s) selectionne(s) de ${getTypeLabel(selectedType).trim()} ?`)) {
      return;
    }

    setApiError('');

    const failures: string[] = [];
    let next = [...materiels];
    const deletedTargets: Array<{ target: Materiel; originalIndex: number }> = [];
    const batchSize = 20;

    for (let start = 0; start < targets.length; start += batchSize) {
      const batch = targets.slice(start, start + batchSize);
      const settled = await Promise.allSettled(
        batch.map(async (target) => {
          await materialService.deleteMaterial(target.id);
          return target;
        })
      );

      settled.forEach((result, index) => {
        const target = batch[index];
        if (result.status === 'fulfilled') {
          const originalIndex = materiels.findIndex((item) => item.id === target.id);
          deletedTargets.push({ target, originalIndex });
          next = next.filter((item) => item.id !== target.id);
          return;
        }
        const label = target.nom || (target as any).titre || target.id;
        const reason = result.reason instanceof Error ? result.reason.message : 'Erreur suppression';
        failures.push(`${label}: ${reason}`);
      });
    }

    setMateriels(next);
    dataSyncService.setMaterials(next);
    setSelectedMaterialIds([]);
    if (selectedMateriel && !next.some((item) => item.id === selectedMateriel.id)) {
      setSelectedMateriel(null);
    }

    try {
      const recorded = await Promise.allSettled(
        deletedTargets.map(({ target, originalIndex }) =>
          deletionService.recordDeletion({
            sourceId: target.id,
            name: (() => {
              const nom = target.nom || (target as any).titre || '';
              const reference = (target as any)?.reference ? ` (${(target as any).reference})` : '';
              return nom ? `Materiel - ${nom}${reference}` : `Materiel ${target.id}`;
            })(),
            type: 'materiel',
            originalIndex: originalIndex >= 0 ? originalIndex : undefined
          })
        )
      );

      const createdRecords = recorded
        .filter((item): item is PromiseFulfilledResult<DeletedItemRecord> => item.status === 'fulfilled')
        .map((item) => item.value)
        .filter((item) => !item.restored);

      if (createdRecords.length > 0) {
        setDeletedMaterialItems((prev) => [
          ...createdRecords,
          ...prev.filter((item) => !createdRecords.some((created) => created.id === item.id))
        ]);
      }

      await refreshDeletedMaterials();
    } catch {
      // ignore si backend corbeille indisponible
    }

    if (failures.length > 0) {
      setApiError(`${targets.length - failures.length} supprime(s), ${failures.length} echec(s). ${failures.slice(0, 3).join(' | ')}`);
    }
  };

  const getTypeLabel = (type: TypeMateriel) => {
    switch (type) {
      case 'livre': return ' Livres';
      case 'carte-sd': return ' Cartes SD';
      case 'tablette': return ' Tablettes';
      case 'photocopieuse': return ' Photocopieuses';
      case 'autre': return ' Autre Materiel';
      default: return 'Materiel';
    }
  };

  const getPasteColumns = () => {
    switch (selectedType) {
      case 'livre':
        return ['Ref', 'titre', 'Stock initial', 'EntrÃ©es', 'Sorties', 'Stock Final', 'volume (optionnel)', 'langue (optionnel)', 'categorie (optionnel)'];
      case 'carte-sd':
        return ['nom', 'categorie', 'description', 'stock initial (optionnel)', 'entrees (optionnel)', 'sorties (optionnel)', 'stock final (optionnel)'];
      case 'tablette':
        return ['nom', 'numeroSerie', 'categorie', 'description', 'stock initial (optionnel)', 'entrees (optionnel)', 'sorties (optionnel)', 'stock final (optionnel)'];
      case 'photocopieuse':
      case 'autre':
      default:
        return ['nom', 'categorie', 'description', 'stock initial (optionnel)', 'entrees (optionnel)', 'sorties (optionnel)', 'stock final (optionnel)'];
    }
  };

  const readCell = (row: string[], headerIndex: HeaderIndex | null, aliases: string[], fallbackIndex: number) => {
    return getImportCell(row, headerIndex, aliases, fallbackIndex);
  };

  const buildMaterialFromRow = (row: string[], headerIndex: HeaderIndex | null): { materiel: Materiel; stockToApply: number } => {
    const sharedReference = readCell(row, headerIndex, ['reference', 'ref', 'code'], headerIndex ? -1 : 1).trim();
    const commonBase = {
      id: crypto.randomUUID(),
      type: selectedType,
      etat: 'fonctionnel' as const,
      dateAjout: new Date().toISOString().slice(0, 10),
      stockOperations: [] as StockOperation[],
      categorie: readCell(row, headerIndex, ['categorie', 'category'], selectedType === 'tablette' ? 2 : selectedType === 'livre' ? 8 : 1) || ''
    };

    if (selectedType === 'livre') {
      const looksLikeReferenceFirst = !headerIndex
        && (row[0] || '').trim().length > 0
        && (row[1] || '').trim().length > 0
        && /[a-z]/i.test(row[0] || '')
        && /[-_0-9]/.test(row[0] || '')
        && !/^\d+$/.test((row[1] || '').trim());

      const titre = looksLikeReferenceFirst
        ? (row[1] || '').trim()
        : readCell(row, headerIndex, ['titre', 'title', 'nom', 'name', 'designation'], headerIndex ? -1 : 1);
      const reference = looksLikeReferenceFirst
        ? (row[0] || '').trim()
        : readCell(row, headerIndex, ['reference', 'ref', 'code'], headerIndex ? -1 : 0);
      const explicitVolume = headerIndex
        ? readCell(row, headerIndex, ['volume', 'tome'], -1)
        : readCell(row, headerIndex, ['volume', 'tome'], 6);
      const normalizedVolume = explicitVolume ? explicitVolume.trim() : '';
      const parsedVolume = normalizedVolume ? Number(normalizedVolume) : Number.NaN;
      const volume = Number.isFinite(parsedVolume) ? parsedVolume : null;
      const langue = looksLikeReferenceFirst
        ? 'Français'
        : (readCell(row, headerIndex, ['langue', 'language'], 7) || 'Français');
      const categorie = looksLikeReferenceFirst
        ? 'livre'
        : (readCell(row, headerIndex, ['categorie', 'category'], 8) || 'livre');
      const stockFinalCell = readCell(row, headerIndex, ['stockfinal', 'stockfin', 'stock'], 5);
      const stockInitialCell = readCell(row, headerIndex, ['stockinitial', 'stockdepart'], 2);
      const entreesCell = readCell(row, headerIndex, ['entrees', 'entree'], 3);
      const sortiesCell = readCell(row, headerIndex, ['sorties', 'sortie'], 4);
      const parsedStockFinal = parseImportNumber(stockFinalCell, Number.NaN);
      const computedStock = parseImportNumber(stockInitialCell, 0) + parseImportNumber(entreesCell, 0) - parseImportNumber(sortiesCell, 0);
      const stockToApply = Number.isFinite(parsedStockFinal) ? Math.max(0, parsedStockFinal) : Math.max(0, computedStock);

      return {
        stockToApply,
        materiel: {
          ...commonBase,
          type: 'livre',
          nom: titre,
          titre,
          reference: (reference || sharedReference).trim(),
          volume,
          langue: langue as any,
          categorie: categorie as any
        }
      };
    }

    if (selectedType === 'tablette') {
      const stockFinalCell = readCell(row, headerIndex, ['stockfinal', 'stockfin', 'stock'], -1);
      const stockInitialCell = readCell(row, headerIndex, ['stockinitial', 'stockdepart'], -1);
      const entreesCell = readCell(row, headerIndex, ['entrees', 'entree'], -1);
      const sortiesCell = readCell(row, headerIndex, ['sorties', 'sortie'], -1);
      const parsedStockFinal = parseImportNumber(stockFinalCell, Number.NaN);
      const computedStock = parseImportNumber(stockInitialCell, 0) + parseImportNumber(entreesCell, 0) - parseImportNumber(sortiesCell, 0);
      const stockToApply = Number.isFinite(parsedStockFinal) ? Math.max(0, parsedStockFinal) : Math.max(0, computedStock);

      return {
        stockToApply,
        materiel: {
          ...commonBase,
          type: 'tablette',
          nom: readCell(row, headerIndex, ['nom', 'name'], 0) || 'Tablette',
          reference: sharedReference,
          numeroSerie: readCell(row, headerIndex, ['numeroserie', 'serie', 'serialnumber'], 1)
        }
      };
    }

    if (selectedType === 'carte-sd') {
      const stockFinalCell = readCell(row, headerIndex, ['stockfinal', 'stockfin', 'stock'], -1);
      const stockInitialCell = readCell(row, headerIndex, ['stockinitial', 'stockdepart'], -1);
      const entreesCell = readCell(row, headerIndex, ['entrees', 'entree'], -1);
      const sortiesCell = readCell(row, headerIndex, ['sorties', 'sortie'], -1);
      const parsedStockFinal = parseImportNumber(stockFinalCell, Number.NaN);
      const computedStock = parseImportNumber(stockInitialCell, 0) + parseImportNumber(entreesCell, 0) - parseImportNumber(sortiesCell, 0);
      const stockToApply = Number.isFinite(parsedStockFinal) ? Math.max(0, parsedStockFinal) : Math.max(0, computedStock);

      return {
        stockToApply,
        materiel: {
          ...commonBase,
          type: 'carte-sd',
          nom: readCell(row, headerIndex, ['nom', 'name'], 0) || 'Carte SD',
          reference: sharedReference,
          categorie: (readCell(row, headerIndex, ['categorie', 'category'], 1) || 'basique') as any
        }
      };
    }

    const stockFinalCell = readCell(row, headerIndex, ['stockfinal', 'stockfin', 'stock'], -1);
    const stockInitialCell = readCell(row, headerIndex, ['stockinitial', 'stockdepart'], -1);
    const entreesCell = readCell(row, headerIndex, ['entrees', 'entree'], -1);
    const sortiesCell = readCell(row, headerIndex, ['sorties', 'sortie'], -1);
    const parsedStockFinal = parseImportNumber(stockFinalCell, Number.NaN);
    const computedStock = parseImportNumber(stockInitialCell, 0) + parseImportNumber(entreesCell, 0) - parseImportNumber(sortiesCell, 0);
    const stockToApply = Number.isFinite(parsedStockFinal) ? Math.max(0, parsedStockFinal) : Math.max(0, computedStock);

    return {
      stockToApply,
      materiel: {
        ...commonBase,
        type: selectedType === 'photocopieuse' ? 'photocopieuse' : 'autre',
        nom: readCell(row, headerIndex, ['nom', 'name'], 0) || 'Materiel',
        reference: sharedReference
      }
    };
  };

  const handlePasteImport = async (raw: string) => {
    const rows = parseClipboardTable(raw);
    if (rows.length === 0) {
      return { success: 0, failed: 1, errors: ['Aucune ligne detectee.'] };
    }

    const toBackendType = (type: TypeMateriel) => {
      if (type === 'livre') return 'BOOK';
      if (type === 'carte-sd') return 'SD_CARD';
      if (type === 'tablette') return 'TABLET';
      if (type === 'photocopieuse') return 'PHOTOCOPIER';
      return 'OTHER';
    };

    const firstRow = rows[0] || [];
    const headerAliases = [
      ['name', 'nom', 'designation', 'titre', 'title'],
      ['reference', 'ref', 'code'],
      ['category', 'categorie'],
      ['language', 'langue'],
      ['volume', 'tome'],
      ['serialnumber', 'numeroserie', 'serie']
    ];
    const hasHeaders = hasHeaderAliases(firstRow, headerAliases);
    const headerIndex = hasHeaders ? buildHeaderIndex(firstRow) : null;
    const dataRows = hasHeaders ? rows.slice(1) : rows;
    const builtRows = dataRows.map((row) => buildMaterialFromRow(row, headerIndex));
    const existingReferences = new Set(
      materiels
        .map((item) => String((item as any).reference || '').trim().toLowerCase())
        .filter((value) => value.length > 0)
    );
    const importReferences = new Set<string>();
    let droppedReferences = 0;

    const normalizedRows = builtRows
      .map((built) => {
        const output: Record<string, unknown> = {
          type: toBackendType(selectedType),
          name: ((built.materiel as any).titre || built.materiel.nom || '').trim()
        };

        const reference = ((built.materiel as any).reference || '').trim();
        if (reference) {
          const refKey = reference.toLowerCase();
          if (existingReferences.has(refKey) || importReferences.has(refKey)) {
            droppedReferences += 1;
          } else {
            output.reference = reference;
            importReferences.add(refKey);
          }
        }

        const category = (built.materiel.categorie || '').trim();
        if (category) output.category = category;

        if (selectedType === 'livre') {
          const language = String((built.materiel as any).langue || '').trim();
          const volume = String((built.materiel as any).volume || '').trim();
          if (language) output.language = language;
          if (volume) output.volume = volume;
        }

        if (selectedType === 'tablette') {
          const serialNumber = String((built.materiel as any).numeroSerie || '').trim();
          if (serialNumber) output.serialNumber = serialNumber;
        }

        return output;
      })
      .filter((row) => String(row.name || '').trim().length > 0);

    if (normalizedRows.length === 0) {
      return { success: 0, failed: 1, errors: ['Aucune ligne valide: nom/designation manquant.'] };
    }

    try {
      const backendResult = await materialService.importPaste(raw, selectedType, normalizedRows);
      const success = Number(
        backendResult?.createdCount ??
        backendResult?.created ??
        backendResult?.count ??
        0
      );
      const backendErrors = Array.isArray(backendResult?.errors)
        ? backendResult.errors.map((value: unknown) => String(value))
        : [];
      const failed = Number(
        backendResult?.failedCount ??
        backendResult?.failed ??
        backendErrors.length ??
        0
      );

      let refreshed = await dataSyncService.getMaterials(true);

      {
        const computeStock = (material: Materiel) => {
          return material.stockOperations.reduce((total, operation) => {
            if (operation.type === 'entrée') return total + Number(operation.quantite || 0);
            return total - Number(operation.quantite || 0);
          }, 0);
        };

        const materialsByType = refreshed.filter((item) => item.type === selectedType);
        const desiredByMaterialId = new Map<string, number>();

        builtRows.forEach((built) => {
          if (built.stockToApply <= 0) return;

          const reference = String((built.materiel as any).reference || '').trim().toLowerCase();
          const serialNumber = String((built.materiel as any).numeroSerie || '').trim().toLowerCase();
          const materialName = String((built.materiel as any).titre || built.materiel.nom || '').trim().toLowerCase();

          const target = materialsByType.find((material) => {
            const materialReference = String((material as any).reference || '').trim().toLowerCase();
            const materialSerial = String((material as any).numeroSerie || '').trim().toLowerCase();
            const materialTitle = String((material as any).titre || material.nom || '').trim().toLowerCase();

            if (reference && materialReference === reference) return true;
            if (selectedType === 'tablette' && serialNumber && materialSerial === serialNumber) return true;
            return materialName.length > 0 && materialTitle === materialName;
          });

          if (!target) return;
          const previousDesired = desiredByMaterialId.get(target.id) || 0;
          desiredByMaterialId.set(target.id, Math.max(previousDesired, built.stockToApply));
        });

        if (desiredByMaterialId.size > 0) {
          const stockSettled = await Promise.allSettled(
            Array.from(desiredByMaterialId.entries()).map(async ([materialId, desiredStock]) => {
              const material = refreshed.find((item) => item.id === materialId);
              if (!material) return;
              const currentStock = computeStock(material);
              const quantityToAdd = desiredStock - currentStock;
              if (quantityToAdd <= 0) return;

              const stockOperation: StockOperation = {
                id: crypto.randomUUID(),
                date: new Date().toISOString().slice(0, 10),
                type: 'entrée',
                quantite: quantityToAdd,
                raison: 'Import Excel',
                description: 'Stock initial importe'
              };
              await materialService.addStockEntry(materialId, stockOperation);
            })
          );

          const stockErrors = stockSettled
            .filter((item): item is PromiseRejectedResult => item.status === 'rejected')
            .map((item) => (item.reason instanceof Error ? item.reason.message : 'Erreur ajustement stock'));

          if (stockErrors.length > 0) {
            backendErrors.push(...stockErrors.slice(0, 3));
          }

          refreshed = await dataSyncService.getMaterials(true);
        }
      }

      const restored = deletionService.applyRestorePosition('materiel', refreshed);
      setMateriels(restored);
      await refreshDeletedMaterials();

      return {
        success,
        failed,
        errors: droppedReferences > 0
          ? [
              ...backendErrors,
              `${droppedReferences} reference(s) deja existante(s) ont ete ignoree(s) pour eviter le blocage d'import.`
            ]
          : backendErrors
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur import';
      const fallbackReferences = new Set(existingReferences);
      const fallbackErrors: string[] = [];
      let fallbackSuccess = 0;
      let fallbackDroppedReferences = 0;

      for (let index = 0; index < dataRows.length; index += 1) {
        const row = dataRows[index];
        const built = buildMaterialFromRow(row, headerIndex);
        const materialToCreate = { ...built.materiel } as Materiel;
        const materialName = String((materialToCreate as any).titre || materialToCreate.nom || '').trim();

        if (!materialName) {
          fallbackErrors.push(`Ligne ${index + (hasHeaders ? 2 : 1)}: nom/designation obligatoire`);
          continue;
        }

        const reference = String((materialToCreate as any).reference || '').trim();
        if (reference) {
          const refKey = reference.toLowerCase();
          if (fallbackReferences.has(refKey)) {
            (materialToCreate as any).reference = '';
            fallbackDroppedReferences += 1;
          } else {
            fallbackReferences.add(refKey);
          }
        }

        try {
          const createdMaterial = await materialService.addMaterial(materialToCreate);

          if (built.stockToApply > 0) {
            const stockOperation: StockOperation = {
              id: crypto.randomUUID(),
              date: new Date().toISOString().slice(0, 10),
              type: 'entrée',
              quantite: built.stockToApply,
              raison: 'Import Excel',
              description: 'Stock initial importe'
            };
            await materialService.addStockEntry(createdMaterial.id, stockOperation);
          }

          fallbackSuccess += 1;
        } catch (rowError) {
          const rowMessage = rowError instanceof Error ? rowError.message : 'Erreur import';
          fallbackErrors.push(`Ligne ${index + (hasHeaders ? 2 : 1)}: ${rowMessage}`);
        }
      }

      if (fallbackSuccess > 0) {
        const refreshed = await dataSyncService.getMaterials(true);
        const restored = deletionService.applyRestorePosition('materiel', refreshed);
        setMateriels(restored);
        await refreshDeletedMaterials();
      }

      const timeoutMatch = /expired transaction|timeout.*transaction|interactive transaction timeout|prisma\.material\.update/i.test(message.toLowerCase());
      const fallbackInfo: string[] = timeoutMatch
        ? ['Le backend a depasse le delai de transaction; import relance en mode ligne par ligne.']
        : [];

      const ignoredRefs = droppedReferences + fallbackDroppedReferences;
      if (ignoredRefs > 0) {
        fallbackInfo.push(`${ignoredRefs} reference(s) deja existante(s) ont ete ignoree(s) pour eviter le blocage d'import.`);
      }

      return { success: fallbackSuccess, failed: fallbackErrors.length, errors: [...fallbackInfo, ...fallbackErrors] };
    }
  };

  return (
    <div className="gestion-materiel">
      <NavigationVerticale
        selectedType={selectedType}
        onTypeSelect={(type) => {
          setSelectedType(type);
          setSelectedMateriel(null);
          setSelectedMaterialIds([]);
        }}
        onAddMateriel={() => setShowAddModal(true)}
      />

      <main className="content-area">
        <div className="content-header">
          <div>
            <h2>
              {selectedMateriel
                ? `Details : ${selectedMateriel.nom}`
                : `${getTypeLabel(selectedType)}`
              }
            </h2>
          </div>
          <div className="header-actions">
            {!selectedMateriel && (
              <>
                <button className="btn-back" onClick={() => setShowPasteModal(true)}>
                  <FiClipboard size={15} />
                  {' '}
                  Copie/Coller
                </button>
                {selectedMaterialIds.length > 0 && (
                  <button className="btn-delete-all" onClick={handleDeleteSelectedMateriels}>
                    <FiTrash2 size={15} />
                    {' '}
                    Supprimer la selection ({selectedMaterialIds.length})
                  </button>
                )}
              </>
            )}
            {selectedMateriel && (
              <button
                className="btn-back"
                onClick={handleBackToList}
              >
                Retour a la liste
              </button>
            )}
            <div className="materiel-count">
              {filteredMateriels.length} element(s)
            </div>
          </div>
        </div>
        {loading && <div className="empty-state"><p>Chargement des materiels...</p></div>}
        {apiError && <div className="empty-state"><p>{apiError}</p></div>}
        {!selectedMateriel && deletedMaterialItems.length > 0 && (
          <div className="deleted-material-alert">
            <strong>{deletedMaterialItems.length} materiel(s) en corbeille</strong>
            <p>
              Ils existent encore en base (soft delete) et peuvent bloquer des references a l'import.
            </p>
          </div>
        )}

        {!selectedMateriel && (
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher par titre, reference, nom..."
            size="small"
            align="right"
          />
        )}

        {selectedMateriel ? (
          <MaterielDetail
            materiel={selectedMateriel}
            onUpdateEtat={handleUpdateEtat}
            onManageStock={() => setShowStockModal(true)}
          />
        ) : (
          <MaterielTable
            materiels={getDisplayMateriels()}
            type={selectedType}
            onSelectMateriel={handleSelectMateriel}
            onUpdateEtat={handleUpdateEtat}
            onManageStock={(materiel) => {
              setSelectedMateriel(materiel);
              setShowStockModal(true);
            }}
            onDeleteMateriel={handleDeleteMateriel}
            selectedMaterialIds={selectedMaterialIds}
            onToggleMaterialSelection={handleToggleMaterialSelection}
          />
        )}
      </main>

      {showAddModal && (
        <AddMaterielModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddMateriel}
        />
      )}

      {showStockModal && selectedMateriel && (
        <StockOperationModal
          materiel={selectedMateriel}
          onClose={() => setShowStockModal(false)}
          onAddOperation={handleAddStockOperation}
        />
      )}

      <PasteImportModal
        isOpen={showPasteModal}
        title={`Import Excel - Materiel (${getTypeLabel(selectedType).trim()})`}
        subtitle="Collez vos lignes Excel pour ajouter plusieurs materiels du type courant."
        columns={getPasteColumns()}
        onClose={() => setShowPasteModal(false)}
        onImport={handlePasteImport}
      />
    </div>
  );
};

export default GestionMaterielPage;
