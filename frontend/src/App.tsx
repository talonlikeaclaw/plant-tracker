import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AddPlant from "@/pages/AddPlant";

function App() {
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
            }
          />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/plants/add"
            element={isLoggedIn ? <AddPlant /> : <Navigate to="/login" />}
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
