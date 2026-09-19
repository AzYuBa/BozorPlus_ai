import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { getAccess } from "./lib/api";
import { AppLayout } from "./layouts/AppLayout";
import { RequireAuth } from "./layouts/RequireAuth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Terminal from "./pages/Terminal";
import Notebook from "./pages/Notebook";
import Profile from "./pages/Profile";
import Plan from "./pages/Plan";
import Adviser from "./pages/Adviser";
import Wallet from "./pages/Wallet";

function GuestOnly({ children }: { children: ReactNode }) {
  if (getAccess()) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <Login />
          </GuestOnly>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnly>
            <Register />
          </GuestOnly>
        }
      />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Terminal />} />
          <Route path="/notebook" element={<Notebook />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/adviser" element={<Adviser />} />
          <Route path="/wallet" element={<Wallet />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={getAccess() ? "/" : "/login"} replace />} />
    </Routes>
  );
}
