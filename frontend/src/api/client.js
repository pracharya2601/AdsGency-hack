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

  const nodes = ['generate', 'score', 'select', 'reflect', 'mutate', 'report'];
  nodes.forEach((node) => {
    source.addEventListener(node, (e) => {
      onEvent(node, JSON.parse(e.data));
    });
  });

  source.addEventListener('done', () => {
    source.close();
    onDone();
  });

  // Custom error event from our backend
  source.addEventListener('server_error', (e) => {
    source.close();
    try {
      const data = JSON.parse(e.data);
      onError(data.message);
    } catch {
      onError('Unknown server error');
    }
  });

  // Native EventSource error (connection issues)
  source.onerror = () => {
    if (source.readyState === EventSource.CLOSED) {
      // Connection closed normally (after done event) — ignore
      return;
    }
    source.close();
    onError('Connection lost');
  };

  return () => source.close();
}

export async function getResults(runId) {
  const res = await axios.get(`${API_BASE}/api/results/${runId}`);
  return res.data;
}
