import { useState, useEffect, useRef, useCallback } from 'react';

function SignalBar({ label, value, color }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);
  const width = Math.min(Math.max(value * 10, 0), 100);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setAnimated(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex items-center gap-1.5 group tooltip-trigger">
      <span className="text-[10px] w-16 text-right shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="flex-1 rounded-full h-1.5" style={{ background: 'var(--border-medium)' }}>
        <div className={`h-1.5 rounded-full signal-fill ${color}`} style={{ width: animated ? `${width}%` : '0%' }} />
      </div>
      <span className="text-[10px] font-mono w-6" style={{ color: 'var(--text-muted)' }}>{value?.toFixed?.(1) ?? '-'}</span>
      <span className="tooltip-text">{label}: {value?.toFixed?.(2) ?? 'N/A'} / 10</span>
    </div>
  );
}

// Click-to-expand detail modal
function AdDetailModal({ variant, platform, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const scores = variant.dimension_scores || {};
  const signals = [
    { key: 'ctr', label: 'CTR', color: '#22d3ee' },
    { key: 'engagement', label: 'Engagement', color: '#34d399' },
    { key: 'conversion', label: 'Conversion', color: '#fb923c' },
    { key: 'relevance', label: 'Relevance', color: '#a78bfa' },
    { key: 'platform_fit', label: 'Platform Fit', color: '#38bdf8' },
    { key: 'scroll_stop', label: 'Scroll Stop', color: '#f87171' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="modal-content rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(34,211,238,0.12)', color: 'var(--accent-cyan)' }}
            >
              {(variant.product_name || 'P')[0]}
            </div>
            <div>
              <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                {variant.product_name || 'Product'}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{platform} Ad Preview</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            x
          </button>
        </div>

        {/* Score + status */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl font-bold font-mono" style={{ color: variant.above_threshold ? '#34d399' : '#fbbf24' }}>
            {variant.fitness_score.toFixed(2)}
          </div>
          <span
            className="text-xs px-3 py-1 rounded-full font-semibold"
            style={
              variant.above_threshold
                ? { background: 'rgba(52,211,153,0.15)', color: '#34d399' }
                : { background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }
            }
          >
            {variant.above_threshold ? 'ABOVE THRESHOLD' : 'NEEDS IMPROVEMENT'}
          </span>
        </div>

        {/* Ad copy */}
        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--accent-cyan)' }}>
            Headline
          </div>
          <div className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{variant.headline}</div>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--accent-cyan)' }}>
            Body Copy
          </div>
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>{variant.body}</p>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--accent-cyan)' }}>
            Call to Action
          </div>
          <span className="inline-block px-4 py-1.5 rounded-lg text-sm font-semibold" style={{ background: 'var(--accent-cyan)', color: '#0b0e17' }}>
            {variant.cta}
          </span>
        </div>

        {/* Creative DNA */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: 'Strategy', value: variant.creative_strategy },
            { label: 'Tone', value: variant.emotional_tone },
            { label: 'Hook', value: variant.hook_type },
          ].filter(t => t.value).map(t => (
            <span key={t.label} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
              {t.label}: {t.value}
            </span>
          ))}
        </div>

        {/* Signal breakdown — large interactive bars */}
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
          Performance Signals
        </div>
        <div className="space-y-2.5">
          {signals.map(({ key, label, color }) => {
            const val = scores[key] ?? 0;
            const pct = Math.min(val * 10, 100);
            return (
              <div key={key} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span className="text-xs font-mono font-semibold" style={{ color }}>{val.toFixed(2)}</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border-medium)' }}>
                  <div
                    className="h-full rounded-full signal-fill transition-all duration-700"
                    style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}40` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for cards
function CardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-8 h-8 rounded-full skeleton" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-24 skeleton" />
          <div className="h-2 w-16 skeleton" />
        </div>
      </div>
      <div className="px-3 pb-2 space-y-1.5">
        <div className="h-3 w-full skeleton" />
        <div className="h-3 w-3/4 skeleton" />
      </div>
      <div className="skeleton" style={{ aspectRatio: '1 / 1' }} />
      <div className="px-3 py-3 space-y-1.5">
        <div className="h-3 w-2/3 skeleton" />
        <div className="h-4 w-20 skeleton rounded-md" />
      </div>
    </div>
  );
}

const PLATFORM_CONFIG = {
  Meta: {
    label: 'Meta',
    icon: '📘',
    accent: 'blue',
    cardStyle: 'meta',
  },
  Google: {
    label: 'Google Ads',
    icon: '🔍',
    accent: 'emerald',
    cardStyle: 'google',
  },
  TikTok: {
    label: 'TikTok',
    icon: '🎵',
    accent: 'pink',
    cardStyle: 'tiktok',
  },
  LinkedIn: {
    label: 'LinkedIn',
    icon: '💼',
    accent: 'sky',
    cardStyle: 'linkedin',
  },
  Twitter: {
    label: 'X / Twitter',
    icon: '𝕏',
    accent: 'gray',
    cardStyle: 'twitter',
  },
};

// Real platform ad dimensions & grid layout
const PLATFORM_DIMENSIONS = {
  meta:     { ratio: '1 / 1',    cols: 'grid-cols-1 sm:grid-cols-2', label: '1080 × 1080' },
  google:   { ratio: '1.91 / 1', cols: 'grid-cols-1',                label: '1200 × 628'  },
  tiktok:   { ratio: '9 / 16',   cols: 'grid-cols-2 sm:grid-cols-3', label: '1080 × 1920' },
  linkedin: { ratio: '1.91 / 1', cols: 'grid-cols-1',                label: '1200 × 627'  },
  twitter:  { ratio: '16 / 9',   cols: 'grid-cols-1',                label: '1200 × 675'  },
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function placeholderImg(seed) {
  return `https://picsum.photos/seed/${seed}/800/800`;
}

function adImage(variant) {
  if (variant.image_url) {
    return `${API_BASE}${variant.image_url}`;
  }
  return placeholderImg(variant.id);
}

function ScoreBadge({ isAbove, score }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{score.toFixed(2)}</span>
      <span
        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
        style={
          isAbove
            ? { background: 'rgba(52,211,153,0.15)', color: 'var(--accent-green)' }
            : { background: 'rgba(251,191,36,0.15)', color: 'var(--accent-yellow)' }
        }
      >
        {isAbove ? 'PASS' : 'IMPROVE'}
      </span>
    </div>
  );
}

