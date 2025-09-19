import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenuStore, useSubMenuStore } from '../store/menuStore';
import { menuConfig } from '@/constants/menuConfig';

export const useMenu = () => {
  const navigate = useNavigate();
  const setSelected = useMenuStore(state => state.setSelected);
  const selected = useMenuStore(state => state.selected);
  const setSubMenuSelected = useSubMenuStore(state => state.setSubMenuSelected);
  const selectedSubmenu = useSubMenuStore(state => state.selected);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    setSubMenuSelected(path);
  }, [navigate, setSubMenuSelected]);

  const handleMainMenuClick = useCallback((menuId: string) => {
    setSelected(menuId);
    
    // Özel navigasyon durumları
    if (menuId === 'definitions') {
      handleNavigate('/definitions/facilities');
    } else if (menuId === 'operation') {
      handleNavigate('/operations/manual-entry');
    } else if (menuId === 'tracking') {
      handleNavigate('/tracking/order-tracking');
    } else if (menuId === 'notification') {
      handleNavigate('/notifications/notifications');
    } else if (menuId === 'its-phase-2') {
      handleNavigate('/its-phase-2');
    }
  }, [setSelected, handleNavigate]);

  const getActiveMenuItem = useCallback(() => {
    return menuConfig.find(item => item.id === selected);
  }, [selected]);

  const findMenuItemByPath = useCallback((path: string) => {
    for (const menuItem of menuConfig) {
      for (const group of menuItem.groups) {
        const subItem = group.items.find(item => item.path === path);
        if (subItem) {
          return {
            menuItem,
            group,
            subItem
          };
        }
      }
    }
    return null;
  }, []);

  // Base path bulma fonksiyonu
  const findBasePath = useCallback((pathname: string) => {
    // Path'i parçalara ayır
    const pathParts = pathname.split('/').filter(Boolean);
    
    // En az 2 parça olmalı (örn: definitions, facilities)
    if (pathParts.length >= 2) {
      const basePath = `/${pathParts[0]}/${pathParts[1]}`;
      
      // Bu base path menuConfig'de var mı kontrol et
      for (const menuItem of menuConfig) {
        for (const group of menuItem.groups) {
          const subItem = group.items.find(item => item.path === basePath);
          if (subItem) {
            return basePath;
          }
        }
      }
    }
    
    return null;
  }, []);

  const updateMenuFromPath = useCallback((pathname: string) => {
    // Ana menü seçimini URL'e göre belirle
    if (pathname.startsWith('/definitions')) {
      // Definitions, ITS Faz-II ana menüsünün altında konumlanıyor
      setSelected('its-phase-2');
    } else if (pathname.startsWith('/operations')) {
      setSelected('operation');
    } else if (pathname.startsWith('/tracking') || pathname.startsWith('/reports')) {
      setSelected('tracking');
    } else if (pathname.startsWith('/notifications')) {
      setSelected('notification');
    } else if (pathname.startsWith('/its-phase-2')) {
      setSelected('its-phase-2');
    } else if (pathname.startsWith('/its')) {
      setSelected('its');
    }
    
    // Alt menü seçimini akıllıca güncelle
    // Önce tam path'i ara
    const exactMatch = findMenuItemByPath(pathname);
    if (exactMatch) {
      setSubMenuSelected(pathname);
    } else {
      // Tam eşleşme yoksa, base path'i bul
      const basePath = findBasePath(pathname);
      if (basePath) {
        setSubMenuSelected(basePath);
      }
    }
  }, [setSelected, setSubMenuSelected, findMenuItemByPath, findBasePath]);

  return {
    selected,
    selectedSubmenu,
    handleNavigate,
    handleMainMenuClick,
    getActiveMenuItem,
    findMenuItemByPath,
    updateMenuFromPath,
    findBasePath
  };
};