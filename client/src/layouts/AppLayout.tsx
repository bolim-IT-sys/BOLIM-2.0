import { Outlet } from "react-router-dom";
import SessionTimeoutModal from "../components/SessionTimeoutModal";
import { useSessionManager } from "../hooks/useSessionManager";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  const { showWarning, stayLoggedIn, logout } = useSessionManager();

  return (
    <>
      <div className="flex h-screen bg-slate-100">
        <Sidebar />

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <SessionTimeoutModal
        open={showWarning}
        onStay={stayLoggedIn}
        onLogout={logout}
      />
    </>
  );
}
