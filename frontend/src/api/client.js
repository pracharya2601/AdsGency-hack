import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function startEvolution({ brief, platform, audience, generations }) {
  const res = await axios.post(`${API_BASE}/api/evolve`, {
    brief,
    platform,
    audience,
    generations,
  });
  return res.data.run_id;
}

export function streamEvents(runId, onEvent, onDone, onError) {
  const source = new EventSource(`${API_BASE}/api/stream/${runId}`);

  source.addEventListener('generate', (e) => onEvent('generate', JSON.parse(e.data)));
  source.addEventListener('score', (e) => onEvent('score', JSON.parse(e.data)));
  source.addEventListener('select', (e) => onEvent('select', JSON.parse(e.data)));
  source.addEventListener('reflect', (e) => onEvent('reflect', JSON.parse(e.data)));
  source.addEventListener('mutate', (e) => onEvent('mutate', JSON.parse(e.data)));
  source.addEventListener('report', (e) => onEvent('report', JSON.parse(e.data)));
  source.addEventListener('done', () => { onDone(); source.close(); });
  source.addEventListener('error', (e) => {
    try {
      const data = JSON.parse(e.data);
      onError(data.message);
    } catch {
      onError('Connection lost');
    }
    source.close();
  });

  return () => source.close();
}

export async function getResults(runId) {
  const res = await axios.get(`${API_BASE}/api/results/${runId}`);
  return res.data;
}
