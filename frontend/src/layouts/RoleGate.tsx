import { Navigate, Outlet } from "react-router-dom";
import { currentUser } from "../lib/api";

export default function RoleGate({ allow }: { allow: string[] }) {
  const user = currentUser();
  if (!user) return <Navigate to="/" replace />;
  if (!allow.includes(user.role)) {
    return <Navigate to={user.role === "buyer" ? "/pulse" : "/profile"} replace />;
  }
  return <Outlet />;
}
