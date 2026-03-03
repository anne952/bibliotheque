// utils/sycebnlFormat.ts
import { colors } from '../config/colors';
import ExcelJS from 'exceljs';

// Formattage des montants selon SYCEBNL
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
};

// Validation des comptes SYCEBNL
export const validateAccountNumber = (accountNumber: string): boolean => {
  const pattern = /^[1-9][0-9]{5}$/;
  return pattern.test(accountNumber);
};

// Catégorisation des comptes selon SYCEBNL
export const getAccountCategory = (accountNumber: string): string => {
  const firstDigit = accountNumber.charAt(0);
  switch (firstDigit) {
    case '1': return 'Ressources durables';
    case '2': return 'Immobilisations';
    case '3': return 'Stocks et en-cours';
    case '4': return 'Tiers';
    case '5': return 'Trésorerie';
    case '6': return 'Charges';
    case '7': return 'Produits';
    case '8': return 'Autres charges/produits';
    default: return 'Non classé';
  }
};

// Génération des données pour le bilan SYCEBNL
export const generateBalanceSheetData = (entries: any[]) => {
  // Calcul des totaux par catégorie
  const totals = {
    assets: {
      immobilized: 0,
      current: 0,
      cash: 0,
    },
    liabilities: {
      equity: 0,
      provisions: 0,
      debts: 0,
    },
  };
  
  // Implémentation simplifiée
  entries.forEach(entry => {
    // Logique de catégorisation à implémenter
  });
  
  return totals;
};

// Export Excel format SYCEBNL
export const exportToExcel = async (data: any[], fileName: string) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('SYCEBNL');

  const firstRow = data[0] || {};
  worksheet.columns = Object.keys(firstRow).map((key) => ({
    header: key,
    key,
  }));

  worksheet.addRows(data);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// Export PDF format SYCEBNL
export const exportToPDF = (elementId: string, fileName: string) => {
  // Utiliser html2pdf ou jsPDF
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const opt = {
    margin: [10, 10, 10, 10],
    filename: `${fileName}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  // @ts-ignore
  html2pdf().set(opt).from(element).save();
};

// Formattage des dates selon SYCEBNL
export const formatDateSYCEBNL = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Calcul des ratios financiers SYCEBNL
export const calculateFinancialRatios = (balanceSheet: any, incomeStatement: any) => {
  return {
    solvency: balanceSheet.liabilities.equity / balanceSheet.liabilities.total * 100,
    liquidity: balanceSheet.assets.cash / balanceSheet.liabilities.debts * 100,
    profitability: incomeStatement.netIncome / incomeStatement.totalRevenue * 100,
  };
};

// Vérification de l'équilibre du bilan
export const isBalanceSheetBalanced = (assets: number, liabilities: number): boolean => {
  return Math.abs(assets - liabilities) < 1; // Tolérance de 1 FCFA
};

// Génération du numéro de registre SYCEBNL
export const generateRegisterNumber = (year: number, entityId: string): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `REG-${year}-${entityId}-${timestamp.slice(-6)}`;
};

// Formatage pour impression SYCEBNL
export const prepareForPrint = (data: any) => {
  return {
    ...data,
    formattedDate: formatDateSYCEBNL(new Date()),
    footer: `Document généré le ${formatDateSYCEBNL(new Date())} - Conforme SYCEBNL OHADA 2023`,
    header: `ENTITÉ À BUT NON LUCRATIF - COMPTABILITÉ SYCEBNL`,
  };
};