function SignalGrid({ scores }) {
  if (!scores || Object.keys(scores).length === 0) return null;
  return (
    <div
      className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 pt-2 border-t"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <SignalBar label="CTR" value={scores.ctr} color="bg-cyan-400" />
      <SignalBar label="Engage" value={scores.engagement} color="bg-emerald-400" />
      <SignalBar label="Convert" value={scores.conversion} color="bg-orange-400" />
      <SignalBar label="Relevance" value={scores.relevance} color="bg-violet-400" />
      <SignalBar label="Platform" value={scores.platform_fit} color="bg-sky-400" />
      <SignalBar label="Scroll Stop" value={scores.scroll_stop} color="bg-rose-400" />
    </div>
  );
}

function MetaCard({ v }) {
  const isAbove = v.above_threshold;
  return (
    <div
      className="rounded-lg overflow-hidden text-sm border"
      style={{
        background: 'var(--bg-card)',
        borderColor: isAbove ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)',
      }}
    >
      {/* Facebook-style header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'var(--bg-card)' }}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'rgba(34,211,238,0.12)', color: 'var(--accent-cyan)' }}
        >
          {(v.product_name || 'P')[0]}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{v.product_name || 'Product'}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sponsored</div>
        </div>
        <ScoreBadge isAbove={isAbove} score={v.fitness_score} />
      </div>

      {/* Body text */}
      <div className="px-3 pb-2">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{v.body}</p>
      </div>

      {/* Image — 1:1 feed ratio */}
      <img
        src={adImage(v)}
        alt="Ad creative"
        className="w-full object-cover"
        style={{ background: 'var(--bg-primary)', aspectRatio: '1 / 1' }}
      />

      {/* Headline + CTA bar */}
      <div className="px-3 py-2 flex items-center justify-between" style={{ background: 'var(--bg-primary)' }}>
        <div>
          <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{v.product_name || 'brand'}.com</div>
          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{v.headline}</div>
        </div>
        <button
          className="text-xs font-semibold px-4 py-1.5 rounded"
          style={{ background: 'var(--accent-cyan)', color: '#0b0e17' }}
        >
          {v.cta}
        </button>
      </div>

      {/* Meta row */}
      <div
        className="px-3 py-2 border-t"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex gap-3 text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
          {v.creative_strategy && (
            <span
              className="px-1.5 py-0.5 rounded font-medium"
              style={{ background: 'rgba(34,211,238,0.08)', color: 'var(--accent-cyan)' }}
            >
              {v.creative_strategy}
            </span>
          )}
          <span>Tone: {v.emotional_tone}</span>
          <span>Hook: {v.hook_type}</span>
        </div>
        <SignalGrid scores={v.dimension_scores} />
      </div>
    </div>
  );
}

