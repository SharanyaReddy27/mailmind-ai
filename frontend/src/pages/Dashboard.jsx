import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Inbox as InboxIcon, Plug, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState("checking");
  const [backendMessage, setBackendMessage] = useState(
    "Checking backend connection..."
  );

  useEffect(() => {
    api
      .get("/health")
      .then((response) => {
        setBackendMessage(response.data.message);
        setStatus("online");
      })
      .catch(() => {
        setBackendMessage("Backend is not connected");
        setStatus("offline");
      });
  }, []);

  return (
    <div className="page-shell">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div>
          <span className="eyebrow">{greeting()}</span>
          <h1>{currentUser?.name || currentUser?.email || "Welcome back"}</h1>
          <p>Here&apos;s the state of your workspace.</p>
        </div>
        <Link to="/inbox" className="refresh-button">
          Open Inbox
          <ArrowUpRight size={15} strokeWidth={2.25} />
        </Link>
      </motion.div>

      <motion.div
        className="dashboard-grid"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="dashboard-card">
          <div className="dashboard-card-icon">
            {status === "online" ? (
              <Wifi size={18} strokeWidth={2.25} />
            ) : (
              <WifiOff size={18} strokeWidth={2.25} />
            )}
          </div>
          <div>
            <span className={`status-dot-label status-dot-label--${status}`}>
              {status === "online" ? "System online" : status === "offline" ? "System offline" : "Checking"}
            </span>
            <p className="dashboard-card-copy">{backendMessage}</p>
          </div>
        </div>

        <Link to="/inbox" className="dashboard-card dashboard-card--action">
          <div className="dashboard-card-icon">
            <InboxIcon size={18} strokeWidth={2.25} />
          </div>
          <div>
            <span className="dashboard-card-title">Go to inbox</span>
            <p className="dashboard-card-copy">
              Review new messages and run AI summaries, replies, and task
              extraction.
            </p>
          </div>
        </Link>

        <Link to="/settings" className="dashboard-card dashboard-card--action">
          <div className="dashboard-card-icon">
            <Plug size={18} strokeWidth={2.25} />
          </div>
          <div>
            <span className="dashboard-card-title">Connect Gmail</span>
            <p className="dashboard-card-copy">
              Sync recent messages into MailMind from your Gmail account.
            </p>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}

export default Dashboard;
