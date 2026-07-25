import React, { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import PatchEvaluationPage from "./pages/PatchEvaluationPage";
import RuntimeMonitorPage from "./pages/RuntimeMonitorPage";
import AdaptationDashboard from "./pages/AdaptationDashboard";
import ExperimentDashboard from "./pages/ExperimentDashboard";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import ResearchEvaluationPage from "./pages/ResearchEvaluationPage";
import { 
    LayoutDashboard, 
    FileSearch, 
    Database, 
    ActivitySquare, 
    FlaskConical,
    Microscope,
    Menu,
    X
} from "lucide-react";
import tplogo from "./Images/TP1.png";

const NAV_LINKS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/evaluation", label: "Patch Evaluation", icon: FileSearch },
  { path: "/knowledge", label: "Knowledge Base", icon: Database },
  { path: "/runtime", label: "Runtime Monitor", icon: ActivitySquare },
  { path: "/experiments", label: "Experiments", icon: FlaskConical },
  { path: "/research", label: "Research Evaluation", icon: Microscope },
];

export default function App() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [researchMode, setResearchMode] = useState(false);

  const visibleLinks = NAV_LINKS.filter(link => 
    researchMode ? true : !["/adaptation", "/experiments", "/research"].includes(link.path)
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans">
      {/* Sidebar for Desktop / Topbar for Mobile */}
      
      {/* Mobile Topbar */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={tplogo} alt="TrustOps" className="w-8 h-8 object-contain" />
          <h1 className="text-lg font-bold tracking-tight">TrustOps</h1>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar (Desktop) & Mobile Dropdown */}
      <aside className={`
        ${mobileMenuOpen ? "block" : "hidden"} 
        md:flex flex-col w-full md:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex-shrink-0
        md:sticky md:top-0 md:h-screen
        fixed md:relative z-40
      `}>
        <div className="hidden md:flex items-center gap-4 p-6 border-b border-slate-800">
          <img src={tplogo} alt="TrustOps" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">TrustOps</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">ISEC 2027 Prototype</p>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {visibleLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/50" 
                    : "hover:bg-slate-800 hover:text-white"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 font-medium">Research Mode</span>
            <button 
              onClick={() => setResearchMode(!researchMode)}
              className={`w-10 h-5 rounded-full relative transition-colors ${researchMode ? "bg-blue-600" : "bg-slate-700"}`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${researchMode ? "translate-x-5.5 left-1" : "left-1"}`}></div>
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
             System Online
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden relative">
        <Routes>
          <Route path="/" element={<div className="p-10"><h2 className="text-2xl font-bold">Dashboard</h2><p className="text-slate-500 mt-2">Welcome to TrustOps. Please navigate to Patch Evaluation or Runtime Monitor.</p></div>} />
          <Route path="/evaluation" element={<PatchEvaluationPage />} />
          <Route path="/knowledge" element={<KnowledgeBasePage />} />
          <Route path="/runtime" element={<RuntimeMonitorPage />} />
          <Route path="/adaptation" element={<AdaptationDashboard />} />
          <Route path="/experiments" element={<ExperimentDashboard />} />
          <Route path="/research" element={<ResearchEvaluationPage />} />
        </Routes>
      </main>
    </div>
  );
}
