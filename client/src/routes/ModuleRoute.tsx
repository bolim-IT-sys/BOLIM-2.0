import { Navigate } from "react-router-dom";

interface Props {
  module: string;
  children: React.ReactNode;
}

export default function ModuleRoute({ module, children }: Props) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (user.role === "SUPER_ADMIN") {
    return <>{children}</>;
  }

  if (!user.modules?.includes(module)) {
    return <Navigate to="/hero" replace />;
  }

  return <>{children}</>;
}
