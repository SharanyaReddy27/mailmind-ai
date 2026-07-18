import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav>
          <h2>MailMind AI</h2>

          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/inbox">Inbox</Link>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inbox" element={<Inbox />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
