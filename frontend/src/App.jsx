import { useState, useCallback } from 'react';
import BriefInput from './components/BriefInput';
import GenerationFeed from './components/GenerationFeed';
import FitnessChart from './components/FitnessChart';
import EvolutionTimeline from './components/EvolutionTimeline';
import StrategyReport from './components/StrategyReport';
import ExperimentLog from './components/ExperimentLog';
import EvolutionDashboard from './components/EvolutionDashboard';
import { startEvolution, streamEvents } from './api/client';

const TABS = [
  { key: 'generations', label: 'Generations', icon: '📋' },
  { key: 'experiments', label: 'Experiments', icon: '🧪' },
  { key: 'evolution', label: 'Evolution Timeline', icon: '🧬' },
  { key: 'report', label: 'Strategy Report', icon: '📊' },
];

export default function App() {
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [strategyReport, setStrategyReport] = useState('');
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState('Meta');
  const [activeTab, setActiveTab] = useState('generations');
  const [maxGenerations, setMaxGenerations] = useState(4);
  const [marketResearch, setMarketResearch] = useState('');

  const handleSubmit = useCallback(async (params) => {
    setRunning(true);
    setHistory([]);
    setStrategyReport('');
    setMarketResearch('');
    setError('');
    setCurrentNode('starting');
    setActiveTab('generations');

    try {
      setPlatform(params.platform || 'Meta');
      setMaxGenerations(params.generations || 4);
      const runId = await startEvolution(params);

      streamEvents(
        runId,
        (node, data) => {
          setCurrentNode(node);

          if (node === 'research' && data.market_research) {
            setMarketResearch(data.market_research);
          }
          if ((node === 'select' || node === 'mutate') && data.history) {
            setHistory(data.history);
          }
          if (node === 'report' && data.strategy_report) {
            setStrategyReport(data.strategy_report);
          }
        },
        () => {
          setRunning(false);
          setCurrentNode(null);
        },
        (msg) => {
          setError(msg);
          setRunning(false);
          setCurrentNode(null);
        },
      );
    } catch (err) {
      setError(err.message || 'Failed to start evolution');
      setRunning(false);
      setCurrentNode(null);
    }
  }, []);

  const hasEvolution = history.length >= 1;
  const hasExperiments = history.length >= 1;
  const hasReport = !!strategyReport;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <header className="border-b" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Creative Evolution Engine
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Evolve ad copy through natural selection
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
              CE
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="rounded-lg p-3 mb-4 text-sm border" style={{ backgroundColor: '#1a0a0a', borderColor: '#7f1d1d', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <BriefInput onSubmit={handleSubmit} disabled={running} />
            <FitnessChart history={history} />
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* Tab bar */}
            {history.length > 0 && (
              <div className="rounded-xl p-1.5 flex gap-1" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                {TABS.map((tab) => {
                  const disabled =
                    (tab.key === 'evolution' && !hasEvolution) ||
                    (tab.key === 'experiments' && !hasExperiments) ||
                    (tab.key === 'report' && !hasReport);

                  return (
                    <button
                      key={tab.key}
                      onClick={() => !disabled && setActiveTab(tab.key)}
                      disabled={disabled}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.key
                          ? 'text-gray-900 shadow-lg'
                          : disabled
                          ? 'cursor-not-allowed'
                          : 'hover:bg-white/5'
                      }`}
                      style={
                        activeTab === tab.key
                          ? { backgroundColor: 'var(--accent-yellow)', color: '#1a1a2e' }
                          : disabled
                          ? { color: 'var(--text-muted)' }
                          : { color: 'var(--text-secondary)' }
                      }
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      {tab.key === 'generations' && history.length > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          activeTab === tab.key ? 'bg-black/20 text-gray-900' : 'text-gray-400'
                        }`}
                        style={activeTab !== tab.key ? { backgroundColor: 'var(--border-medium)' } : {}}
                        >
                          {history.length}
                        </span>
                      )}
                      {tab.key === 'experiments' && !hasExperiments && (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>(pending)</span>
                      )}
                      {tab.key === 'evolution' && !hasEvolution && (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>(pending)</span>
                      )}
                      {tab.key === 'report' && !hasReport && (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>(pending)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Evolution Dashboard */}
            {(running || history.length > 0) && (
              <EvolutionDashboard
                history={history}
                currentNode={currentNode}
                running={running}
                maxGenerations={maxGenerations}
                marketResearch={marketResearch}
              />
            )}

            {/* Tab content */}
            {activeTab === 'generations' && (
              <GenerationFeed history={history} currentNode={currentNode} platform={platform} />
            )}
            {activeTab === 'experiments' && hasExperiments && (
              <ExperimentLog history={history} />
            )}
            {activeTab === 'evolution' && hasEvolution && (
              <EvolutionTimeline history={history} />
            )}
            {activeTab === 'report' && hasReport && (
              <StrategyReport report={strategyReport} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
