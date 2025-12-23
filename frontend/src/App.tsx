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
import ViewPlants from "@/pages/ViewPlants";
import Species from "@/pages/Species";
import CarePlans from "@/pages/CarePlans";
import AddCarePlan from "@/pages/AddCarePlan";
import CareTypes from "@/pages/CareTypes";
import LogCare from "@/pages/LogCare";

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
            path="/plants"
            element={isLoggedIn ? <ViewPlants /> : <Navigate to="/login" />}
          />
          <Route
            path="/plants/add"
            element={isLoggedIn ? <AddPlant /> : <Navigate to="/login" />}
          />
          <Route
            path="/species"
            element={isLoggedIn ? <Species /> : <Navigate to="/login" />}
          />
          <Route
            path="/care-plans"
            element={isLoggedIn ? <CarePlans /> : <Navigate to="/login" />}
          />
          <Route
            path="/care-plans/add"
            element={isLoggedIn ? <AddCarePlan /> : <Navigate to="/login" />}
          />
          <Route
            path="/care-types"
            element={isLoggedIn ? <CareTypes /> : <Navigate to="/login" />}
          />
          <Route
            path="/log-care"
            element={isLoggedIn ? <LogCare /> : <Navigate to="/login" />}
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