function GoogleCard({ v }) {
  const isAbove = v.above_threshold;
  return (
    <div
      className="rounded-lg overflow-hidden text-sm border"
      style={{
        background: 'var(--bg-card)',
        borderColor: isAbove ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)',
      }}
    >
      {/* Search ad style */}
      <div className="px-4 py-3" style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <span
              className="text-[10px] font-bold border px-1 rounded"
              style={{ color: '#34d399', background: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.3)' }}
            >
              Ad
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.product_name || 'brand'}.com</span>
          </div>
          <ScoreBadge isAbove={isAbove} score={v.fitness_score} />
        </div>
        <h4 className="font-medium text-base hover:underline cursor-pointer" style={{ color: 'var(--accent-cyan)' }}>{v.headline}</h4>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{v.body}</p>
        <div className="flex gap-2 mt-2">
          <span
            className="text-xs border rounded px-2 py-0.5"
            style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(34,211,238,0.3)' }}
          >
            {v.cta}
          </span>
        </div>
      </div>

      {/* Image as display ad companion */}
      <div className="flex border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <img
          src={adImage(v)}
          alt="Ad creative"
          className="w-32 object-cover shrink-0"
          style={{ background: 'var(--bg-primary)', aspectRatio: '1 / 1' }}
        />
        <div className="flex-1 px-3 py-2">
          <div className="flex gap-2 text-[10px] flex-wrap" style={{ color: 'var(--text-muted)' }}>
            {v.creative_strategy && (
              <span
                className="px-1.5 py-0.5 rounded font-medium"
                style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399' }}
              >
                {v.creative_strategy}
              </span>
            )}
            <span>Tone: {v.emotional_tone}</span>
            <span>Hook: {v.hook_type}</span>
          </div>
          <SignalGrid scores={v.dimension_scores} />
        </div>
      </div>
    </div>
  );
}

