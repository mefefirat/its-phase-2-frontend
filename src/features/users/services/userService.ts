import axiosInstance from '@/config/axios';
import type { User } from '../types/user';


interface PaginationParams {
  page?: number;
  per_page?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  page: number;
  per_page: number;
  total?: number;
  total_pages?: number;
}



export const fetchUsers = async (params: PaginationParams = {}): Promise<PaginatedResponse<User>> => {
  const response = await axiosInstance.get('/v1/users', {
      params: {
          // API expects 1-based page; store uses 0-based → shift here
          page: (params.page ?? 0) + 1,
          per_page: params.per_page || 10
      }
  });
  return response.data;
};

export const fetchUserById = async (userId: string): Promise<User> => {
  const response = await axiosInstance.get(`/v1/users/${userId}`);
  return response.data;
};

export const createUser = async (userData: Partial<User>): Promise<User> => {
  const response = await axiosInstance.post('/v1/auth/register', userData);
  return response.data;
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
  const response = await axiosInstance.put(`/v1/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await axiosInstance.delete(`/v1/users/${userId}`);
};

// Kullanıcının şifresini değiştir
export const changePassword = async (userId: string, newPassword: string): Promise<void> => {
  await axiosInstance.post(`/v1/users/${userId}/change-password`, {
    new_password: newPassword
  });
};

// Kullanıcının varsayılan şirketini değiştir
export const changeDefaultCompany = async (companyId: string) => {
  return axiosInstance.post(`/v1/user/change-default-company`, { value: companyId });
}; 

// Kullanıcı dropdown verisi getir
export const fetchUserDropdown = async (group_name: string) => {
  const response = await axiosInstance.get('/v1/user/dropdown', {
    params: { group_name }
  });
  return response.data;
};