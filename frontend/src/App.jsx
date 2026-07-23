import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import EmailDetails from "./pages/EmailDetails";
import Inbox from "./pages/Inbox";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./App.css";
import Settings from "./pages/Settings";

function AppShell() {
  const { currentUser, logout } = useAuth();

  return (
    <div className={`app ${currentUser ? "app--workspace" : "app--auth"}`}>
      {currentUser && <Sidebar currentUser={currentUser} onLogout={logout} />}

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <Navigate
                to={currentUser ? "/dashboard" : "/login"}
                replace
              />
            }
          />

          <Route
            path="/login"
            element={
              currentUser
                ? <Navigate to="/dashboard" replace />
                : <Login />
            }
          />

          <Route
            path="/register"
            element={
              currentUser
                ? <Navigate to="/dashboard" replace />
                : <Register />
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <Inbox />
              </ProtectedRoute>
            }
          />

          <Route
            path="/emails/:id"
            element={
              <ProtectedRoute>
                <EmailDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to={currentUser ? "/dashboard" : "/login"}
                replace
              />
            }
          />
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
