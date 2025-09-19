// src/layouts/MainLayout.tsx (Final Optimized Version)
import { useEffect, useState } from 'react';
import { AppShell, Group, Button } from '@mantine/core';
import { useLocation } from 'react-router-dom';
import { menuConfig } from '@/constants/menuConfig';
import { MainMenuButton } from '@/components/ui/web/menu/MainMenuButton';
import { SubMenu } from '@/components/ui/web/menu/SubMenu';
import { Breadcrumb } from '@/components/ui/web/layout/Breadcrumb';
import { useMenu } from '@/hooks/useMenu';
import { useLayoutEditorStore } from '@/store/menuStore';
import type { ReactNode } from 'react';
import { Header } from '../ui/web/layout/Header';

interface MainLayoutProps { 
  children: ReactNode; 
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  
  const {
    selected,
    selectedSubmenu,
    handleNavigate,
    handleMainMenuClick,
    getActiveMenuItem,
    updateMenuFromPath
  } = useMenu();

  const { isPopupOpen, closeLayoutEditorPopup } = useLayoutEditorStore();
  const [width, setWidth] = useState(282);
  
  
  // URL değişikliklerinde menü durumunu güncelle
  useEffect(() => {
    updateMenuFromPath(location.pathname);
  }, [location.pathname, updateMenuFromPath]);

  // Window resize listener - 990px'den küçük olduğunda collapse yap
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 990) {
        const oraxaiWeb = document.querySelector('.oraxai-web');
        if (oraxaiWeb && !oraxaiWeb.classList.contains('oraxai-web-collapsed')) {
          oraxaiWeb.classList.add('oraxai-web-collapsed');
          setWidth(15);
        }
      }
      if (window.innerWidth > 990) {
        const oraxaiWeb = document.querySelector('.oraxai-web');
        if (oraxaiWeb && oraxaiWeb.classList.contains('oraxai-web-collapsed')) {
          oraxaiWeb.classList.remove('oraxai-web-collapsed');
          setWidth(282);
        }
      }                                             
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const activeMenuItem = getActiveMenuItem();

  const changeCollapsed = () => {
    const oraxaiWeb = document.querySelector('.oraxai-web');
    if (oraxaiWeb?.classList.contains('oraxai-web-collapsed')) {
      oraxaiWeb.classList.remove('oraxai-web-collapsed');
      setWidth(282);
    } else {
      oraxaiWeb?.classList.add('oraxai-web-collapsed');
      setWidth(15);
    }
  }

  return (
    <>
      <AppShell
        header={{ height: 48 }}
        navbar={{ width: width, breakpoint: 0 }}
        padding="md"
        withBorder={false}
        className="oraxai-web"
      >
        {/* Header */}
        <AppShell.Header 
          className="header" 
          style={{
            backgroundColor: '#ebebeb', 
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
          }}
        >
          <Header />
        </AppShell.Header>

        {/* Navbar */}
        <AppShell.Navbar className="app-shell-navbar">
          <Button className="sub-menu-handle" onClick={() => changeCollapsed()}></Button>
          {/* Ana Menü */}


          {/* Alt Menü */}
          <AppShell.Section 
            className="sub-menu-section"
            style={{
              backgroundColor: '#F5F5F5', 
              left: '0', 
              height: '100%', 
              width: '282px', 
              position: 'fixed', 
              borderRight: '1px solid rgba(0, 0, 0, 0.06)',
              overflowY: 'auto'
            }}
          >
            {activeMenuItem && (
              <SubMenu
                menuItem={activeMenuItem}
                selectedSubmenu={selectedSubmenu}
                onNavigate={handleNavigate}
              />
            )}
          </AppShell.Section>
        </AppShell.Navbar>

        {/* Ana İçerik */}
        <AppShell.Main className="main-content">
          <Breadcrumb
            isDefinitions={location.pathname.startsWith('/definitions')}
          />
          {children}
        </AppShell.Main>
      </AppShell>

     
    </>
  );
}