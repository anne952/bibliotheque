import React, { useState, useEffect } from 'react';
import { deletionService, isDeletionBackendMissingError, type DeletedItemRecord } from '../../service/deletionService';
import { dataSyncService } from '../../service/dataSyncService';

interface DeletedItem {
  id: string;
  name: string;
  type: string;
  deletedAt: Date;
  restored: boolean;
  originalTable?: string;
  originalId?: string;
  data?: Record<string, unknown> | null;
  expiresAt?: string;
  restoredAt?: string | null;
  restoredById?: string | null;
  raw?: Record<string, unknown>;
}

const RecentDeletions: React.FC = () => {
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [error, setError] = useState('');

  const toViewModel = (items: DeletedItemRecord[]): DeletedItem[] => {
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      deletedAt: new Date(item.deletedAt),
      restored: item.restored,
      originalTable: item.originalTable,
      originalId: item.originalId,
      data: item.data ?? null,
      expiresAt: item.expiresAt,
      restoredAt: item.restoredAt ?? null,
      restoredById: item.restoredById ?? null,
      raw: item.raw
    }));
  };

  const loadDeletedItems = async () => {
    try {
      setError('');
      const items = await deletionService.listDeletedItems();
      setDeletedItems(toViewModel(items));
    } catch (err) {
      if (isDeletionBackendMissingError(err)) {
        setError('');
      } else {
        setError(err instanceof Error ? err.message : 'Chargement des suppressions impossible');
      }
      setDeletedItems([]);
    }
  };

  const getDaysSinceDeletion = (deletedAt: Date): number => {
    const diffTime = Date.now() - deletedAt.getTime();
    if (!Number.isFinite(diffTime) || diffTime <= 0) return 0;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDeletedAt = (deletedAt: Date) => {
    if (Number.isNaN(deletedAt.getTime())) return 'Date inconnue';
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(deletedAt);
  };

  const getElapsedLabel = (deletedAt: Date) => {
    const days = getDaysSinceDeletion(deletedAt);
    if (days <= 0) return "Supprime aujourd'hui";
    if (days === 1) return 'Supprime il y a 1 jour';
    return `Supprime il y a ${days} jours`;
  };

  const getTypeLabel = (type: DeletedItem['type']) => {
    const labels: Record<string, string> = {
      produit: 'Produit',
      utilisateur: 'Utilisateur',
      categorie: 'Categorie',
      commande: 'Commande',
      materiel: 'Materiel',
      rapport: 'Rapport',
      emprunt: 'Emprunt',
      visite: 'Visiteur',
      vente: 'Vente',
      'dons-financier': 'Don financier',
      'dons-materiel': 'Don materiel',
      achat: 'Achat',
      'comptabilite-journal': 'Ecriture comptable',
      'comptabilite-caisse': 'Operation caisse',
      'comptabilite-donateur': 'Donateur'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: DeletedItem['type']) => {
    if (['emprunt', 'visite', 'utilisateur', 'comptabilite-donateur'].includes(type)) return 'type-utilisateur';
    if (['materiel', 'vente', 'achat', 'produit'].includes(type)) return 'type-produit';
    if (['comptabilite-journal', 'comptabilite-caisse'].includes(type)) return 'type-commande';
    if (['rapport', 'categorie'].includes(type)) return 'type-categorie';
    return 'type-commande';
  };

  const getSourceLabel = (item: DeletedItem) => {
    if (item.originalTable && item.originalTable.trim()) return item.originalTable;
    const type = item.type;
    if (['emprunt', 'visite', 'vente', 'dons-financier', 'dons-materiel', 'achat'].includes(type)) return 'Bibliotheque';
    if (['materiel'].includes(type)) return 'Materiel';
    if (['comptabilite-journal', 'comptabilite-caisse', 'comptabilite-donateur'].includes(type)) return 'Comptabilite';
    if (['rapport'].includes(type)) return 'Rapports';
    return 'Application';
  };

  const getDisplayName = (item: DeletedItem) => {
    const name = String(item.name || '')
      .replace(/\s+[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\s*$/i, '')
      .replace(/\s+[A-Za-z0-9_-]{20,}\s*$/i, '')
      .trim();
    if (!name || name.toLowerCase() === 'element supprime') {
      return `${getTypeLabel(item.type)} supprime`;
    }
    return name;
  };

  const formatFieldValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') {
      const maybeDate = new Date(value);
      if (!Number.isNaN(maybeDate.getTime()) && /T\d{2}:\d{2}:\d{2}/.test(value)) {
        return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(maybeDate);
      }
      return value;
    }
    if (Array.isArray(value)) return `${value.length} element(s)`;
    return String(value);
  };

  const getDataPreviewEntries = (item: DeletedItem) => {
    const data = item.data && typeof item.data === 'object' ? item.data : {};
    const orderedKeys = [
      'name',
      'title',
      'reference',
      'type',
      'status',
      'currentStock',
      'serialNumber',
      'language',
      'category',
      'location',
      'description',
      'createdAt',
      'updatedAt'
    ];

    const preferred = orderedKeys
      .filter((key) => key in data)
      .map((key) => ({ key, value: (data as Record<string, unknown>)[key] }));

    const extra = Object.entries(data as Record<string, unknown>)
      .filter(([key]) => !orderedKeys.includes(key))
      .slice(0, Math.max(0, 8 - preferred.length))
      .map(([key, value]) => ({ key, value }));

    const entries = [...preferred, ...extra].filter((entry) => entry.value !== null && entry.value !== undefined && entry.value !== '');
    if (entries.length > 0) return entries.slice(0, 8);
    return [{ key: 'nom', value: getDisplayName(item) }, { key: 'type', value: getTypeLabel(item.type) }];
  };

  const handleRestore = async (id: string) => {
    try {
      setError('');
      const items = await deletionService.restoreDeletedItem(id);
      setDeletedItems(toViewModel(items));

      const refreshed = await Promise.allSettled([
        dataSyncService.getLibraryData(true),
        dataSyncService.getMaterials(true),
        dataSyncService.getReports7(true),
        dataSyncService.getJournalEntries(true),
        dataSyncService.getCaisseEntries(true),
        dataSyncService.getDonateurs(true)
      ]);

      const library = refreshed[0].status === 'fulfilled' ? refreshed[0].value : null;
      if (library) {
        dataSyncService.setLibraryData({
          ...library,
          emprunts: deletionService.applyRestorePosition('emprunt', library.emprunts),
          visiteurs: deletionService.applyRestorePosition('visite', library.visiteurs),
          ventes: deletionService.applyRestorePosition('vente', library.ventes),
          donsFinanciers: deletionService.applyRestorePosition('dons-financier', library.donsFinanciers),
          donsMateriel: deletionService.applyRestorePosition('dons-materiel', library.donsMateriel),
          achats: deletionService.applyRestorePosition('achat', library.achats)
        } as typeof library);
      }

      const materials = refreshed[1].status === 'fulfilled' ? refreshed[1].value : null;
      if (materials) {
        dataSyncService.setMaterials(deletionService.applyRestorePosition('materiel', materials));
      }

      const reports = refreshed[2].status === 'fulfilled' ? refreshed[2].value : null;
      if (reports) {
        dataSyncService.setReports7(deletionService.applyRestorePosition('rapport', reports));
      }

      const journalEntries = refreshed[3].status === 'fulfilled' ? refreshed[3].value : null;
      if (journalEntries) {
        dataSyncService.setJournalEntries(deletionService.applyRestorePosition('comptabilite-journal', journalEntries));
      }

      const caisseEntries = refreshed[4].status === 'fulfilled' ? refreshed[4].value : null;
      if (caisseEntries) {
        dataSyncService.setCaisseEntries(deletionService.applyRestorePosition('comptabilite-caisse', caisseEntries));
      }

      const donateurs = refreshed[5].status === 'fulfilled' ? refreshed[5].value : null;
      if (donateurs) {
        dataSyncService.setDonateurs(deletionService.applyRestorePosition('comptabilite-donateur', donateurs));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restauration impossible');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      setError('');
      const items = await deletionService.permanentlyDeleteItem(id);
      setDeletedItems(toViewModel(items));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression definitive impossible');
    }
  };

  const handleCleanupExpired = async () => {
    try {
      setError('');
      const items = await deletionService.cleanupExpired(30);
      setDeletedItems(toViewModel(items));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nettoyage impossible');
    }
  };

  const handlePermanentDeleteAll = async () => {
    const active = deletedItems.filter((item) => !item.restored);
    if (active.length === 0) return;
    if (!window.confirm(`Supprimer definitivement ${active.length} element(s) de la corbeille ?`)) {
      return;
    }

    try {
      setError('');
      try {
        const purgedItems = await deletionService.purgeRecent();
        setDeletedItems(toViewModel(purgedItems));
        return;
      } catch {
        // fallback: suppression item par item si purge-recent indisponible
      }

      for (const item of active) {
        try {
          await deletionService.permanentlyDeleteItem(item.id);
        } catch {
          // continuer les autres
        }
      }
      const items = await deletionService.listDeletedItems();
      setDeletedItems(toViewModel(items));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression globale impossible');
    }
  };

  useEffect(() => {
    void loadDeletedItems();

    const interval = setInterval(() => {
      void (async () => {
        try {
          const cleaned = await deletionService.cleanupExpired(30);
          setDeletedItems(toViewModel(cleaned));
        } catch {
          // Ignore background errors
        }
      })();
    }, 3600000);

    return () => clearInterval(interval);
  }, []);

  const activeDeletions = deletedItems.filter(item => !item.restored);
  const restoredItems = deletedItems.filter(item => item.restored);

  return (
    <div className="recent-deletions-card">
      <div className="section-header">
        <h2 className="section-title">Suppressions recentes</h2>
        <div className="section-subtitle">
          Les elements supprimes restent ici pendant 30 jours avant suppression definitive.
        </div>
      </div>

      {error && <div className="empty-state"><div className="empty-text">{error}</div></div>}

      {activeDeletions.length > 0 ? (
        <div className="deletions-list">
          {activeDeletions.map(item => {
            const daysSinceDeletion = getDaysSinceDeletion(item.deletedAt);
            const daysRemaining = 30 - daysSinceDeletion;
            const isExpired = daysRemaining <= 0;

            return (
              <div key={item.id} className={`deletion-item ${isExpired ? 'expired' : ''}`}>
                <div className="deletion-info">
                  <div className="deletion-name">{getDisplayName(item)}</div>
                  <div className="deletion-details">
                    <span className={`deletion-type ${getTypeColor(item.type)}`}>
                      {getTypeLabel(item.type)}
                    </span>
                    <span className="deletion-date">
                      {getElapsedLabel(item.deletedAt)} - {formatDeletedAt(item.deletedAt)}
                    </span>
                    <span className="deletion-date">
                      Source: {getSourceLabel(item)}
                    </span>
                  </div>
                  <div className="deletion-timer">
                    <div className="timer-label">
                      {isExpired ? 'Expire' : `Expire dans ${daysRemaining} jour(s)`}
                    </div>
                    <div className="timer-bar">
                      <div
                        className="timer-progress"
                        style={{ width: `${Math.max(0, Math.min(100, (daysSinceDeletion / 30) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="deletion-data-card">
                    <div className="deletion-data-meta">
                      <span><strong>Table originale:</strong> {getSourceLabel(item)}</span>
                      <span><strong>ID original:</strong> {item.originalId || '-'}</span>
                    </div>
                    <div className="deletion-data-grid">
                      {getDataPreviewEntries(item).map((entry) => (
                        <div key={`${item.id}-${entry.key}`} className="deletion-data-row">
                          <span className="deletion-data-key">{entry.key}</span>
                          <span className="deletion-data-value">{formatFieldValue(entry.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="deletion-actions">
                  {!isExpired && (
                    <button
                      className="btn-restore"
                      onClick={() => { void handleRestore(item.id); }}
                    >
                      Restaurer
                    </button>
                  )}
                  <button
                    className="btn-permanent-delete"
                    onClick={() => { void handlePermanentDelete(item.id); }}
                  >
                    {isExpired ? 'Supprimer' : 'Supprimer maintenant'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">Supp.</div>
          <div className="empty-text">Aucune suppression recente</div>
        </div>
      )}

      {restoredItems.length > 0 && (
        <div className="restored-section">
          <h3 className="restored-title">Elements restaures</h3>
          <div className="restored-list">
            {restoredItems.map(item => (
              <div key={item.id} className="restored-item">
                <span className="restored-name">{getDisplayName(item)}</span>
                <span className="restored-type">{getTypeLabel(item.type)}</span>
                <span className="restored-badge">Restaure</span>
                <div className="deletion-data-card restored-data">
                  <div className="deletion-data-meta">
                    <span><strong>Table originale:</strong> {getSourceLabel(item)}</span>
                    <span><strong>ID original:</strong> {item.originalId || '-'}</span>
                  </div>
                  <div className="deletion-data-grid">
                    {getDataPreviewEntries(item).map((entry) => (
                      <div key={`${item.id}-restored-${entry.key}`} className="deletion-data-row">
                        <span className="deletion-data-key">{entry.key}</span>
                        <span className="deletion-data-value">{formatFieldValue(entry.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="deletions-actions">
        <button className="btn-permanent-delete" onClick={() => { void handlePermanentDeleteAll(); }}>
          Supprimer tout
        </button>
        <button className="btn-cleanup" onClick={() => { void handleCleanupExpired(); }}>
          Nettoyer les elements expires
        </button>
      </div>
    </div>
  );
};

export default RecentDeletions;
