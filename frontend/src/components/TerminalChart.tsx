import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from "lightweight-charts";
import type { Candle } from "../lib/api";

export function TerminalChart({ candles, height = 380 }: { candles: Candle[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      height,
      layout: {
        background: { color: "#0c1310" },
        textColor: "#a2b399",
      },
      grid: {
        vertLines: { color: "#223331" },
        horzLines: { color: "#273a38" },
      },
      rightPriceScale: { borderColor: "#35482f" },
      timeScale: { borderColor: "#2e4027" },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#66c6aa",
      downColor: "#eb6c59",
      borderUpColor: "#66c6aa",
      borderDownColor: "#eb6c59",
      wickUpColor: "#66c6aa",
      wickDownColor: "#eb6c59",
    });
    chartRef.current = chart;
    seriesRef.current = series;
    const ro = new ResizeObserver(() => {
      if (ref.current) chart.applyOptions({ width: ref.current.clientWidth });
    });
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    const data: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    seriesRef.current.setData(data);
    chartRef.current.timeScale().fitContent();
  }, [candles]);

  return <div className="chart-host" ref={ref} style={{ height }} />;
}
