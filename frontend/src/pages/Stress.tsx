import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { api, som } from "../lib/api";

export default function Stress() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    api(`/api/plans/${id}/stress-test/`, { method: "POST", body: JSON.stringify({ n: 1000 }) }).then(setData);
  }, [id]);
  if (!data) return <p>Hisoblanmoqda…</p>;
  return (
    <div className="text-slate-900">
      <h1 className="font-display text-3xl">Stress-test</h1>
      <p className="text-sm text-slate-500">Monte-Karlo, 1 000 ssenariy · manba: M1 volatillik</p>
      <div className="grid sm:grid-cols-4 gap-3 mt-4">
        <Box label="Zarar ehtimoli" value={`${(data.p_loss * 100).toFixed(1)}%`} />
        <Box label="P10 foyda" value={som(data.p10)} />
        <Box label="P50 foyda" value={som(data.p50)} />
        <Box label="P90 foyda" value={som(data.p90)} />
      </div>
      <div className="mt-4 bg-white border rounded-2xl p-4 h-64">
        <ResponsiveContainer>
          <BarChart data={data.histogram}>
            <XAxis dataKey="x" hide />
            <Tooltip />
            <Bar dataKey="n" fill="#7c5cff" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3">
        Eng xavfli omil: <b>{data.top_risk_factor}</b>
      </p>
      <p className="text-xs text-slate-500 mt-2">{data.disclaimer}</p>
    </div>
  );
}
function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-display text-xl">{value}</div>
    </div>
  );
}
