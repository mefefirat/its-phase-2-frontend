import { create } from 'zustand'

type MenuState = {
  selected: string;
  setSelected: (id: string) => void;
};

type SubMenuState = {
    selected: string;
    setSubMenuSelected: (id: string) => void;
  };

type LayoutEditorState = {
  isPopupOpen: boolean;
  openLayoutEditorPopup: () => void;
  closeLayoutEditorPopup: () => void;
};

type SidebarState = {
  width: number;
  setWidth: (width: number) => void;
  closeSidebar: () => void;
  openSidebar: () => void;
};

export const useMenuStore = create<MenuState>(set => ({
  selected: 'its-phase-2',
  setSelected: id => set({ selected: id }),
}));

export const useSubMenuStore = create<SubMenuState>(set => ({
    selected: 'locations',
    setSubMenuSelected: id => set({ selected: id }),
}));

export const useLayoutEditorStore = create<LayoutEditorState>(set => ({
  isPopupOpen: false,
  openLayoutEditorPopup: () => set({ isPopupOpen: true }),
  closeLayoutEditorPopup: () => set({ isPopupOpen: false }),
}));

export const useSidebarStore = create<SidebarState>(set => ({
  width: 282,
  setWidth: (width: number) => set({ width }),
  closeSidebar: () => {
    const oraxaiWeb = document.querySelector('.oraxai-web');
    if (!oraxaiWeb?.classList.contains('oraxai-web-collapsed')) {
      oraxaiWeb?.classList.add('oraxai-web-collapsed');
    }
    set({ width: 15 });
  },
  openSidebar: () => {
    const oraxaiWeb = document.querySelector('.oraxai-web');
    if (oraxaiWeb?.classList.contains('oraxai-web-collapsed')) {
      oraxaiWeb.classList.remove('oraxai-web-collapsed');
    }
    set({ width: 282 });
  },
}));
  