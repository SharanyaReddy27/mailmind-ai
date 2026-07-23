import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Inbox as InboxIcon,
  LayoutGrid,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";
import Avatar from "./Avatar";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/inbox", label: "Inbox", icon: InboxIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

function Sidebar({ currentUser, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        <NavLink to="/dashboard" className="brand">
          <span className="brand-mark">
            <Sparkles size={16} strokeWidth={2.25} />
          </span>
          {!collapsed && <span className="brand-name">MailMind</span>}
        </NavLink>

        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Primary">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            title={collapsed ? label : undefined}
          >
            <span className="sidebar-link-icon">
              <Icon size={17} strokeWidth={2} />
            </span>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <Avatar name={currentUser?.name || currentUser?.email} size={32} />
          {!collapsed && (
            <div className="sidebar-user-meta">
              <span className="sidebar-user-name">
                {currentUser?.name || "MailMind user"}
              </span>
              <span className="sidebar-user-email">{currentUser?.email}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={onLogout}
          title="Log out"
        >
          <LogOut size={16} strokeWidth={2} />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
