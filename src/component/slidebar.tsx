import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { 
  FiGrid, FiBook, FiBox, FiDollarSign, FiFileText, 
  FiUsers, FiSettings, FiLogOut, FiChevronLeft, 
  FiChevronRight, FiMenu, 
} from 'react-icons/fi';
import { useAuthContext } from '../context/AuthContext';

export interface SlidebarProps {
  activeItem?: string;
  onMenuClick?: (itemId: string) => void;
  onLogout?: () => void;
  collapsed: boolean;          // ← on reçoit l'état du parent
  onToggle: () => void;         // ← on reçoit la fonction pour changer l'état
}

interface MenuItemData {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  isLogout?: boolean;
}

const menuItems: Omit<MenuItemData, 'icon'>[] = [
  { id: 'dashboard', label: 'Tableau de bord', href: '/dashboard' },
  { id: 'library', label: 'Bibliothèque', href: '/bibliotheque' },
  { id: 'material', label: 'Matériel', href: '/materiel' },
  { id: 'accounting', label: 'Comptabilité', href: '/finance' },
  { id: 'report', label: 'Rapport', href: '/rapport' },
  { id: 'settings', label: 'Paramètres', href: '/parametre' },
  { id: 'logout', label: 'Déconnexion', isLogout: true },
];

const iconMap: Record<string, React.ReactNode> = {
  'dashboard': <FiGrid size={20} />,
  'library': <FiBook size={20} />,
  'material': <FiBox size={20} />,
  'accounting': <FiDollarSign size={20} />,
  'report': <FiFileText size={20} />,
  'settings': <FiSettings size={20} />,
  'logout': <FiLogOut size={20} />,
};

const Slidebar: React.FC<SlidebarProps> = ({
  activeItem = 'dashboard',
  onMenuClick,
  onLogout,
  collapsed,
  onToggle,
}) => {
  // Utilisation directe des props collapsed et onToggle
  const [isMobile, setIsMobile] = useState(false);
  const [activeMenu, setActiveMenu] = useState(activeItem);
  const { logout } = useAuthContext();

  const handleLogout = async () => {
    await logout();

    if (window.api?.quit) {
      await window.api.quit();
      return;
    }

    window.close();
  };

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Sur mobile, on force collapsed à true au montage
      if (mobile && !collapsed) {
        // On pourrait appeler onToggle ici si nécessaire
        // Mais généralement on laisse le parent gérer cet état
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [collapsed]);

  const handleMenuClick = (item: MenuItemData) => {
    if (item.isLogout) {
      handleLogout();
    } else {
      setActiveMenu(item.id);
      onMenuClick?.(item.id);
      
      // Sur mobile, fermer le sidebar après avoir cliqué sur un élément
      if (isMobile) {
        onToggle();
      }
    }
  };

  const regularItems = menuItems.filter((item) => !item.isLogout);
  const logoutItem = menuItems.find((item) => item.isLogout);

  // Gestion spécifique pour le bouton mobile
  const handleMobileToggle = () => {
    onToggle();
  };

  return (
    <>
      {/* Overlay pour mobile */}
      {isMobile && !collapsed && (
        <MobileOverlay onClick={handleMobileToggle} />
      )}

      {/* Bouton toggle pour mobile (visible seulement quand collapsed) */}
      {isMobile && collapsed && (
        <MobileToggleButton onClick={handleMobileToggle}>
          <FiMenu size={24} />
        </MobileToggleButton>
      )}

      <SidebarContainer $collapsed={collapsed}>
        {/* En-tête */}
        <SidebarHeader $collapsed={collapsed}>
          {!collapsed && <Title>Bibliothèque VGR</Title>}
          
          {/* Le bouton collapse est visible sur desktop, sur mobile on utilise le bouton hamburger */}
          {!isMobile && (
            <CollapseButton
              onClick={onToggle}
              title={collapsed ? 'Développer' : 'Réduire'}
              aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
            >
              {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
            </CollapseButton>
          )}
        </SidebarHeader>

        {/* Menu principal */}
        <MenuContainer>
          {regularItems.map((item) => (
            <MenuItemLink
              key={item.id}
              to={item.href!}
              $active={activeMenu === item.id ? 1 : 0}
              onClick={() => handleMenuClick(item as MenuItemData)}
              title={collapsed ? item.label : ''}
              aria-label={item.label}
              aria-current={activeMenu === item.id ? 'page' : undefined}
            >
              <IconWrapper $active={activeMenu === item.id ? 1 : 0}>
                {iconMap[item.id]}
              </IconWrapper>
              {!collapsed && <MenuItemLabel>{item.label}</MenuItemLabel>}
            </MenuItemLink>
          ))}
        </MenuContainer>

        {/* Déconnexion */}
        {logoutItem && (
          <LogoutSection>
            <LogoutLink
              to={logoutItem.href || '#'}
              $active={activeMenu === logoutItem.id ? 1 : 0}
              onClick={() => handleMenuClick(logoutItem as MenuItemData)}
              title={collapsed ? logoutItem.label : ''}
              aria-label={logoutItem.label}
            >
              <IconWrapper $active={activeMenu === logoutItem.id ? 1 : 0}>
                {iconMap.logout}
              </IconWrapper>
              {!collapsed && <MenuItemLabel>{logoutItem.label}</MenuItemLabel>}
            </LogoutLink>
          </LogoutSection>
        )}
      </SidebarContainer>
    </>
  );
};

// ============ STYLED COMPONENTS ============

const MobileOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;

  @media (max-width: 767px) {
    display: block;
  }
`;

const MobileToggleButton = styled.button`
  position: fixed;
  top: 16px;
  left: 16px;
  background: #DE4D2F;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;

  &:hover {
    background: #B33319;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (min-width: 768px) {
    display: none;
  }
`;

const SidebarContainer = styled.aside<{
  $collapsed: boolean;
}>`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background: linear-gradient(180deg, #fde9e3 0%, #fbd0bb 100%);
  color: #DE4D2F;
  width: ${(props) => (props.$collapsed ? '70px' : '250px')};
  transition: width 0.3s ease, transform 0.3s ease;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(210, 77, 25, 0.15);
  z-index: 1000;
  overflow: hidden;

  @media (max-width: 767px) {
    transform: ${(props) => (props.$collapsed ? 'translateX(-100%)' : 'translateX(0)')};
    width: 250px;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 480px) {
    width: 85vw;
  }
`;

const SidebarHeader = styled.div<{ $collapsed: boolean }>`
  padding: 20px 16px;
  border-bottom: 1px solid rgba(210, 96, 25, 0.2);
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.$collapsed ? 'center' : 'space-between')};
  flex-shrink: 0;
  gap: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #DE4D2F;
  letter-spacing: -0.5px;
  white-space: nowrap;
  flex: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const CollapseButton = styled.button`
  background: rgba(210, 71, 25, 0.1);
  border: 1px solid rgba(210, 90, 25, 0.2);
  cursor: pointer;
  font-size: 1.5rem;
  color: #DE4D2F;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(210, 93, 25, 0.2);
    color: #DE4D2F;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const MenuContainer = styled.nav`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 8px;

  /* Scrollbar personnalisée */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(210, 108, 25, 0.1);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(210, 84, 25, 0.5);
    border-radius: 10px;
    min-height: 40px;

    &:hover {
      background: rgba(210, 111, 25, 0.7);
    }
  }

  scrollbar-width: thin;
  scrollbar-color: rgba(210, 118, 25, 0.5) rgba(210, 71, 25, 0.1);
