import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Database, Layers, AlertTriangle, Droplets, 
  Activity, ShieldCheck, BookOpen, Compass, RefreshCw, 
  Sparkles, Menu, X, Award, CheckCircle2, ChevronRight, BarChart3
} from 'lucide-react';

import OverviewView from './views/OverviewView';
import DataImportView from './views/DataImportView';
import ContractExplorerView from './views/ContractExplorerView';
import RelativeValueView from './views/RelativeValueView';
import AnomalyAnalysisView from './views/AnomalyAnalysisView';
import LiquidityExpiryView from './views/LiquidityExpiryView';
import BacktestingLabView from './views/BacktestingLabView';
import DataQualityView from './views/DataQualityView';
import MethodologyView from './views/MethodologyView';
import JudgeTourModal from './components/JudgeTourModal';
import { fetchHealth, loadDemoDataset } from './services/api';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: BarChart3, badge: 'Live' },
  { id: 'import', label: 'Data Import', icon: Database, badge: null },
  { id: 'contracts', label: 'Contract Explorer', icon: Layers, badge: 'MCX' },
  { id: 'relative-value', label: 'Relative Value', icon: TrendingUp, badge: null },
  { id: 'anomalies', label: 'Anomaly Analysis', icon: AlertTriangle, badge: '8-Pt' },
  { id: 'liquidity', label: 'Liquidity & Expiry', icon: Droplets, badge: 'Risk' },
  { id: 'backtesting', label: 'Backtesting Lab', icon: Activity, badge: 'No-Bias' },
  { id: 'quality', label: 'Data Quality', icon: ShieldCheck, badge: '100%' },
  { id: 'methodology', label: 'Methodology & About', icon: BookOpen, badge: 'PS03' }
];

export default function App() {
  const [currentView, setCurrentView] = useState('overview');
  const [isJudgeTourOpen, setIsJudgeTourOpen] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [activeDatasetInfo, setActiveDatasetInfo] = useState({
    name: 'MCX Gold Benchmark 2024',
    source: 'DEMO DATA (SYNTHETIC BENCHMARK)',
    dateRange: '2024-01-02 to 2024-12-30',
    records: 1000
  });

  const checkHealth = async () => {
    try {
      const h = await fetchHealth();
      setSystemHealth(h);
    } catch (e) {
      setSystemHealth({ status: 'OFFLINE' });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    window.addEventListener('focus', checkHealth);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkHealth);
    };
  }, []);

  const handleDatasetLoaded = (datasetRes) => {
    setActiveDatasetInfo({
      name: datasetRes.name || 'Custom Bhavcopy Feed',
      source: datasetRes.source_type === 'BENCHMARK_DEMO' ? 'DEMO DATA (SYNTHETIC BENCHMARK)' : 'USER-UPLOADED DATA',
      dateRange: datasetRes.summary?.date_range ? `${datasetRes.summary.date_range.start} to ${datasetRes.summary.date_range.end}` : '2024 Active',
      records: datasetRes.valid_rows || datasetRes.total_rows || 1000
    });
  };

  const handleSelectAnomalyFromOverview = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setCurrentView('anomalies');
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex flex-col font-sans">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div 
            onClick={() => setCurrentView('overview')}
            className="cursor-pointer flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md shadow-amber-500/20">
              GX
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                GOLDX
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PS03
                </span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400">Explainable Cross-Contract Gold Intelligence</span>
            </div>
          </div>
        </div>

        {/* Center: Provenance & Dataset Badge */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="gold-badge text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            {activeDatasetInfo.source}
          </div>
          <div className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 font-mono text-[11px]">
            {activeDatasetInfo.dateRange} ({activeDatasetInfo.records} Obs)
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 text-xs">
          <button
            onClick={() => setIsJudgeTourOpen(true)}
            className="gold-button px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Judge Demo Guide</span>
            <span className="sm:hidden">Guide</span>
          </button>

          {/* System Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-[10px]">
            {systemHealth?.status === 'HEALTHY' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-400">API Online</span>
              </>
            ) : systemHealth?.status === 'OFFLINE' ? (
              <button
                onClick={checkHealth}
                className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                title="Backend disconnected. Click to recheck."
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>API Offline (Retry)</span>
              </button>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-amber-400">Connecting...</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col justify-between bg-slate-900/60 border-r border-slate-800/80 p-4 shrink-0">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-1">
              Analytics Modules
            </span>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold shadow-sm shadow-amber-500/5'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      isActive ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Bottom Footer Info */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Hack in Hills '26</span>
              <span className="text-white font-medium text-[11px]">Team CodeHimalayan</span>
              <span className="text-slate-500 text-[10px]">Problem Statement 03</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>MCX Gold Specs v2024.1</span>
              <span className="text-emerald-500 font-mono">Verified</span>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-out Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-bold text-white text-sm">Navigation</span>
                  <button onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                        currentView === item.id ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 bg-black/60" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {systemHealth?.status === 'OFFLINE' && (
            <div className="mb-5 p-4 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/20 backdrop-blur-sm">
              <div className="flex items-start sm:items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <span className="font-semibold text-rose-100">Backend Server Disconnected:</span> Cannot reach the Node.js API on{' '}
                  <code className="px-1.5 py-0.5 rounded bg-rose-900/60 font-mono text-rose-300">http://127.0.0.1:5000</code>.
                  <div className="text-[11px] text-rose-300/80 mt-0.5">
                    Start the backend in your terminal with: <code className="font-mono font-bold text-rose-200">cd backend && npm start</code>
                  </div>
                </div>
              </div>
              <button
                onClick={checkHealth}
                className="px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-semibold text-xs shrink-0 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Connection
              </button>
            </div>
          )}
          {currentView === 'overview' && (
            <OverviewView 
              onNavigate={setCurrentView}
              onOpenJudgeTour={() => setIsJudgeTourOpen(true)}
              onSelectAnomaly={handleSelectAnomalyFromOverview}
            />
          )}

          {currentView === 'import' && (
            <DataImportView 
              onDatasetLoaded={handleDatasetLoaded}
              onNavigate={setCurrentView}
            />
          )}

          {currentView === 'contracts' && (
            <ContractExplorerView onNavigate={setCurrentView} />
          )}

          {currentView === 'relative-value' && (
            <RelativeValueView 
              onNavigate={setCurrentView}
              onSelectAnomaly={handleSelectAnomalyFromOverview}
            />
          )}

          {currentView === 'anomalies' && (
            <AnomalyAnalysisView 
              onNavigate={setCurrentView}
              selectedAnomaly={selectedAnomaly}
              setSelectedAnomaly={setSelectedAnomaly}
            />
          )}

          {currentView === 'liquidity' && (
            <LiquidityExpiryView onNavigate={setCurrentView} />
          )}

          {currentView === 'backtesting' && (
            <BacktestingLabView onNavigate={setCurrentView} />
          )}

          {currentView === 'quality' && (
            <DataQualityView onNavigate={setCurrentView} />
          )}

          {currentView === 'methodology' && (
            <MethodologyView />
          )}
        </main>
      </div>

      {/* Judge Tour Modal */}
      <JudgeTourModal
        isOpen={isJudgeTourOpen}
        onClose={() => setIsJudgeTourOpen(false)}
        currentView={currentView}
        onNavigate={setCurrentView}
      />
    </div>
  );
}
