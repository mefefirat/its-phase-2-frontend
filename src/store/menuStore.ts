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
  