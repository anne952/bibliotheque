import { libraryService } from './libraryService';
import { materialService } from './materialService';
import { reportService } from './reportService';
import { journalComptableService } from './accounting/journalComptableService';
import { journalCaisseService } from './accounting/journalCaisseService';
import { donateursService } from './accounting/donateursService';

type CacheEntry<T> = {
  data: T | null;
  promise: Promise<T> | null;
};

type LibraryData = Awaited<ReturnType<typeof libraryService.loadLibraryData>>;
type MaterialData = Awaited<ReturnType<typeof materialService.getAllMaterials>>;
type ReportData = Awaited<ReturnType<typeof reportService.getRecentReports>>;
type JournalEntries = Awaited<ReturnType<typeof journalComptableService.getEcritures>>;
type CaisseEntries = Awaited<ReturnType<typeof journalCaisseService.getOperations>>;
type Donateurs = Awaited<ReturnType<typeof donateursService.getDonateurs>>;

const createEntry = <T>(): CacheEntry<T> => ({ data: null, promise: null });

const cache = {
  library: createEntry<LibraryData>(),
  materials: createEntry<MaterialData>(),
  reports7: createEntry<ReportData>(),
  journalEntries: createEntry<JournalEntries>(),
  caisseEntries: createEntry<CaisseEntries>(),
  donateurs: createEntry<Donateurs>()
};

const getOrLoad = async <T>(entry: CacheEntry<T>, loader: () => Promise<T>, force = false): Promise<T> => {
  if (!force && entry.data !== null) {
    return entry.data;
  }

  if (!force && entry.promise) {
    return entry.promise;
  }

  entry.promise = loader()
    .then((data) => {
      entry.data = data;
      return data;
    })
    .finally(() => {
      entry.promise = null;
    });

  return entry.promise;
};

export const dataSyncService = {
  preloadForApp() {
    void Promise.allSettled([
      this.getLibraryData(),
      this.getMaterials(),
      this.getReports7(),
      this.getJournalEntries(),
      this.getCaisseEntries(),
      this.getDonateurs()
    ]);
  },

  async getLibraryData(force = false) {
    return getOrLoad(cache.library, () => libraryService.loadLibraryData(), force);
  },

  setLibraryData(data: LibraryData) {
    cache.library.data = data;
  },

  async getMaterials(force = false) {
    return getOrLoad(cache.materials, () => materialService.getAllMaterials(), force);
  },

  setMaterials(data: MaterialData) {
    cache.materials.data = data;
  },

  async getReports7(force = false) {
    return getOrLoad(cache.reports7, () => reportService.getRecentReports(7), force);
  },

  setReports7(data: ReportData) {
    cache.reports7.data = data;
  },

  async getJournalEntries(force = false) {
    return getOrLoad(cache.journalEntries, () => journalComptableService.getEcritures(undefined), force);
  },

  setJournalEntries(data: JournalEntries) {
    cache.journalEntries.data = data;
  },

  async getCaisseEntries(force = false) {
    return getOrLoad(cache.caisseEntries, () => journalCaisseService.getOperations(null), force);
  },

  setCaisseEntries(data: CaisseEntries) {
    cache.caisseEntries.data = data;
  },

  async getDonateurs(force = false) {
    return getOrLoad(cache.donateurs, () => donateursService.getDonateurs(), force);
  },

  setDonateurs(data: Donateurs) {
    cache.donateurs.data = data;
  }
};
