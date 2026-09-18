import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import Pulse from "./pages/Pulse";
import Product from "./pages/Product";
import Agent from "./pages/Agent";
import Ledger from "./pages/Ledger";
import Plan from "./pages/Plan";
import Stress from "./pages/Stress";
import Credit from "./pages/Credit";
import Tax from "./pages/Tax";
import Package from "./pages/Package";
import MarketAdmin from "./pages/MarketAdmin";
import Bank from "./pages/Bank";
import Moderation from "./pages/Moderation";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<AppLayout />}>
        <Route path="/pulse" element={<Pulse />} />
        <Route path="/product/:slug" element={<Product />} />
        <Route path="/agent" element={<Agent />} />
        <Route path="/ledger" element={<Ledger />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/stress/:id" element={<Stress />} />
        <Route path="/credit" element={<Credit />} />
        <Route path="/tax" element={<Tax />} />
        <Route path="/package" element={<Package />} />
        <Route path="/market-admin" element={<MarketAdmin />} />
        <Route path="/bank" element={<Bank />} />
        <Route path="/moderation" element={<Moderation />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