function TikTokCard({ v }) {
  const isAbove = v.above_threshold;
  return (
    <div
      className="rounded-lg overflow-hidden text-sm border"
      style={{
        background: 'var(--bg-card)',
        borderColor: isAbove ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)',
      }}
    >
      {/* Vertical image with overlay */}
      <div className="relative">
        <img
          src={adImage(v)}
          alt="Ad creative"
          className="w-full object-cover"
          style={{ background: 'var(--bg-primary)', aspectRatio: '9 / 16' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-[10px] font-bold">
              {(v.product_name || 'P')[0]}
            </div>
            <span className="text-xs font-semibold">{v.product_name || 'Product'}</span>
            <span className="text-[10px] bg-pink-500/80 px-1.5 py-0.5 rounded">Sponsored</span>
          </div>
          <p className="text-sm font-medium leading-snug">{v.headline}</p>
          <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{v.body}</p>
        </div>
        {/* Right-side TikTok actions mock */}
        <div className="absolute right-2 bottom-16 flex flex-col items-center gap-3 text-white">
          <div className="text-center"><span className="text-lg">♥</span><div className="text-[9px]">12.3K</div></div>
          <div className="text-center"><span className="text-lg">💬</span><div className="text-[9px]">482</div></div>
          <div className="text-center"><span className="text-lg">↗</span><div className="text-[9px]">Share</div></div>
        </div>
      </div>

      {/* CTA + meta */}
      <div className="px-3 py-2" style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between mb-1">
          <button className="bg-pink-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full">{v.cta}</button>
          <ScoreBadge isAbove={isAbove} score={v.fitness_score} />
        </div>
        <div className="flex gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {v.creative_strategy && (
            <span
              className="px-1.5 py-0.5 rounded font-medium"
              style={{ background: 'rgba(236,72,153,0.12)', color: '#f472b6' }}
            >
              {v.creative_strategy}
            </span>
          )}
          <span>Tone: {v.emotional_tone}</span>
          <span>Hook: {v.hook_type}</span>
        </div>
        <SignalGrid scores={v.dimension_scores} />
      </div>
    </div>
  );
}

