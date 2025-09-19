import { create } from 'zustand';
import { notifications } from '@mantine/notifications';
import { fetchUsers, fetchUserById, createUser, updateUser, deleteUser, changeDefaultCompany, fetchUserDropdown, changePassword as changePasswordService } from '../services/userService';
import type { User } from '../types/user';

interface UserState {
  users: User[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  dropdownUsers: any[];
  fetchUsers: (page?: number, perPage?: number) => Promise<void>;
  fetchUserById: (userId: string) => Promise<User>;
  addUser: (userData: Partial<User>) => Promise<User>;
  editUser: (userId: string, userData: Partial<User>) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  changeDefaultCompany: (companyId: string) => Promise<boolean>;
  fetchUserDropdown: (group_name: string) => Promise<any[]>;
  changePassword: (userId: string, newPassword: string) => Promise<boolean>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,
  currentPage: 0,
  totalPages: 1,
  totalRecords: 0,
  dropdownUsers: [],

  fetchUsers: async (page = 0, perPage = 10) => {
    set({ loading: true });
    try {
      const response = await fetchUsers({ page, per_page: perPage });
      set({ 
        users: response.data,
        // API returns 1-based page; convert to 0-based for UI
        currentPage: Math.max(0, (response.page ?? 1) - 1),
        totalPages: response.total_pages ?? Math.ceil((response.total || 0) / perPage),
        totalRecords: response.total ?? 0
      });
    } catch (error) {
      notifications.show({
        title: 'Hata!',
        message: 'Kullanıcılar yüklenirken bir hata oluştu.',
        color: 'red',
        autoClose: 5000,
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchUserById: async (userId: string) => {
    try {
      const user = await fetchUserById(userId);
      return user;
    } catch (error) {
      notifications.show({
        title: 'Hata!',
        message: 'Kullanıcı bilgileri yüklenirken bir hata oluştu.',
        color: 'red',
        autoClose: 5000,
      });
      throw error;
    }
  },

  addUser: async (userData: Partial<User>) => {
    try {
      const newUser = await createUser(userData);
      notifications.show({
        title: 'Başarılı',
        message: 'Kullanıcı başarıyla eklendi.',
        color: 'green',
        autoClose: 3000,
      });
      return newUser;
    } catch (error) {
      notifications.show({
        title: 'Hata!',
        message: 'Kullanıcı eklenirken bir hata oluştu.',
        color: 'red',
        autoClose: 5000,
      });
      throw error;
    }
  },

  editUser: async (userId: string, userData: Partial<User>) => {
    try {
      const updatedUser = await updateUser(userId, userData);
      notifications.show({
        title: 'Başarılı',
        message: 'Kullanıcı başarıyla güncellendi.',
        color: 'green',
        autoClose: 3000,
      });
      return updatedUser;
    } catch (error) {
      notifications.show({
        title: 'Hata!',
        message: 'Kullanıcı güncellenirken bir hata oluştu.',
        color: 'red',
        autoClose: 5000,
      });
      throw error;
    }
  },

  deleteUser: async (userId: string) => {
    try {
      await deleteUser(userId);
      notifications.show({
        title: 'Başarılı',
        message: 'Kullanıcı başarıyla silindi.',
        color: 'green',
        autoClose: 3000,
      });
      // Refresh the user list
      await get().fetchUsers(get().currentPage);
    } catch (error) {
      notifications.show({
        title: 'Hata!',
        message: 'Kullanıcı silinirken bir hata oluştu.',
        color: 'red',
        autoClose: 5000,
      });
      throw error;
    }
  },

  changeDefaultCompany: async (companyId) => {
    try {
      const response = await changeDefaultCompany(companyId);
      if (response.data && response.data.success) {
        notifications.show({
          title: 'Başarılı',
          message: 'Varsayılan şirket değiştirildi.',
          color: 'green',
          autoClose: 3000,
        });
        //await get().fetchUsers();
        return true;
      } else {
        notifications.show({
          title: 'Hata!',
          message: response.data?.message || 'Varsayılan şirket değiştirilemedi.',
          color: 'red',
          autoClose: 5000,
        });
        return false;
      }
    } catch (error) {
      notifications.show({
        title: 'Hata!',
        message: 'Varsayılan şirket değiştirilirken bir hata oluştu.',
        color: 'red',
        autoClose: 5000,
      });
      return false;
    }
  },

  fetchUserDropdown: async (group_name: string) => {
    set({ loading: true });
    try {
      const response = await fetchUserDropdown(group_name);
      const data = (response && (response.data || response)) || [];
      set({ dropdownUsers: data });
      return data;
    } catch (error) {
      console.error('Failed to fetch users dropdown', error);
      set({ dropdownUsers: [] });
      return [];
    } finally {
      set({ loading: false });
    }
  },
  
  changePassword: async (userId: string, newPassword: string) => {
    try {
      await changePasswordService(userId, newPassword);
      notifications.show({
        title: 'Başarılı',
        message: 'Şifre başarıyla güncellendi.',
        color: 'green',
        autoClose: 3000,
      });
      return true;
    } catch (error) {
      notifications.show({
        title: 'Hata!',
        message: 'Şifre güncellenirken bir hata oluştu.',
        color: 'red',
        autoClose: 5000,
      });
      return false;
    }
  },
})); 