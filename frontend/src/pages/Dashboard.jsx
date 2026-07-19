import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

function Dashboard() {
  const { currentUser } = useAuth();
  const [backendMessage, setBackendMessage] = useState(
    "Checking backend connection..."
  );

  useEffect(() => {
    api
      .get("/health")
      .then((response) => {
        setBackendMessage(response.data.message);
      })
      .catch(() => {
        setBackendMessage("Backend is not connected");
      });
  }, []);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Welcome back</h1>
          <p>{currentUser?.name || currentUser?.email || "Ready to manage your inbox."}</p>
        </div>
        <Link to="/inbox" className="refresh-button">
          Open Inbox
        </Link>
      </div>

      <div className="result-card">
        <h3>Dashboard</h3>
        <p>{backendMessage}</p>
      </div>
    </div>
  );
}

export default Dashboard;