function LinkedInCard({ v }) {
  const isAbove = v.above_threshold;
  return (
    <div
      className="rounded-lg overflow-hidden text-sm border"
      style={{
        background: 'var(--bg-card)',
        borderColor: isAbove ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)',
      }}
    >
      {/* LinkedIn header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'var(--bg-card)' }}>
        <div
          className="w-10 h-10 rounded flex items-center justify-center text-sm font-bold"
          style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}
        >
          {(v.product_name || 'P')[0]}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{v.product_name || 'Product'}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Promoted</div>
        </div>
        <ScoreBadge isAbove={isAbove} score={v.fitness_score} />
      </div>

      <div className="px-3 pb-2">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{v.body}</p>
      </div>

      <img
        src={adImage(v)}
        alt="Ad creative"
        className="w-full object-cover"
        style={{ background: 'var(--bg-primary)', aspectRatio: '1.91 / 1' }}
      />

      <div className="px-3 py-2" style={{ background: 'rgba(56,189,248,0.06)' }}>
        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{v.headline}</div>
        <button
          className="mt-1.5 text-xs font-semibold px-4 py-1 rounded-full border"
          style={{ borderColor: 'rgba(56,189,248,0.5)', color: '#38bdf8' }}
        >
          {v.cta}
        </button>
      </div>

      <div
        className="px-3 py-2 border-t"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex gap-2 text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
          {v.creative_strategy && (
            <span
              className="px-1.5 py-0.5 rounded font-medium"
              style={{ background: 'rgba(56,189,248,0.08)', color: '#38bdf8' }}
            >
              {v.creative_strategy}
            </span>
          )}
          <span>Tone: {v.emotional_tone}</span>
          <span>Hook: {v.hook_type}</span>
        </div>
        <SignalGrid scores={v.dimension_scores} />
      </div>
    </div>
  );
}

function TwitterCard({ v }) {
  const isAbove = v.above_threshold;
  return (
    <div
      className="rounded-lg overflow-hidden text-sm border"
      style={{
        background: 'var(--bg-card)',
        borderColor: isAbove ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)',
      }}
    >
      <div className="flex gap-2 px-3 py-2" style={{ background: 'var(--bg-card)' }}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'var(--border-medium)', color: 'var(--text-secondary)' }}
        >
          {(v.product_name || 'P')[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{v.product_name || 'Product'}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>@{(v.product_name || 'brand').toLowerCase().replace(/\s/g, '')}</span>
            <span className="text-[10px]" style={{ color: 'var(--border-medium)' }}>·</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Ad</span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{v.body}</p>

          {/* Card preview */}
          <div className="mt-2 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-subtle)' }}>
            <img
              src={adImage(v)}
              alt="Ad creative"
              className="w-full object-cover"
              style={{ background: 'var(--bg-primary)', aspectRatio: '16 / 9' }}
            />
            <div className="px-3 py-2" style={{ background: 'var(--bg-primary)' }}>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{(v.product_name || 'brand').toLowerCase()}.com</div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{v.headline}</div>
            </div>
          </div>

          {/* Engagement row */}
          <div className="flex items-center justify-between mt-2" style={{ color: 'var(--text-muted)' }}>
            <span className="text-xs">💬 24</span>
            <span className="text-xs">🔄 18</span>
            <span className="text-xs">♥ 156</span>
            <span className="text-xs">📊 2.1K</span>
          </div>
        </div>
        <ScoreBadge isAbove={isAbove} score={v.fitness_score} />
      </div>

      <div
        className="px-3 py-2 border-t"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {v.creative_strategy && (
              <span
                className="px-1.5 py-0.5 rounded font-medium"
                style={{ background: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                {v.creative_strategy}
              </span>
            )}
            <span>Tone: {v.emotional_tone}</span>
            <span>Hook: {v.hook_type}</span>
          </div>
          <button
            className="text-xs font-semibold px-4 py-1 rounded-full"
            style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
          >
            {v.cta}
          </button>
        </div>
        <SignalGrid scores={v.dimension_scores} />
      </div>
    </div>
  );
}

function VariantCard({ v, threshold, platform, onSelect }) {
  const cardStyle = PLATFORM_CONFIG[platform]?.cardStyle || 'meta';

  let card;
  switch (cardStyle) {
    case 'google':   card = <GoogleCard v={v} />; break;
    case 'tiktok':   card = <TikTokCard v={v} />; break;
    case 'linkedin': card = <LinkedInCard v={v} />; break;
    case 'twitter':  card = <TwitterCard v={v} />; break;
    case 'meta':
    default:         card = <MetaCard v={v} />; break;
  }

  return (
    <div className="card-hover cursor-pointer" onClick={() => onSelect(v)}>
      {card}
    </div>
  );
}

export default function GenerationFeed({ history, currentNode, platform = 'Meta' }) {
  const [collapsed, setCollapsed] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);

  const handleSelect = useCallback((v) => setSelectedVariant(v), []);
  const handleClose = useCallback(() => setSelectedVariant(null), []);

  if (history.length === 0 && !currentNode) {
    return (
      <div
        className="rounded-lg shadow-md p-6 text-center"
        style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}
      >
        Waiting for evolution to start...
      </div>
    );
  }

  // Show skeleton cards while running with no results yet
  if (history.length === 0 && currentNode) {
    const cardStyle = PLATFORM_CONFIG[platform]?.cardStyle || 'meta';
    const dims = PLATFORM_DIMENSIONS[cardStyle] || PLATFORM_DIMENSIONS.meta;
    return (
      <div className="space-y-4">
        <div
          className="rounded-md px-4 py-2 text-sm font-medium animate-pulse border"
          style={{ background: 'rgba(34,211,238,0.08)', borderColor: 'rgba(34,211,238,0.25)', color: 'var(--accent-cyan)' }}
        >
          Running: <span className="font-semibold">{currentNode}</span>
        </div>
        <div className="rounded-lg shadow-md p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-40 skeleton rounded" />
          </div>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {[0,1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-md" />)}
          </div>
          <div className={`grid gap-3 ${dims.cols}`}>
            {[0,1,2].map(i => <CardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Detail modal */}
      {selectedVariant && (
        <AdDetailModal
          variant={selectedVariant}
          platform={PLATFORM_CONFIG[platform]?.label || platform}
          onClose={handleClose}
        />
      )}

      {currentNode && (
        <div
          className="rounded-md px-4 py-2 text-sm font-medium animate-pulse border"
          style={{
            background: 'rgba(34,211,238,0.08)',
            borderColor: 'rgba(34,211,238,0.25)',
            color: 'var(--accent-cyan)',
          }}
        >
          Running: <span className="font-semibold">{currentNode}</span>
        </div>
      )}

      {[...history].reverse().map((gen) => {
        const nAbove = gen.above_threshold_ids?.length || 0;
        const nBelow = gen.below_threshold_ids?.length || 0;
        const total = gen.variants.length;
        const isCollapsed = collapsed[gen.generation];

        return (
          <div
            key={gen.generation}
            className="rounded-lg shadow-md p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          >
            <div
              className="flex items-center justify-between mb-3 cursor-pointer rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-white/5"
              onClick={() => setCollapsed((prev) => ({ ...prev, [gen.generation]: !prev[gen.generation] }))}
            >
              <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span>{PLATFORM_CONFIG[platform]?.icon || '📘'}</span>
                Generation {gen.generation}
                <svg
                  className="w-4 h-4 transition-transform duration-200"
                  style={{ color: 'var(--text-muted)', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </h3>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Avg: <span className="font-semibold" style={{ color: 'var(--accent-cyan)' }}>{gen.avg_fitness}</span>
                <span className="mx-1" style={{ color: 'var(--border-medium)' }}>|</span>
                Threshold: <span className="font-semibold" style={{ color: 'var(--accent-purple)' }}>{gen.threshold}</span>
              </span>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div className="rounded-md p-2 text-center" style={{ background: 'rgba(34,211,238,0.08)' }}>
                <div className="text-lg font-bold" style={{ color: 'var(--accent-cyan)' }}>{total}</div>
                <div className="text-[10px]" style={{ color: 'rgba(34,211,238,0.6)' }}>Total Ads</div>
              </div>
              <div className="rounded-md p-2 text-center" style={{ background: 'rgba(52,211,153,0.08)' }}>
                <div className="text-lg font-bold" style={{ color: 'var(--accent-green)' }}>{nAbove}</div>
                <div className="text-[10px]" style={{ color: 'rgba(52,211,153,0.6)' }}>Above Threshold</div>
              </div>
              <div className="rounded-md p-2 text-center" style={{ background: 'rgba(251,191,36,0.08)' }}>
                <div className="text-lg font-bold" style={{ color: 'var(--accent-yellow)' }}>{nBelow}</div>
                <div className="text-[10px]" style={{ color: 'rgba(251,191,36,0.6)' }}>Below Threshold</div>
              </div>
              <div className="rounded-md p-2 text-center" style={{ background: 'rgba(167,139,250,0.08)' }}>
                <div className="text-lg font-bold" style={{ color: 'var(--accent-purple)' }}>{gen.threshold}</div>
                <div className="text-[10px]" style={{ color: 'rgba(167,139,250,0.6)' }}>Threshold</div>
              </div>
            </div>

            {gen.hypothesis && (
              <div
                className="rounded-md p-3 mb-3 text-sm border"
                style={{
                  background: 'rgba(251,191,36,0.06)',
                  borderColor: 'rgba(251,191,36,0.2)',
                  color: 'var(--accent-yellow)',
                }}
              >
                <span className="font-medium">Hypothesis:</span>{' '}
                <span style={{ color: 'rgba(251,191,36,0.85)' }}>{gen.hypothesis}</span>
              </div>
            )}

            {gen.strategies_discovered?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {gen.strategies_discovered.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(167,139,250,0.12)', color: 'var(--accent-purple)' }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {!isCollapsed && (() => {
              const cardStyle = PLATFORM_CONFIG[platform]?.cardStyle || 'meta';
              const dims = PLATFORM_DIMENSIONS[cardStyle] || PLATFORM_DIMENSIONS.meta;
              const sorted = gen.variants.slice().sort((a, b) => b.fitness_score - a.fitness_score);

              return (
                <div className="collapse-content">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: 'var(--border-medium)', color: 'var(--text-muted)' }}>
                      {dims.label}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {PLATFORM_CONFIG[platform]?.label || platform} ad format — click any card for details
                    </span>
                  </div>
                  <div className={`grid gap-3 ${dims.cols}`}>
                    {sorted.map((v) => (
                      <VariantCard key={v.id} v={v} threshold={gen.threshold} platform={platform} onSelect={handleSelect} />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}
