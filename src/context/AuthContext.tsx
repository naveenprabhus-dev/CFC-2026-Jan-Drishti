import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserSession, UserRole, AppNotification } from '../types/domain';
import { apiClient, setActiveSession, setActiveUserId } from '../services/api';
import { useLanguage } from './LanguageContext';
import { LanguageCode, SUPPORTED_LANGUAGES } from '../i18n/translations';

interface RegisterPayload {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  organization?: string;
  jurisdiction?: string;
  designation?: string;
  phone?: string;
  password?: string;
  primaryLanguage?: string;
  aadhaarNumber?: string;
  homeState?: string;
  homeDistrict?: string;
  homeULB?: string;
  homeWard?: string;
}

interface AuthContextType {
  currentUser: UserSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAdminPreview: boolean;
  actualAdminId: string | null;
  allUsers: UserSession[];
  availableStakeholders: UserSession[];
  login: (email: string, password?: string, role?: string) => Promise<UserSession>;
  register: (payload: RegisterPayload) => Promise<UserSession>;
  startAdminPreview: (targetUserId: string) => Promise<UserSession>;
  stopAdminPreview: () => Promise<UserSession>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
  notifications: AppNotification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  resetDatabase: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_USER_ID = 'cfc_auth_user_id';
const STORAGE_ADMIN_PREVIEW = 'cfc_admin_preview';
const STORAGE_ACTUAL_ADMIN_ID = 'cfc_actual_admin_id';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setLanguage } = useLanguage();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [allUsers, setAllUsers] = useState<UserSession[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const applyUserLanguage = (user: UserSession) => {
    if (user.primaryLanguage && SUPPORTED_LANGUAGES.some((l) => l.code === user.primaryLanguage)) {
      setLanguage(user.primaryLanguage as LanguageCode);
    }
  };

  const fetchUsersAndNotifications = async () => {
    try {
      const users = await apiClient.getUsers();
      setAllUsers(users);

      // Check persisted session
      const savedUserId = localStorage.getItem(STORAGE_USER_ID);
      const isPreview = localStorage.getItem(STORAGE_ADMIN_PREVIEW) === 'true';
      const actualAdminId = localStorage.getItem(STORAGE_ACTUAL_ADMIN_ID) || 'admin-001';

      if (savedUserId) {
        const found = users.find((u) => u.id.toLowerCase() === savedUserId.toLowerCase());
        if (found) {
          if (isPreview) {
            const adminUser = users.find((u) => u.id.toLowerCase() === actualAdminId.toLowerCase());
            const previewSession: UserSession = {
              ...found,
              isPreviewSession: true,
              actualAdminId: adminUser?.id || actualAdminId,
              actualAdminName: adminUser?.name || 'Administrator',
            };
            setCurrentUser(previewSession);
            setActiveSession(found.id, actualAdminId, true);
            applyUserLanguage(found);
          } else {
            setCurrentUser(found);
            setActiveSession(found.id);
            applyUserLanguage(found);
          }
        } else {
          // If saved user is not found, fallback to default admin
          const defaultAdmin = users.find((u) => u.role === 'ADMIN') || users[0];
          if (defaultAdmin) {
            setCurrentUser(defaultAdmin);
            setActiveSession(defaultAdmin.id);
            applyUserLanguage(defaultAdmin);
          }
        }
      } else {
        // Automatically set admin on fresh launch
        const defaultAdmin = users.find((u) => u.role === 'ADMIN') || users[0];
        if (defaultAdmin) {
          setCurrentUser(defaultAdmin);
          setActiveSession(defaultAdmin.id);
          localStorage.setItem(STORAGE_USER_ID, defaultAdmin.id);
          applyUserLanguage(defaultAdmin);
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

  const refreshUsers = async () => {
    try {
      const users = await apiClient.getUsers();
      setAllUsers(users);
    } catch (err) {
      console.warn('Failed to refresh users:', err);
    }
  };

  const login = async (email: string, password?: string, role?: string): Promise<UserSession> => {
    setIsLoading(true);
    try {
      const user = await apiClient.login({ email, password, role });
      setCurrentUser(user);
      setActiveSession(user.id);
      localStorage.setItem(STORAGE_USER_ID, user.id);
      localStorage.removeItem(STORAGE_ADMIN_PREVIEW);
      localStorage.removeItem(STORAGE_ACTUAL_ADMIN_ID);
      applyUserLanguage(user);
      await refreshNotifications();
      await refreshUsers();
      return user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<UserSession> => {
    setIsLoading(true);
    try {
      const newUser = await apiClient.register(payload);
      // Reload users list
      const users = await apiClient.getUsers();
      setAllUsers(users);
      await refreshNotifications();
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const startAdminPreview = async (targetUserId: string): Promise<UserSession> => {
    setIsLoading(true);
    try {
      const res = await apiClient.startAdminPreview(targetUserId);
      const session = res.session;
      
      setCurrentUser(session);
      setActiveSession(session.id, session.actualAdminId, true);
      
      localStorage.setItem(STORAGE_USER_ID, session.id);
      localStorage.setItem(STORAGE_ADMIN_PREVIEW, 'true');
      localStorage.setItem(STORAGE_ACTUAL_ADMIN_ID, session.actualAdminId || 'admin-001');

      applyUserLanguage(session);
      await refreshNotifications();
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const stopAdminPreview = async (): Promise<UserSession> => {
    setIsLoading(true);
    try {
      const currentPreviewUserId = currentUser?.id;
      const adminUser = await apiClient.stopAdminPreview(currentPreviewUserId);

      setCurrentUser(adminUser);
      setActiveSession(adminUser.id);

      localStorage.setItem(STORAGE_USER_ID, adminUser.id);
      localStorage.removeItem(STORAGE_ADMIN_PREVIEW);
      localStorage.removeItem(STORAGE_ACTUAL_ADMIN_ID);

      applyUserLanguage(adminUser);
      await refreshNotifications();
      return adminUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveSession('');
    localStorage.removeItem(STORAGE_USER_ID);
    localStorage.removeItem(STORAGE_ADMIN_PREVIEW);
    localStorage.removeItem(STORAGE_ACTUAL_ADMIN_ID);
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

  const resetDatabase = async () => {
    setIsLoading(true);
    try {
      await apiClient.resetDatabase();
      localStorage.removeItem(STORAGE_ADMIN_PREVIEW);
      localStorage.removeItem(STORAGE_ACTUAL_ADMIN_ID);
      await fetchUsersAndNotifications();
    } catch (err) {
      console.error('Failed to reset database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = currentUser !== null;
  const isAdmin = currentUser?.role === 'ADMIN';
  const isAdminPreview = currentUser?.isPreviewSession === true;
  const actualAdminId = currentUser?.actualAdminId || (isAdmin ? currentUser?.id : null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Real active users in database excluding the administrator
  const availableStakeholders = allUsers.filter(
    (u) => u.role !== 'ADMIN' && u.status !== 'inactive'
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAdmin,
        isAdminPreview,
        actualAdminId,
        allUsers,
        availableStakeholders,
        login,
        register,
        startAdminPreview,
        stopAdminPreview,
        logout,
        refreshUsers,
        notifications,
        unreadCount,
        refreshNotifications,
        markRead,
        resetDatabase,
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
