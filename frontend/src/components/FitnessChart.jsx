import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';

export default function FitnessChart({ history }) {
  if (history.length === 0) return null;

  const fitnessData = history.map((gen) => {
    const scores = gen.variants.map((v) => v.fitness_score);
    return {
      generation: `Gen ${gen.generation}`,
      avg: gen.avg_fitness,
      best: Math.max(...scores),
      worst: Math.min(...scores),
    };
  });

  // Aggregate performance signals for the latest generation
  const latest = history[history.length - 1];
  const signalData = latest ? (() => {
    const signals = ['ctr', 'engagement', 'conversion', 'relevance', 'platform_fit', 'scroll_stop'];
    const labels = { ctr: 'CTR', engagement: 'Engage', conversion: 'Convert', relevance: 'Relevance', platform_fit: 'Platform', scroll_stop: 'Scroll Stop' };
    return signals.map((key) => {
      const survivors = latest.variants.filter((v) => v.survived);
      const losers = latest.variants.filter((v) => !v.survived);
      const avgSurvivor = survivors.length > 0
        ? survivors.reduce((sum, v) => sum + (v.dimension_scores?.[key] || 0), 0) / survivors.length
        : 0;
      const avgLoser = losers.length > 0
        ? losers.reduce((sum, v) => sum + (v.dimension_scores?.[key] || 0), 0) / losers.length
        : 0;
      return { signal: labels[key] || key, winners: +avgSurvivor.toFixed(1), losers: +avgLoser.toFixed(1) };
    });
  })() : [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-5">
        <h3 className="font-bold text-gray-800 mb-3">Fitness Over Generations</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={fitnessData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="generation" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="best" stroke="#22c55e" name="Best" strokeWidth={2} />
            <Line type="monotone" dataKey="avg" stroke="#3b82f6" name="Average" strokeWidth={2} />
            <Line type="monotone" dataKey="worst" stroke="#ef4444" name="Worst" strokeWidth={1} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {signalData.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-5">
          <h3 className="font-bold text-gray-800 mb-1">Performance Signals</h3>
          <p className="text-xs text-gray-400 mb-3">Winners vs Losers — Gen {latest.generation}</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={signalData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="signal" tick={{ fontSize: 10 }} width={65} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="winners" fill="#22c55e" name="Winners" barSize={8} />
              <Bar dataKey="losers" fill="#ef4444" name="Losers" barSize={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
