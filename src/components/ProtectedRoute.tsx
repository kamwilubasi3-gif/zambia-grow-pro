import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const ProtectedRoute = ({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;
  if (!user.paid) return <Navigate to="/auth" replace />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/" replace />;
  if (user.isAdmin && location.pathname !== "/admin") return <Navigate to="/admin" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
