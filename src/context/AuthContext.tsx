import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserSession, UserRole, AppNotification } from '../types/domain';
import { apiClient, setActiveUserId } from '../services/api';
import { useLanguage } from './LanguageContext';
import { LanguageCode } from '../i18n/translations';

interface RegisterPayload {
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  organization?: string;
  jurisdiction?: string;
  designation?: string;
  phone?: string;
  password?: string;
  primaryLanguage?: LanguageCode;
  aadhaarNumber?: string;
  homeState?: string;
  homeDistrict?: string;
  homeULB?: string;
  homeWard?: string;
}

interface AuthContextType {
  currentUser: UserSession | null;
  isAuthenticated: boolean;
  isDemoAccount: boolean;
  allUsers: UserSession[];
  login: (email: string, password?: string, role?: string) => Promise<UserSession>;
  loginDemo: (userIdOrRole: string) => Promise<UserSession>;
  register: (payload: RegisterPayload) => Promise<UserSession>;
  logout: () => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  notifications: AppNotification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  resetDemo: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'cfc_auth_user_id';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setLanguage } = useLanguage();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [allUsers, setAllUsers] = useState<UserSession[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsersAndNotifications = async () => {
    try {
      const users = await apiClient.getUsers();
      setAllUsers(users);

      // Check persisted session
      const savedUserId = localStorage.getItem(STORAGE_KEY);
      if (savedUserId) {
        const found = users.find((u) => u.id === savedUserId);
        if (found) {
          setCurrentUser(found);
          setActiveUserId(found.id);
          if (found.primaryLanguage) {
            setLanguage(found.primaryLanguage as LanguageCode);
          }
        }
      }

      const notifs = await apiClient.getNotifications();
      setNotifications(notifs);
    } catch (err) {
      console.warn('Failed to load initial user/notification state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndNotifications();
  }, []);

  const login = async (email: string, password?: string, role?: string): Promise<UserSession> => {
    setIsLoading(true);
    try {
      const user = await apiClient.login({ email, password, role });
      setCurrentUser(user);
      setActiveUserId(user.id);
      localStorage.setItem(STORAGE_KEY, user.id);
      if (user.primaryLanguage) {
        setLanguage(user.primaryLanguage as LanguageCode);
      }
      await refreshNotifications();
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async (userIdOrRole: string): Promise<UserSession> => {
    setIsLoading(true);
    try {
      const isExplicitUserId = allUsers.some((u) => u.id === userIdOrRole) || userIdOrRole.includes('-');
      const user = await apiClient.loginDemo({
        userId: isExplicitUserId ? userIdOrRole : undefined,
        role: !isExplicitUserId ? userIdOrRole : undefined,
      });
      setCurrentUser(user);
      setActiveUserId(user.id);
      localStorage.setItem(STORAGE_KEY, user.id);
      if (user.primaryLanguage) {
        setLanguage(user.primaryLanguage as LanguageCode);
      }
      await refreshNotifications();
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<UserSession> => {
    setIsLoading(true);
    try {
      const newUser = await apiClient.register(payload);
      setCurrentUser(newUser);
      setActiveUserId(newUser.id);
      localStorage.setItem(STORAGE_KEY, newUser.id);
      if (newUser.primaryLanguage) {
        setLanguage(newUser.primaryLanguage as LanguageCode);
      }
      // Reload users list
      const users = await apiClient.getUsers();
      setAllUsers(users);
      await refreshNotifications();
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const switchUser = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setActiveUserId(user.id);
      localStorage.setItem(STORAGE_KEY, user.id);
      refreshNotifications();
    }
  };

  const switchRole = (role: UserRole) => {
    const user = allUsers.find((u) => u.role === role);
    if (user) {
      setCurrentUser(user);
      setActiveUserId(user.id);
      localStorage.setItem(STORAGE_KEY, user.id);
      refreshNotifications();
    }
  };

  const refreshNotifications = async () => {
    try {
      const notifs = await apiClient.getNotifications();
      setNotifications(notifs);
    } catch (err) {
      console.warn('Failed to refresh notifications:', err);
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiClient.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const resetDemo = async () => {
    setIsLoading(true);
    try {
      await apiClient.resetDemoDatabase();
      await fetchUsersAndNotifications();
    } catch (err) {
      console.error('Failed to reset demo database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = currentUser !== null;
  const isDemoAccount = currentUser?.isDemo === true;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isDemoAccount,
        allUsers,
        login,
        loginDemo,
        register,
        logout,
        switchUser,
        switchRole,
        notifications,
        unreadCount,
        refreshNotifications,
        markRead,
        resetDemo,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
