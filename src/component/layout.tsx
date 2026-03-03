// Layout.tsx
import React, { useEffect, useState } from 'react';
import Slidebar from '../component/slidebar';
import { Outlet } from 'react-router-dom';
import { dataSyncService } from '../service/dataSyncService';

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidthOpen = 250;
  const marginWhenClosed = 35;

  useEffect(() => {
    dataSyncService.preloadForApp();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Slidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />

      <main
        style={{
          flex: 1,
          marginLeft: collapsed ? `${marginWhenClosed}px` : `${sidebarWidthOpen}px`,
          padding: '24px',
          transition: 'margin-left 0.35s ease',
          background: '#fafafa'
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
