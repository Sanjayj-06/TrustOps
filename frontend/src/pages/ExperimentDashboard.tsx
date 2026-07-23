import React, { useState, useEffect } from "react";
import { Download, Share2, BarChart2, CheckCircle2 } from "lucide-react";
import { getExperimentMetrics, ExperimentMetricsResponse } from "../api/trustops_phase3";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

export default function ExperimentDashboard() {
  const [metrics, setMetrics] = useState<ExperimentMetricsResponse | null>(null);

  useEffect(() => {
    getExperimentMetrics().then(setMetrics).catch(console.error);
  }, []);

  const exportData = (type: "json" | "csv") => {
    if (!metrics) return;
    
    let content = "";
    let mimeType = "";
    let filename = "";

    if (type === "json") {
      content = JSON.stringify(metrics, null, 2);
      mimeType = "application/json";
      filename = "trustops_experiment_results.json";
    } else {
      const headers = Object.keys(metrics).join(",");
      const values = Object.values(metrics).join(",");
      content = `${headers}\n${values}`;
      mimeType = "text/csv";
      filename = "trustops_experiment_results.csv";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Mock data for graphs to demonstrate capability for research mode
  const comparisonData = [
    { name: "Top-1 Accuracy", Baseline: 71.4, TrustOps: 89.4 },
    { name: "Top-3 Accuracy", Baseline: 85.0, TrustOps: 96.2 },
    { name: "Success Rate", Baseline: 68.2, TrustOps: 85.2 },
  ];

  const evolutionData = [
    { session: 1, trust: 0.65 },
    { session: 5, trust: 0.68 },
    { session: 10, trust: 0.72 },
    { session: 20, trust: 0.79 },
    { session: 30, trust: 0.85 },
    { session: 50, trust: 0.89 },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">Research Mode Active</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Experiment Dashboard</h1>
          <p className="text-slate-500 mt-1">Comparative evaluation metrics for the ISEC 2027 publication.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => exportData("csv")} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-sm shadow-sm transition-all">
            <Download className="w-4 h-4" /> CSV Export
          </button>
          <button onClick={() => exportData("json")} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-sm shadow-md transition-all">
            <Share2 className="w-4 h-4" /> JSON Export
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Aggregate Results vs Baseline</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <MetricCell label="Patch Ranking Acc." value={metrics?.patch_ranking_accuracy} />
          <MetricCell label="Top-1 Acc." value={metrics?.top_1_accuracy} highlight />
          <MetricCell label="Acceptance Rate" value={metrics?.developer_acceptance_rate} />
          <MetricCell label="Repair Success" value={metrics?.repair_success_rate} />
          <MetricCell label="Runtime Failure" value={metrics?.runtime_failure_rate} negative />
          <MetricCell label="Override Rate" value={metrics?.override_rate} />
          <MetricCell label="Trust Stability" value={metrics?.trust_stability} />
          <MetricCell label="Avg Trust Score" value={metrics?.average_trust_score.toFixed(3)} />
        </div>
      </div>

      {/* Graph Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
             <BarChart2 className="w-4 h-4 text-blue-500" /> BAPR vs TAPR Performance
           </h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={comparisonData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                 <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                 <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                 <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={30} />
                 <Bar dataKey="TrustOps" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
             <TrendingUp className="w-4 h-4 text-emerald-500" /> System Trust Calibration Over Time
           </h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={evolutionData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis dataKey="session" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                 <YAxis domain={[0.5, 1.0]} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                 <Tooltip cursor={{stroke: '#e2e8f0', strokeWidth: 2}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                 <Line type="monotone" dataKey="trust" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

    </div>
  );
}

function MetricCell({ label, value, highlight = false, negative = false }: { label: string, value?: string | number, highlight?: boolean, negative?: boolean }) {
  return (
    <div className="p-6">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-2xl font-black ${
        highlight ? "text-blue-600" : 
        negative ? "text-red-500" : "text-slate-900"
      }`}>
        {value || "-"}
      </p>
    </div>
  );
}

const TrendingUp = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
);
