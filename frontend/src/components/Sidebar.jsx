import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ChevronUp,
  Inbox as InboxIcon,
  LayoutGrid,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Repeat,
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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  const displayName = currentUser?.name || "MailMind user";
  const displayEmail = currentUser?.email || "";

  useEffect(() => {
    if (!profileOpen) return undefined;

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileOpen]);

  const goToSettings = () => {
    setProfileOpen(false);
    navigate("/settings");
  };

  const handleChangeAccount = () => {
    setProfileOpen(false);
    onLogout();
    navigate("/login");
  };

  const handleLogout = () => {
    setProfileOpen(false);
    onLogout();
  };

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

      <div className="sidebar-footer" ref={profileRef}>
        {profileOpen && (
          <div className="profile-menu" role="menu">
            <div className="profile-menu-header">
              <Avatar name={displayName || displayEmail} size={36} />
              <div className="profile-menu-identity">
                <span className="profile-menu-name">{displayName}</span>
                <span className="profile-menu-email">{displayEmail}</span>
              </div>
            </div>

            <div className="profile-menu-divider" />

            <button
              type="button"
              className="profile-menu-item"
              role="menuitem"
              onClick={goToSettings}
            >
              <SettingsIcon size={15} strokeWidth={2} />
              Account Settings
            </button>

            <button
              type="button"
              className="profile-menu-item"
              role="menuitem"
              onClick={handleChangeAccount}
            >
              <Repeat size={15} strokeWidth={2} />
              Change Account
            </button>

            <div className="profile-menu-divider" />

            <button
              type="button"
              className="profile-menu-item profile-menu-item--danger"
              role="menuitem"
              onClick={handleLogout}
            >
              <LogOut size={15} strokeWidth={2} />
              Logout
            </button>
          </div>
        )}

        <button
          type="button"
          className="sidebar-user sidebar-user--trigger"
          onClick={() => setProfileOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
          title={collapsed ? displayName : undefined}
        >
          <Avatar name={displayName || displayEmail} size={32} />
          {!collapsed && (
            <>
              <div className="sidebar-user-meta">
                <span className="sidebar-user-name">{displayName}</span>
                <span className="sidebar-user-email">{displayEmail}</span>
              </div>
              <ChevronUp
                size={14}
                strokeWidth={2.25}
                className={`sidebar-user-chevron ${profileOpen ? "open" : ""}`}
              />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
