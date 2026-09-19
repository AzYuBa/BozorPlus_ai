import { Navigate, Outlet } from "react-router-dom";
import { getAccess } from "../lib/api";

export function RequireAuth() {
  if (!getAccess()) return <Navigate to="/login" replace />;
  return <Outlet />;
}
