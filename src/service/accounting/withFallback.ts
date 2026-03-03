/**
 * Utilitaire pour gérer les fallbacks entre endpoint principal et alias
 * Documentation: /accounting/* est principal, /comptabilite/* est alias
 */

export const withFallback = async <T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  context: string
): Promise<T> => {
  try {
    return await primary();
  } catch (error) {
    console.warn(`${context}: Primary endpoint failed, trying fallback:`, error);
    return fallback();
  }
};

/**
 * Crée des endpoints primaire et alias pour accounting
 */
export const createAccountingEndpoints = (path: string) => {
  return {
    primary: path.replace(/^\//, '/accounting/'),
    alias: path.replace(/^\//, '/comptabilite/')
  };
};

/**
 * Extrait un array depuis la réponse API qui peut être:
 * - Un array direct: [...]
 * - Envelopp dans .data: {data: [...]}
 * - Envelopp dans .items: {items: [...]}
 * - Envelopp dans .entries: {entries: [...]}
 */
export const extractArrayFromResponse = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.entries)) return response.entries;
  return [];
};
