# React + Vite

## Key Patterns
- Vite config in `vite.config.js` — proxy API requests to backend in dev
- Use functional components with hooks (`useState`, `useEffect`, `useRef`)
- SSE consumption via `EventSource` API in the browser

## Vite Proxy Setup
```js
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
```

## SSE Consumption Pattern
```jsx
useEffect(() => {
  const source = new EventSource(`/api/stream/${runId}`);
  source.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // update state based on event type
  };
  source.onerror = () => source.close();
  return () => source.close();
}, [runId]);
```

## Common Commands
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm run dev      # dev server on :5173
npm run build    # production build to dist/
npm run preview  # preview production build
```

## Component Structure
- `BriefInput.jsx` — Form for brief, platform, audience
- `GenerationFeed.jsx` — Live feed of variants per generation
- `FitnessChart.jsx` — Recharts line/bar chart of fitness across generations
- `StrategyReport.jsx` — Final strategy summary panel
