import { useEffect, useState } from "react";
import { getErrorMessage, healthCheck } from "../services/api";

function Dashboard() {
  const [backendMessage, setBackendMessage] = useState(
    "Checking backend connection..."
  );

  useEffect(() => {
    healthCheck()
      .then((response) => {
        setBackendMessage(response.data.message);
      })
      .catch((err) => {
        setBackendMessage(getErrorMessage(err));
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