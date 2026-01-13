import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  FolderPlus,
  Users,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Heart,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { currentOfficer, notifications } from '../data/mockData';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/applications', icon: FileText, label: 'Applications' },
  { path: '/new-application', icon: FolderPlus, label: 'New application' },
  { path: '/team', icon: Users, label: 'Team' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
];

const secondaryNavItems = [
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/help', icon: HelpCircle, label: 'Help & support' },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/applications') return 'Applications';
    if (path.startsWith('/applications/')) return 'Application details';
    if (path === '/new-application') return 'New application';
    if (path === '/team') return 'Team';
    if (path === '/reports') return 'Reports';
    if (path === '/settings') return 'Settings';
    return 'Careify';
  };

  return (
    <div className="careify-layout">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="careify-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`careify-sidebar ${sidebarOpen ? 'careify-sidebar--open' : ''}`}>
        <div className="careify-sidebar__header">
          <div className="careify-logo">
            <div className="careify-logo__icon">
              <Heart size={24} />
            </div>
            <span className="careify-logo__text">Careify</span>
          </div>
          <button
            className="careify-sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="careify-sidebar__nav">
          <ul className="careify-nav-list">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `careify-nav-item ${isActive ? 'careify-nav-item--active' : ''}`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="careify-nav-divider" />

          <ul className="careify-nav-list">
            {secondaryNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `careify-nav-item ${isActive ? 'careify-nav-item--active' : ''}`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="careify-sidebar__footer">
          <div className="careify-user-menu">
            <Avatar name={`${currentOfficer.firstName} ${currentOfficer.lastName}`} size="md" />
            <div className="careify-user-menu__info">
              <span className="careify-user-menu__name">
                {currentOfficer.firstName} {currentOfficer.lastName}
              </span>
              <span className="careify-user-menu__role">Housing officer</span>
            </div>
            <button className="careify-user-menu__logout" aria-label="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="careify-main">
        {/* Header */}
        <header className="careify-header">
          <div className="careify-header__left">
            <button
              className="careify-header__menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <h1 className="careify-header__title">{getPageTitle()}</h1>
          </div>

          <div className="careify-header__right">
            <div className="careify-search">
              <Search size={18} className="careify-search__icon" />
              <input
                type="text"
                placeholder="Search applications..."
                className="careify-search__input"
              />
            </div>

            <div className="careify-notifications">
              <button
                className="careify-notifications__btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="careify-notifications__badge">{unreadNotifications}</span>
                )}
              </button>

              {notificationsOpen && (
                <div className="careify-notifications__dropdown">
                  <div className="careify-notifications__header">
                    <h3>Notifications</h3>
                    <button className="careify-notifications__mark-read">
                      Mark all as read
                    </button>
                  </div>
                  <ul className="careify-notifications__list">
                    {notifications.map((notification) => (
                      <li
                        key={notification.id}
                        className={`careify-notification-item ${
                          !notification.read ? 'careify-notification-item--unread' : ''
                        }`}
                      >
                        <div className="careify-notification-item__content">
                          <p className="careify-notification-item__title">
                            {notification.title}
                          </p>
                          <p className="careify-notification-item__message">
                            {notification.message}
                          </p>
                          <span className="careify-notification-item__time">
                            {new Date(notification.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        {notification.type === 'action_required' && (
                          <Badge variant="warning" size="sm">
                            Action needed
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="careify-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
