import "./App.css";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Hero from "./pages/Hero";
import SuperAdminRoute from "./routes/SuperAdminRoute";
import UserManagementPage from "./pages/UserManagementPage";
import ItStock from "./pages/ItStock";
import PinInbound from "./pages/PinInbound";
import PinInventory from "./pages/PinInventory";
import Maintenance from "./pages/Maintenance";
import EquipmentMovement from "./pages/EquipmentMovement";
import Pins from "./pages/Pins";
import ITStockDetailsPage from "./pages/ITStockDetailsPage";
import ITDashboard from "./pages/ITDashboard";
import PinsDashboard from "./pages/PinsDashboard";
import api from "./api/axios";
import Logs from "./pages/Logs";
import PinStockDetailsPage from "./pages/PinStockDetailsPage";
import ContactAdministrator from "./pages/ContactAdministrator";

// Helper function to check if a JWT token is expired
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const { exp } = JSON.parse(jsonPayload);
    return Date.now() >= exp * 1000;
  } catch (error) {
    console.error("Token parsing error:", error);
    return true;
  }
};

function App() {
  const [initializing, setInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkPersistedAuth = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token || isTokenExpired(token)) {
        try {
          localStorage.removeItem("accessToken");
          const response = await api.post("/auth/refresh", {});

          localStorage.setItem("accessToken", response.data.accessToken);
          if (response.data.user) {
            localStorage.setItem("user", JSON.stringify(response.data.user));
          }
          setIsAuthenticated(true);
        } catch (error) {
          console.error(error);
          console.log(
            "No active 'Remember Me' cookie found on client browser.",
          );
          localStorage.removeItem("user");
          localStorage.removeItem("accessToken");
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(true);
      }
      setInitializing(false);
    };
    checkPersistedAuth();
  }, []);

  if (initializing) {
    return (
      <div className="flex h-screen items-center justify-center font-medium text-slate-500 bg-slate-50">
        Loading Application...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Dynamic Root Handshake */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/hero" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Dynamic Login Route Guard */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/hero" replace /> : <LoginPage />
          }
        />

        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? (
              <Navigate to="/hero" replace />
            ) : (
              <ContactAdministrator />
            )
          }
        />

        {/* Shell Routes Layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/hero" element={<Hero />} />
          <Route path="/dashboard/it-stock" element={<ITDashboard />} />
          <Route path="/dashboard/pins" element={<PinsDashboard />} />
          <Route path="/pins" element={<Pins />} />
          <Route path="/pins-stock/:id" element={<PinStockDetailsPage />} />
          <Route path="/it-stock" element={<ItStock />} />
          <Route path="/it-stock/:id" element={<ITStockDetailsPage />} />
          <Route path="/pin/inventory" element={<PinInventory />} />
          <Route path="/pin/inbound-usage" element={<PinInbound />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/movement" element={<EquipmentMovement />} />
          <Route path="/logs" element={<Logs />} />
          <Route
            path="/users"
            element={
              <SuperAdminRoute>
                <UserManagementPage />
              </SuperAdminRoute>
            }
          />
        </Route>

        {/* Catch-All Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
