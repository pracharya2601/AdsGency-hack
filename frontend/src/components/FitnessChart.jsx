import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, ReferenceLine,
} from 'recharts';

export default function FitnessChart({ history }) {
  if (history.length === 0) return null;

  const fitnessData = history.map((gen) => {
    const scores = gen.variants.map((v) => v.fitness_score);
    return {
      generation: `Gen ${gen.generation}`,
      best: Math.max(...scores),
      avg: gen.avg_fitness,
      worst: Math.min(...scores),
      threshold: gen.threshold,
      above: gen.above_threshold_ids?.length || 0,
      below: gen.below_threshold_ids?.length || 0,
    };
  });

  // Per-product fitness across generations
  const productNames = [...new Set(history.flatMap((gen) => gen.variants.map((v) => v.product_name)))];
  const productData = history.map((gen) => {
    const row = { generation: `Gen ${gen.generation}`, threshold: gen.threshold };
    gen.variants.forEach((v) => {
      if (v.product_name) row[v.product_name] = v.fitness_score;
    });
    return row;
  });

  const COLORS = ['#22d3ee', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#06b6d4', '#ec4899', '#fb923c'];

  // Performance signals for latest generation
  const latest = history[history.length - 1];
  const signalData = latest ? (() => {
    const signals = ['ctr', 'engagement', 'conversion', 'relevance', 'platform_fit', 'scroll_stop'];
    const labels = { ctr: 'CTR', engagement: 'Engage', conversion: 'Convert', relevance: 'Relevance', platform_fit: 'Platform', scroll_stop: 'Scroll Stop' };
    return signals.map((key) => {
      const aboveIds = new Set(latest.above_threshold_ids || []);
      const above = latest.variants.filter((v) => aboveIds.has(v.id));
      const below = latest.variants.filter((v) => !aboveIds.has(v.id));
      const avgAbove = above.length > 0
        ? above.reduce((sum, v) => sum + (v.dimension_scores?.[key] || 0), 0) / above.length
        : 0;
      const avgBelow = below.length > 0
        ? below.reduce((sum, v) => sum + (v.dimension_scores?.[key] || 0), 0) / below.length
        : 0;
      return { signal: labels[key] || key, above: +avgAbove.toFixed(1), below: +avgBelow.toFixed(1) };
    });
  })() : [];

  const tooltipStyle = {
    backgroundColor: '#131825',
    border: '1px solid #2a3548',
    borderRadius: '8px',
    color: '#e8ecf4',
  };

  return (
    <div className="space-y-4">
      {/* Fitness + threshold over generations */}
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Fitness vs Threshold</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Rising quality bar pushes all ads to improve</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={fitnessData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
            <XAxis dataKey="generation" tick={{ fontSize: 11, fill: '#8b95a8' }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#8b95a8' }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#8b95a8' }} />
            <Line type="monotone" dataKey="best" stroke="#34d399" name="Best" strokeWidth={2} />
            <Line type="monotone" dataKey="avg" stroke="#22d3ee" name="Average" strokeWidth={2} />
            <Line type="monotone" dataKey="worst" stroke="#f87171" name="Worst" strokeWidth={1} strokeDasharray="4 4" />
            <Line type="stepAfter" dataKey="threshold" stroke="#a78bfa" name="Threshold" strokeWidth={2} strokeDasharray="6 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-product fitness tracking */}
      {productNames.length > 0 && history.length > 1 && (
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Per-Product Improvement</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Each product's ad fitness across generations</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={productData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis dataKey="generation" tick={{ fontSize: 11, fill: '#8b95a8' }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#8b95a8' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10, color: '#8b95a8' }} />
              <Line type="stepAfter" dataKey="threshold" stroke="#a78bfa" name="Threshold" strokeWidth={2} strokeDasharray="6 3" />
              {productNames.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Above vs Below signals */}
      {signalData.length > 0 && (
        <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Performance Signals</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Above vs below threshold — Gen {latest.generation}</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={signalData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
              <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10, fill: '#8b95a8' }} />
              <YAxis type="category" dataKey="signal" tick={{ fontSize: 10, fill: '#8b95a8' }} width={65} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#8b95a8' }} />
              <Bar dataKey="above" fill="#34d399" name="Above Threshold" barSize={8} />
              <Bar dataKey="below" fill="#fbbf24" name="Below Threshold" barSize={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
