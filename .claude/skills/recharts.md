# Recharts

## Key Patterns
- Recharts uses declarative React components for charts
- Data is passed as an array of objects to the chart component
- Each object represents a data point; keys map to chart axes/series

## Fitness Chart Pattern
```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Data shape: [{ generation: 1, avgFitness: 5.2, bestFitness: 6.8 }, ...]
function FitnessChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="generation" label={{ value: 'Generation', position: 'bottom' }} />
        <YAxis domain={[0, 10]} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="avgFitness" stroke="#8884d8" name="Avg Fitness" />
        <Line type="monotone" dataKey="bestFitness" stroke="#82ca9d" name="Best Fitness" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

## Common Commands
```bash
npm install recharts
```

## Tips
- Always wrap charts in `<ResponsiveContainer>` for responsive sizing
- Use `domain={[0, 10]}` on YAxis since fitness scores range 0–10
- `BarChart` works well for comparing variants within a single generation
- `LineChart` works well for tracking fitness across generations
