import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import RoleGate from "./layouts/RoleGate";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Pulse from "./pages/Pulse";
import Agent from "./pages/Agent";
import Ledger from "./pages/Ledger";
import Plan from "./pages/Plan";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route element={<RoleGate allow={["buyer", "entrepreneur"]} />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/pulse" element={<Pulse />} />
          <Route path="/agent" element={<Agent />} />
          <Route path="/product/:slug" element={<Navigate to="/pulse" replace />} />
          <Route path="/market-admin" element={<Navigate to="/pulse?tab=bozor" replace />} />
        </Route>
        <Route element={<RoleGate allow={["entrepreneur"]} />}>
          <Route path="/plan" element={<Plan />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/stress/:id" element={<Navigate to="/plan" replace />} />
          <Route path="/credit" element={<Navigate to="/plan?tab=kredit" replace />} />
          <Route path="/bank" element={<Navigate to="/plan?tab=kredit" replace />} />
          <Route path="/tax" element={<Navigate to="/plan?tab=soliq" replace />} />
          <Route path="/package" element={<Navigate to="/plan?tab=paket" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
