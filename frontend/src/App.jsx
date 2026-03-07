import { useState, useCallback } from 'react';
import BriefInput from './components/BriefInput';
import GenerationFeed from './components/GenerationFeed';
import FitnessChart from './components/FitnessChart';
import StrategyReport from './components/StrategyReport';
import { startEvolution, streamEvents } from './api/client';

export default function App() {
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [strategyReport, setStrategyReport] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (params) => {
    setRunning(true);
    setHistory([]);
    setStrategyReport('');
    setError('');
    setCurrentNode('starting');

    try {
      const runId = await startEvolution(params);

      streamEvents(
        runId,
        (node, data) => {
          setCurrentNode(node);

          if (node === 'select' && data.history) {
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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Creative Evolution Engine</h1>
          <p className="text-sm text-gray-500">Evolve ad copy through natural selection</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <BriefInput onSubmit={handleSubmit} disabled={running} />
            <FitnessChart history={history} />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <GenerationFeed history={history} currentNode={currentNode} />
            <StrategyReport report={strategyReport} />
          </div>
        </div>
      </main>
    </div>
  );
}
