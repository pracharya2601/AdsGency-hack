import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export default function FitnessChart({ history }) {
  if (history.length === 0) return null;

  const data = history.map((gen) => {
    const scores = gen.variants.map((v) => v.fitness_score);
    return {
      generation: `Gen ${gen.generation}`,
      avg: gen.avg_fitness,
      best: Math.max(...scores),
      worst: Math.min(...scores),
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <h3 className="font-bold text-gray-800 mb-3">Fitness Over Generations</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="generation" />
          <YAxis domain={[0, 10]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="best" stroke="#22c55e" name="Best" strokeWidth={2} />
          <Line type="monotone" dataKey="avg" stroke="#3b82f6" name="Average" strokeWidth={2} />
          <Line type="monotone" dataKey="worst" stroke="#ef4444" name="Worst" strokeWidth={1} strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
