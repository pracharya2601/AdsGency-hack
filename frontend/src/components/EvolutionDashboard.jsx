import { useState, useEffect, useRef } from 'react';

// Animated counter hook
function useAnimatedValue(target, duration = 600) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    const diff = target - from;
    if (Math.abs(diff) < 0.01) { setDisplay(target); prev.current = target; return; }
    const start = performance.now();
    let raf;
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const val = from + diff * eased;
      setDisplay(val);
      if (t < 1) { raf = requestAnimationFrame(step); }
      else { prev.current = target; }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return display;
}

const NODE_LABELS = {
  starting: 'Initializing',
  research: 'Researching Market Trends',
  generate: 'Generating Ads',
  score: 'Scoring Performance',
  select: 'Applying Threshold',
  mutate: 'Analyzing & Mutating',
  report: 'Writing Strategy Report',
};

const NODE_ORDER = ['research', 'generate', 'score', 'select', 'mutate'];

function ProgressBar({ currentNode, generation, maxGenerations, running }) {
  if (!running) return null;

  const genProgress = Math.max(0, generation - 1);
  const nodeIdx = NODE_ORDER.indexOf(currentNode);
  const nodeProgress = nodeIdx >= 0 ? (nodeIdx + 1) / NODE_ORDER.length : 0;
  const totalProgress = currentNode === 'report'
    ? 95
    : Math.round(((genProgress + nodeProgress) / maxGenerations) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium animate-pulse" style={{ color: 'var(--accent-cyan)' }}>
          {NODE_LABELS[currentNode] || currentNode}...
        </span>
        <span style={{ color: 'var(--text-secondary)' }}>
          Gen {generation}/{maxGenerations}
        </span>
      </div>
      <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--border-subtle)' }}>
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(totalProgress, 100)}%`, background: 'linear-gradient(90deg, #22d3ee, #a78bfa)' }}
        />
      </div>
      {/* Node step indicators */}
      <div className="flex gap-1">
        {NODE_ORDER.map((node, i) => (
          <div
            key={node}
            className={`flex-1 h-1 rounded-full transition-colors duration-300 ${i === nodeIdx ? 'pulse-glow' : ''}`}
            style={{ backgroundColor: i <= nodeIdx ? '#22d3ee' : 'var(--border-medium)' }}
          />
        ))}
      </div>
    </div>
  );
}

function AnimatedMetric({ value, decimals = 1, suffix = '', style }) {
  const animated = useAnimatedValue(value);
  return <div className="text-xl font-bold" style={style}>{animated.toFixed(decimals)}{suffix}</div>;
}

export default function EvolutionDashboard({ history, currentNode, running, maxGenerations, marketResearch }) {
  if (history.length === 0 && !running) return null;

  const currentGen = history.length > 0 ? history[history.length - 1].generation : 1;

  // Compute adaptive learning metrics
  const totalAds = history.length > 0 ? history[history.length - 1].variants.length : 0;
  const latestAbove = history.length > 0 ? history[history.length - 1].above_threshold_ids?.length || 0 : 0;
  const firstAbove = history.length > 0 ? history[0].above_threshold_ids?.length || 0 : 0;

  // Fitness improvement
  const firstAvg = history.length > 0 ? history[0].avg_fitness : 0;
  const latestAvg = history.length > 0 ? history[history.length - 1].avg_fitness : 0;
  const fitnessGain = latestAvg - firstAvg;

  // Threshold progression
  const firstThreshold = history.length > 0 ? history[0].threshold : 0;
  const latestThreshold = history.length > 0 ? history[history.length - 1].threshold : 0;

  // Best strategy from latest gen
  const latestStrategies = history.length > 0
    ? history[history.length - 1].strategies_discovered || []
    : [];

  // Count products that improved across generations
  let improvedCount = 0;
  let totalProducts = 0;
  if (history.length >= 2) {
    const firstGen = history[0];
    const lastGen = history[history.length - 1];
    const firstScores = {};
    firstGen.variants.forEach((v) => { firstScores[v.product_name || v.product_id] = v.fitness_score; });
    lastGen.variants.forEach((v) => {
      const name = v.product_name || v.product_id;
      totalProducts++;
      if (v.fitness_score > (firstScores[name] || 0)) improvedCount++;
    });
  }

  // Latest experiment insight
  const latestExperiment = history.length > 0 ? history[history.length - 1].experiment : null;

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      {/* Progress bar when running */}
      <ProgressBar
        currentNode={currentNode}
        generation={currentGen}
        maxGenerations={maxGenerations}
        running={running}
      />

      {/* Metrics grid */}
      {history.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg p-3 text-center metric-hover" style={{ backgroundColor: 'rgba(34, 211, 238, 0.08)', border: '1px solid rgba(34, 211, 238, 0.15)' }}>
            <AnimatedMetric value={latestAvg} style={{ color: '#22d3ee' }} />
            <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Avg Fitness</div>
            {history.length >= 2 && (
              <div className="text-xs font-semibold mt-0.5" style={{ color: fitnessGain >= 0 ? '#34d399' : '#f87171' }}>
                {fitnessGain >= 0 ? '+' : ''}{fitnessGain.toFixed(2)} from Gen 1
              </div>
            )}
          </div>

          <div className="rounded-lg p-3 text-center metric-hover" style={{ backgroundColor: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.15)' }}>
            <div className="text-xl font-bold" style={{ color: '#34d399' }}>{latestAbove}/{totalAds}</div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Pass Rate</div>
            {history.length >= 2 && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                was {firstAbove}/{totalAds} in Gen 1
              </div>
            )}
          </div>

          <div className="rounded-lg p-3 text-center metric-hover" style={{ backgroundColor: 'rgba(167, 139, 250, 0.08)', border: '1px solid rgba(167, 139, 250, 0.15)' }}>
            <div className="text-xl font-bold" style={{ color: '#a78bfa' }}>{latestThreshold}</div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Quality Bar</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              started at {firstThreshold}
            </div>
          </div>

          <div className="rounded-lg p-3 text-center metric-hover" style={{ backgroundColor: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.15)' }}>
            <div className="text-xl font-bold" style={{ color: '#fbbf24' }}>
              {totalProducts > 0 ? `${Math.round((improvedCount / totalProducts) * 100)}%` : '--'}
            </div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Products Improved</div>
            {totalProducts > 0 && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {improvedCount}/{totalProducts} products
              </div>
            )}
          </div>
        </div>
      )}

      {/* Latest learning insight */}
      {latestExperiment?.learned && (
        <div className="rounded-lg p-3" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(167,139,250,0.1))', border: '1px solid rgba(167,139,250,0.2)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#a78bfa' }}>
            Latest Adaptive Insight (Gen {currentGen})
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{latestExperiment.learned}</p>
        </div>
      )}

      {/* Market Research Brief */}
      {marketResearch && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-medium flex items-center gap-1.5 rounded-lg p-3" style={{ color: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}>
            <span className="group-open:rotate-90 transition-transform text-[10px]">&#9654;</span>
            Market Research Brief (pre-generation analysis)
          </summary>
          <pre className="mt-1 p-3 rounded-b-lg text-[11px] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto" style={{ backgroundColor: 'rgba(34,211,238,0.04)', borderLeft: '1px solid rgba(34,211,238,0.15)', borderRight: '1px solid rgba(34,211,238,0.15)', borderBottom: '1px solid rgba(34,211,238,0.15)', color: 'var(--text-secondary)' }}>
            {marketResearch}
          </pre>
        </details>
      )}
    </div>
  );
}
