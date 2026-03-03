// utils/colors.ts
export const colors = {
  sycebnl: {
    primary: '#003366',
    secondary: '#336699',
    accent: '#FF6B35',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#F44336',
    info: '#2196F3',
  },
  orange: {
    pale: '#FFE5D4',
    light: '#FFB885',
    medium: '#FF9347',
    dark: '#E67E22',
  },
  neutral: {
    white: '#FFFFFF',
    lightGray: '#F5F5F5',
    gray: '#9E9E9E',
    darkGray: '#616161',
    black: '#212121',
  },
  semantic: {
    asset: '#4CAF50',
    liability: '#F44336',
    equity: '#2196F3',
    income: '#FF9800',
    expense: '#9C27B0',
  }
};

// Fonction utilitaire pour les dégradés
export const gradients = {
  primary: `linear-gradient(135deg, ${colors.sycebnl.primary}, ${colors.sycebnl.secondary})`,
  accent: `linear-gradient(135deg, ${colors.orange.medium}, ${colors.sycebnl.accent})`,
  success: `linear-gradient(135deg, ${colors.sycebnl.success}, #66BB6A)`,
  warning: `linear-gradient(135deg, ${colors.sycebnl.warning}, #FFB74D)`,
};

// Thème sombre optionnel
export const darkTheme = {
  background: '#1A1A1A',
  surface: '#2D2D2D',
  text: '#FFFFFF',
  border: '#404040',
};