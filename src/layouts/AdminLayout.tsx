import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { isDemoMode } from '../config/runtime';

export function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <button
        className="sidebar-backdrop"
        aria-label="Закрыть меню"
        onClick={() => setSidebarOpen(false)}
      />
      <aside className="sidebar" aria-label="Основная навигация">
        <div className="brand">
          <span className="brand-mark">A</span>
          <span>
            <strong>ALPOOL {isDemoMode() && <span className="demo-indicator">DEMO</span>}</strong>
            <small>ADMIN / WORKSPACE</small>
          </span>
        </div>
        <nav className="main-nav">
          <NavLink
            to="/leads"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="nav-icon" aria-hidden="true">↗</span>
            Заявки
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="system-note"><span className="online-dot" /> {isDemoMode() ? 'LOCAL DEMO / NO API' : 'API workspace'}</div>
          <button className="logout-button" onClick={handleLogout}>
            <span aria-hidden="true">↪</span> Выйти
          </button>
        </div>
      </aside>
      <div className="content-shell">
        <header className="mobile-header">
          <button
            className="menu-button"
            aria-label="Открыть меню"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
          >
            <span /><span /><span />
          </button>
          <span className="mobile-brand">ALPOOL <em>ADMIN</em>{isDemoMode() && <span className="demo-indicator">DEMO</span>}</span>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
