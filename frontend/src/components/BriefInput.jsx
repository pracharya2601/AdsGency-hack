import { useState, useEffect } from 'react';
import { fetchProducts } from '../api/client';

const PLATFORMS = ['Meta', 'Google', 'TikTok', 'LinkedIn', 'Twitter/X'];

export default function BriefInput({ onSubmit, disabled }) {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [platform, setPlatform] = useState('Meta');
  const [audience, setAudience] = useState('');
  const [generations, setGenerations] = useState(4);
  const [threshold, setThreshold] = useState(5.0);
  const [thresholdStep, setThresholdStep] = useState(0.5);

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data);
        setSelected(new Set(data.map((_, i) => i)));
        setLoading(false);
      })
      .catch((err) => {
        setFetchError(err.message || 'Failed to load products');
        setLoading(false);
      });
  }, []);

  const toggleProduct = (index) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((_, i) => i)));
    }
  };

  const selectedProducts = products.filter((_, i) => selected.has(i));
  const allSelected = products.length > 0 && selected.size === products.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0 || !audience.trim()) return;
    onSubmit({
      products: selectedProducts,
      platform,
      audience,
      generations,
      threshold,
      threshold_step: thresholdStep,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-6 space-y-5"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Products
        </h2>
        {!loading && !fetchError && products.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            disabled={disabled}
            className="text-xs font-medium transition-opacity duration-150 hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ color: 'var(--accent-cyan)' }}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div
          className="text-sm animate-pulse"
          style={{ color: 'var(--text-muted)' }}
        >
          Loading products...
        </div>
      )}

      {/* Error state */}
      {fetchError && (
        <div
          className="text-sm rounded-lg px-3 py-2.5"
          style={{
            backgroundColor: 'rgba(127, 29, 29, 0.25)',
            border: '1px solid rgba(185, 28, 28, 0.5)',
            color: '#fca5a5',
          }}
        >
          {fetchError}
        </div>
      )}

      {/* Product list */}
      {!loading && !fetchError && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {products.map((p, i) => {
            const isSelected = selected.has(i);
            return (
              <div
                key={i}
                onClick={() => !disabled && toggleProduct(i)}
                className={`rounded-lg p-3 transition-all duration-200 ${
                  disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
                style={{
                  backgroundColor: isSelected
                    ? 'rgba(34, 211, 238, 0.07)'
                    : 'var(--bg-primary)',
                  border: isSelected
                    ? '1px solid rgba(34, 211, 238, 0.3)'
                    : '1px solid var(--border-medium)',
                  boxShadow: isSelected
                    ? '0 0 0 1px rgba(34, 211, 238, 0.06) inset'
                    : 'none',
                  opacity: isSelected ? 1 : 0.55,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleProduct(i)}
                    disabled={disabled}
                    className="rounded shrink-0 accent-cyan-400"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-sm font-semibold truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {p.name}
                      </span>
                      {p.price_point && (
                        <span
                          className="text-xs shrink-0 tabular-nums"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {p.price_point}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {p.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected count */}
      {!loading && !fetchError && (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {selected.size} of {products.length} selected
        </div>
      )}

      {/* Platform + Generations */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Platform
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-shadow duration-150"
            disabled={disabled}
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Generations
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={generations}
            onChange={(e) => setGenerations(Number(e.target.value))}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-shadow duration-150"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Threshold + Step */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Starting Threshold{' '}
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              (/10)
            </span>
          </label>
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-shadow duration-150"
            disabled={disabled}
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Step Increase{' '}
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              (/gen)
            </span>
          </label>
          <input
            type="number"
            min={0}
            max={3}
            step={0.1}
            value={thresholdStep}
            onChange={(e) => setThresholdStep(Number(e.target.value))}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-shadow duration-150"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Target Audience */}
      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          Target Audience
        </label>
        <input
          type="text"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g., SMEs looking for AI-powered marketing tools"
          className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-shadow duration-150 placeholder:opacity-40"
          disabled={disabled}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={disabled || selected.size === 0 || !audience.trim()}
        className="w-full font-semibold py-2.5 rounded-lg text-sm text-white btn-interactive disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background:
            'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)',
          boxShadow: disabled ? 'none' : '0 0 20px rgba(34, 211, 238, 0.18)',
        }}
      >
        {disabled && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {disabled
          ? 'Evolving...'
          : `Evolve ${selected.size} Ad${selected.size !== 1 ? 's' : ''}`}
      </button>
    </form>
  );
}
