import { User } from '../types';

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
};

export function setCurrentUser(user: any, token?: string) {
  localStorage.setItem('currentUser', JSON.stringify(user));
  if (token) localStorage.setItem('token', token);
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export const logout = (): void => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('token');
};

export const isAuthenticated = (): boolean => {
  return !!getCurrentUser();
};