import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import EmailDetails from "./pages/EmailDetails";
import Inbox from "./pages/Inbox";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./App.css";

function AppShell() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="app">
      <nav>
        <Link to="/" className="logo-link">
          <h2>MailMind AI</h2>
        </Link>

        <div className="nav-links">
          {currentUser ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/inbox">Inbox</Link>
              <span className="nav-user">👤 {currentUser.name || currentUser.email || "User"}</span>
              <button type="button" className="nav-logout" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
          <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/register" element={currentUser ? <Navigate to="/dashboard" replace /> : <Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
          <Route path="/emails/:id" element={<ProtectedRoute><EmailDetails /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={currentUser ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