`;

const IconWrapper = styled.span<{ $active: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.5rem;
  color: ${(props) => (props.$active ? 'inherit' : '#DE4D2F')};
`;

const MenuItemLabel = styled.span`
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LogoutSection = styled.div`
  margin-top: auto;
  padding: 16px 8px;
  border-top: 1px solid rgba(210, 96, 25, 0.2);
`;

const MenuItemLink = styled(Link)<{ $active: number }>`
  width: 100%;
  text-decoration: none;
  background: ${(props) => (props.$active ? '#DE4D2F' : 'transparent')};
  color: ${(props) => (props.$active ? '#fff' : '#DE4D2F')};
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  font-weight: ${(props) => (props.$active ? 600 : 500)};
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 0;
    background: #DE4D2F;
    border-radius: 0 4px 4px 0;
    transition: height 0.3s ease;
  }

  ${(props) => props.$active && `
    &::before {
      height: 60%;
    }
  `}

  &:hover {
    background: ${(props) =>
      props.$active ? '#B33319' : 'rgba(210, 99, 25, 0.1)'};
    transform: translateX(4px);
  }

  &:active {
    transform: translateX(4px) scale(0.98);
  }
`;

const LogoutLink = styled(MenuItemLink)<{ $active: number }>`
  color: ${(props) => (props.$active ? '#fff' : '#d32f2f')};

  &::before {
    background: #d32f2f;
  }

  ${IconWrapper} {
    color: ${(props) => (props.$active ? 'inherit' : '#d32f2f')};
  }

  &:hover {
    background: ${(props) =>
      props.$active ? '#c62828' : 'rgba(211, 47, 47, 0.1)'};
  }
`;

export default Slidebar;
