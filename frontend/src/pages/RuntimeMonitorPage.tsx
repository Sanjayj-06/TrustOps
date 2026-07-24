import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Activity, ShieldCheck, Cpu, MemoryStick, Clock, Bug, CheckCircle, AlertTriangle, Play, RefreshCw, XCircle, FileSearch } from "lucide-react";
import { getRuntimeMetrics, getRuntimeHistory, getRuntimeHealth, simulateRuntimeTick, startRuntimeSession } from "../api/trustpatch";
import { format } from "date-fns";

export default function RuntimeMonitorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const sessionId = searchParams.get("session_id");
  const patchId = searchParams.get("patch_id");

  const [metrics, setMetrics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Initialize runtime session in the backend if not already done
  useEffect(() => {
    if (sessionId && patchId && !sessionStarted) {
      startRuntimeSession(sessionId, patchId)
        .then(() => {
          setSessionStarted(true);
          setIsMonitoring(true); // Auto-start polling
        })
        .catch(console.error);
    }
  }, [sessionId, patchId, sessionStarted]);

  // Poll for updates
  useEffect(() => {
    if (!isMonitoring) return;
    const interval = setInterval(async () => {
      await fetchRuntimeData();
    }, 5000);
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const fetchRuntimeData = async () => {
    if (!sessionId) return;
    try {
      const m = await getRuntimeMetrics(sessionId);
      const h = await getRuntimeHistory(sessionId);
      const hl = await getRuntimeHealth(sessionId);
      setMetrics(m);
      setHistory(h.events || []);
      setHealth(hl);
    } catch (e) {
      console.warn("No runtime data yet.");
    }
  };

  const handleSimulateTick = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await simulateRuntimeTick(sessionId);
      await fetchRuntimeData();
    } catch (e) {
      console.error(e);
      alert("Failed to simulate. Ensure a runtime session is started.");
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="p-10 max-w-4xl mx-auto text-center mt-20 animate-fade-in">
        <Activity className="w-16 h-16 text-slate-300 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No Active Runtime Session</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Please select a session from the Dashboard or Knowledge Base to begin monitoring.
        </p>
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => navigate("/evaluation")}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-2 transition-colors"
          >
            <FileSearch className="w-4 h-4" /> Go to Evaluation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Runtime Monitor</h1>
          <p className="text-slate-500 mt-1">
            Monitoring Patch <span className="font-bold text-slate-700">{patchId}</span> for Session <span className="font-mono text-xs">{sessionId.split('-')[0]}...</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              isMonitoring ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
            }`}
          >
            {isMonitoring ? <XCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isMonitoring ? "Stop Monitoring" : "Start Live Monitor"}
          </button>
          <button 
            onClick={handleSimulateTick}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-md transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Simulate Tick
          </button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard 
          icon={ShieldCheck} 
          label="Runtime Trust" 
          value={health?.runtime_trust || "Pending"} 
          color={health?.runtime_trust === "High" ? "text-emerald-600" : (health?.runtime_trust === "Medium" ? "text-amber-500" : "text-red-600")}
        />
        <SummaryCard 
          icon={Activity} 
          label="Health Status" 
          value={health?.health_status || "Pending"} 
          color={health?.health_status === "Healthy" ? "text-emerald-600" : (health?.health_status === "Warning" ? "text-amber-500" : "text-red-600")}
        />
        <SummaryCard 
          icon={Cpu} 
          label="CPU Usage" 
          value={metrics ? `${metrics.cpu_usage.toFixed(1)}%` : "0%"} 
          color="text-blue-600"
        />
        <SummaryCard 
          icon={MemoryStick} 
          label="Peak Memory" 
          value={metrics ? `${metrics.peak_memory.toFixed(1)} MB` : "0 MB"} 
          color="text-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Timeline & Integration */}
        <div className="lg:col-span-1 space-y-8">
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Runtime Timeline</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {history.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No events recorded.</p>
              ) : (
                history.map((event, idx) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                        event.health_status === "Healthy" ? "bg-emerald-500" :
                        event.health_status === "Warning" ? "bg-amber-500" : "bg-red-500"
                      }`}></div>
                      {idx !== history.length - 1 && <div className="w-0.5 h-full bg-slate-200 my-1"></div>}
                    </div>
                    <div className="pb-4">
                      <p className="text-xs text-slate-400">{event.timestamp ? format(new Date(event.timestamp), "HH:mm:ss") : "Just now"}</p>
                      <p className="text-sm font-bold text-slate-800">{event.health_status}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{event.reason}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 text-white">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Knowledge Integration</h3>
            <div className="space-y-3 text-sm font-medium">
              <div className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-500"/> Session Evaluated</div>
              <div className="w-0.5 h-3 bg-slate-700 ml-2"></div>
              <div className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-500"/> Developer Accepted</div>
              <div className="w-0.5 h-3 bg-slate-700 ml-2"></div>
              <div className="flex items-center gap-3"><Activity className="w-4 h-4 text-blue-500"/> Runtime Monitoring...</div>
              <div className="w-0.5 h-3 bg-slate-700 ml-2"></div>
              <div className="flex items-center gap-3 text-slate-500"><DatabaseIcon className="w-4 h-4"/> Appending to Knowledge Base</div>
            </div>
          </div>
          
        </div>

        {/* Right Column: Metrics & Health */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Health Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Health & Trust Analysis</h3>
            </div>
            <div className="p-5 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Current Assessment</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                     health?.health_status === "Healthy" ? "bg-emerald-100 text-emerald-700" :
                     health?.health_status === "Warning" ? "bg-amber-100 text-amber-700" : 
                     health?.health_status === "Critical" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                  }`}>
                    {health?.health_status || "Unknown"} Health
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                     health?.runtime_trust === "High" ? "bg-emerald-100 text-emerald-700" :
                     health?.runtime_trust === "Medium" ? "bg-amber-100 text-amber-700" : 
                     health?.runtime_trust === "Low" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                  }`}>
                    {health?.runtime_trust || "Unknown"} Trust
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {health?.reason || "Awaiting runtime data..."}
                </p>
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Detected Risks</p>
                {metrics && metrics.exceptions > 0 ? (
                  <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 p-2 rounded border border-red-100">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{metrics.exceptions} Exceptions detected in the last window.</span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No significant risks detected.</p>
                )}
                {metrics && metrics.latency > 2000 && (
                   <div className="flex items-start gap-2 text-amber-600 text-sm bg-amber-50 p-2 rounded border border-amber-100">
                     <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                     <span>High latency observed ({metrics.latency.toFixed(0)} ms).</span>
                   </div>
                )}
              </div>
            </div>
          </div>

          {/* Metrics Detailed Grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Live Telemetry</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               <MetricCard icon={Clock} label="Latency" value={metrics ? `${metrics.latency.toFixed(1)} ms` : "-"} />
               <MetricCard icon={Bug} label="Exceptions" value={metrics?.exceptions ?? "-"} />
               <MetricCard icon={Activity} label="Executions" value={metrics?.executions ?? "-"} />
               <MetricCard icon={ShieldCheck} label="Success Rate" value={metrics ? `${(metrics.success_rate * 100).toFixed(1)}%` : "-"} />
               <MetricCard icon={AlertTriangle} label="App Errors" value={metrics?.app_errors ?? "-"} />
               <MetricCard icon={AlertTriangle} label="Test Fails" value={metrics?.test_failures ?? "-"} />
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-slate-500">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) {
  return (
    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-600">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}

const DatabaseIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
);
