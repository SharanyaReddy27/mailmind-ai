import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
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
    <div>
      <h1>MailMind AI Dashboard</h1>
      <p>{backendMessage}</p>
    </div>
  );
}

export default Dashboard;