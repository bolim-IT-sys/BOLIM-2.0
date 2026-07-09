import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

export default function SuperAdminRoute({ children }: Props) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "SUPER_ADMIN") {
    return <Navigate to="/hero" replace />;
  }

  return <>{children}</>;
}
