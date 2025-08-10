import React, { useState } from 'react';
import { 
  Home, 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  Settings, 
  Menu,
  X,
  Clock,
  Target
} from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../store/useAuthStore';
import { BeamLogo } from './BeamLogo';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const getMenuItems = (t: (key: string) => string) => [
  { id: 'dashboard', label: t('nav.dashboard'), icon: Home },
  { id: 'tasks', label: t('nav.tasks'), icon: CheckSquare },
  { id: 'calendar', label: t('nav.calendar'), icon: Calendar },
  { id: 'timer', label: t('nav.timer'), icon: Clock },
  { id: 'goals', label: t('nav.goals'), icon: Target },
  { id: 'analytics', label: t('nav.analytics'), icon: BarChart3 },
  { id: 'settings', label: t('nav.settings'), icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  
  const menuItems = getMenuItems(t);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handlePageChange = (pageId: string) => {
    onPageChange(pageId);
    setIsMobileOpen(false); // Close mobile sidebar on page change
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg text-white"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-40
          bg-gray-800 border-r border-gray-700
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <BeamLogo size={32} className="text-white" />
                <span className="font-bold text-xl text-white">Beam</span>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="hidden lg:block p-1 hover:bg-gray-700 rounded-md transition-colors"
            >
              <Menu size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handlePageChange(item.id)}
                      className={`
                        sidebar-item w-full text-left
                        ${isActive ? 'active' : 'text-gray-300 hover:text-white'}
                        ${isCollapsed ? 'justify-center px-2' : ''}
                      `}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon size={20} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">{(user?.name || user?.email || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{user?.name || 'Utente'}</p>
                  <p className="text-gray-400 text-sm">{user?.email || ''}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={logout} className="btn-secondary w-full">Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
