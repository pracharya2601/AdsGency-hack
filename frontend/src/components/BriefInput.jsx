import { useState } from 'react';

const PLATFORMS = ['Meta', 'Google', 'TikTok', 'LinkedIn', 'Twitter/X'];

export default function BriefInput({ onSubmit, disabled }) {
  const [brief, setBrief] = useState('');
  const [platform, setPlatform] = useState('Meta');
  const [audience, setAudience] = useState('');
  const [generations, setGenerations] = useState(4);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!brief.trim() || !audience.trim()) return;
    onSubmit({ brief, platform, audience, generations });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Ad Brief</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Product / Service Brief</label>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Describe your product, its key benefits, and what makes it unique..."
          className="w-full border rounded-md p-3 text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={disabled}
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Generations</label>
          <input
            type="number"
            min={1}
            max={10}
            value={generations}
            onChange={(e) => setGenerations(Number(e.target.value))}
            className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
        <input
          type="text"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g., Tech-savvy millennials interested in productivity tools"
          className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          disabled={disabled}
        />
      </div>

      <button
        type="submit"
        disabled={disabled || !brief.trim() || !audience.trim()}
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {disabled ? 'Evolving...' : 'Start Evolution'}
      </button>
    </form>
  );
}
