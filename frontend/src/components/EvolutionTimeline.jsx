import { useState } from 'react';

function diffText(prev, curr) {
  if (!prev) return 'new';
  if (prev === curr) return 'inherited';
  return 'mutated';
}

function TraitBadge({ label, value, status }) {
  const styles = {
    inherited: {
      backgroundColor: 'rgba(52,211,153,0.12)',
      color: '#34d399',
      borderColor: 'rgba(52,211,153,0.25)',
    },
    mutated: {
      backgroundColor: 'rgba(251,191,36,0.12)',
      color: '#fbbf24',
      borderColor: 'rgba(251,191,36,0.25)',
    },
    new: {
      backgroundColor: 'rgba(34,211,238,0.12)',
      color: '#22d3ee',
      borderColor: 'rgba(34,211,238,0.25)',
    },
  };
  const icons = { inherited: '→', mutated: '△', new: '★' };

  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border font-medium"
      style={styles[status]}
    >
      <span>{icons[status]}</span>
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <span>{value}</span>
    </span>
  );
}

function FitnessChange({ prev, curr }) {
  if (prev == null) return null;
  const delta = curr - prev;
  const color = delta > 0 ? '#34d399' : delta < 0 ? '#f87171' : 'var(--text-muted)';
  return (
    <span className="text-xs font-mono" style={{ color }}>
      {delta > 0 ? '+' : ''}{delta.toFixed(2)}
    </span>
  );
}

function DnaStrand({ traits }) {
  return (
    <div className="flex flex-wrap gap-1">
      {traits.map((t, i) => (
        <TraitBadge key={i} label={t.label} value={t.value} status={t.status} />
      ))}
    </div>
  );
}

function GenSnapshot({ variant, prevVariant, genNumber, threshold, isFirst, isLast }) {
  const traits = [];
  if (variant) {
    traits.push({
      label: 'Tone',
      value: variant.emotional_tone,
      status: diffText(prevVariant?.emotional_tone, variant.emotional_tone),
    });
    traits.push({
      label: 'Hook',
      value: variant.hook_type,
      status: diffText(prevVariant?.hook_type, variant.hook_type),
    });
    traits.push({
      label: 'Strategy',
      value: variant.creative_strategy || '—',
      status: diffText(prevVariant?.creative_strategy, variant.creative_strategy),
    });
    traits.push({
      label: 'CTA',
      value: variant.cta,
      status: diffText(prevVariant?.cta, variant.cta),
    });
  }

  const isAbove = variant?.above_threshold;
  const headlineChanged = prevVariant && variant && prevVariant.headline !== variant.headline;
  const bodyChanged = prevVariant && variant && prevVariant.body !== variant.body;

  const cardStyle = isAbove
    ? { backgroundColor: 'rgba(52,211,153,0.06)', borderColor: 'rgba(52,211,153,0.25)' }
    : { backgroundColor: 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.25)' };

  return (
    <div
      className="border rounded-lg p-3 text-sm min-w-[280px] max-w-[320px] shrink-0"
      style={cardStyle}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Gen {genNumber}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={
              isAbove
                ? { backgroundColor: 'rgba(52,211,153,0.18)', color: '#34d399' }
                : { backgroundColor: 'rgba(251,191,36,0.18)', color: '#fbbf24' }
            }
          >
            {isAbove ? 'PASS' : 'IMPROVE'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
            {variant?.fitness_score?.toFixed(2)}
          </span>
          <FitnessChange prev={prevVariant?.fitness_score} curr={variant?.fitness_score} />
        </div>
      </div>

      {/* Headline */}
      <div
        className="font-semibold mb-1"
        style={{
          color: 'var(--text-primary)',
          ...(headlineChanged && { backgroundColor: 'rgba(251,191,36,0.1)', padding: '0 4px', margin: '0 -4px', borderRadius: '4px' }),
        }}
      >
        {variant?.headline}
        {headlineChanged && <span className="text-[9px] text-orange-400 ml-1">△</span>}
      </div>

      {/* Body */}
      <p
        className="text-xs mb-2"
        style={{
          color: 'var(--text-secondary)',
          ...(bodyChanged && { backgroundColor: 'rgba(251,191,36,0.1)', padding: '0 4px', margin: '0 -4px', borderRadius: '4px' }),
        }}
      >
        {variant?.body}
        {bodyChanged && <span className="text-[9px] text-orange-400 ml-1">△</span>}
      </p>

      {/* DNA traits */}
      <DnaStrand traits={traits} />

      {/* Threshold bar */}
      <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] w-14 text-right" style={{ color: 'var(--text-muted)' }}>Fitness</span>
          <div className="flex-1 rounded-full h-2 relative" style={{ backgroundColor: 'var(--border-medium)' }}>
            <div
              className="h-2 rounded-full"
              style={{
                width: `${Math.min((variant?.fitness_score || 0) * 10, 100)}%`,
                backgroundColor: isAbove ? '#34d399' : '#fb923c',
              }}
            />
            {/* Threshold marker */}
            <div
              className="absolute top-0 h-2 w-0.5 bg-purple-600"
              style={{ left: `${Math.min(threshold * 10, 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono w-8" style={{ color: 'var(--text-muted)' }}>
            {variant?.fitness_score?.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductEvolution({ productName, generations }) {
  // generations is an array of { genNumber, variant, threshold }
  const isImproved = generations.length >= 2 &&
    generations[generations.length - 1].variant.fitness_score > generations[0].variant.fitness_score;
  const totalDelta = generations.length >= 2
    ? generations[generations.length - 1].variant.fitness_score - generations[0].variant.fitness_score
    : 0;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: 'rgba(34,211,238,0.12)', color: '#22d3ee' }}
          >
            {productName[0]}
          </span>
          {productName}
        </h4>
        {generations.length >= 2 && (
          <div
            className="text-xs font-semibold px-2 py-1 rounded"
            style={
              isImproved
                ? { backgroundColor: 'rgba(52,211,153,0.12)', color: '#34d399' }
                : { backgroundColor: 'rgba(248,113,113,0.12)', color: '#f87171' }
            }
          >
            {isImproved ? '↑' : '↓'} {totalDelta > 0 ? '+' : ''}{totalDelta.toFixed(2)} over {generations.length} gens
          </div>
        )}
      </div>

      {/* Horizontal scroll of generation snapshots */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {generations.map((g, i) => (
          <div key={g.genNumber} className="flex items-center gap-0">
            <GenSnapshot
              variant={g.variant}
              prevVariant={i > 0 ? generations[i - 1].variant : null}
              genNumber={g.genNumber}
              threshold={g.threshold}
              isFirst={i === 0}
              isLast={i === generations.length - 1}
            />
            {i < generations.length - 1 && (
              <div className="flex flex-col items-center px-1 shrink-0">
                <div className="w-6 h-0.5" style={{ backgroundColor: 'rgba(167,139,250,0.4)' }} />
                <span className="text-[8px] mt-0.5" style={{ color: 'rgba(167,139,250,0.6)' }}>evolve</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lineage summary */}
      {generations.length >= 2 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <LineageSummary generations={generations} />
        </div>
      )}
    </div>
  );
}

function LineageSummary({ generations }) {
  // Track how each trait changed across generations
  const traitKeys = [
    { key: 'emotional_tone', label: 'Tone' },
    { key: 'hook_type', label: 'Hook' },
    { key: 'creative_strategy', label: 'Strategy' },
    { key: 'cta', label: 'CTA' },
  ];

  return (
    <div className="space-y-1.5">
      <div
        className="text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        Creative DNA Lineage
      </div>
      {traitKeys.map(({ key, label }) => {
        const values = generations.map((g) => g.variant[key] || '—');
        const changes = values.map((v, i) => ({
          value: v,
          status: i === 0 ? 'new' : v === values[i - 1] ? 'inherited' : 'mutated',
        }));
        const nMutations = changes.filter((c) => c.status === 'mutated').length;
        const nInherited = changes.filter((c) => c.status === 'inherited').length;

        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className="text-[10px] w-14 text-right shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
            <div className="flex items-center gap-0.5 overflow-x-auto">
              {changes.map((c, i) => (
                <div key={i} className="flex items-center gap-0.5">
                  <span
                    className="text-[9px] px-1 py-0.5 rounded whitespace-nowrap"
                    style={
                      c.status === 'inherited'
                        ? { backgroundColor: 'rgba(52,211,153,0.12)', color: '#34d399' }
                        : c.status === 'mutated'
                        ? { backgroundColor: 'rgba(251,191,36,0.12)', color: '#fbbf24' }
                        : { backgroundColor: 'rgba(34,211,238,0.12)', color: '#22d3ee' }
                    }
                  >
                    {c.value}
                  </span>
                  {i < changes.length - 1 && (
                    <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>→</span>
                  )}
                </div>
              ))}
            </div>
            <span className="text-[9px] shrink-0" style={{ color: 'var(--text-muted)' }}>
              {nInherited > 0 && `${nInherited}×kept`}
              {nInherited > 0 && nMutations > 0 && ' '}
              {nMutations > 0 && `${nMutations}×changed`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function EvolutionTimeline({ history }) {
  const [filter, setFilter] = useState('all'); // 'all', 'improved', 'struggling'

  if (history.length === 0) return null;

  // Build per-product evolution data
  const productMap = {};
  history.forEach((gen) => {
    gen.variants.forEach((v) => {
      const name = v.product_name || v.product_id || 'Unknown';
      if (!productMap[name]) productMap[name] = [];
      productMap[name].push({
        genNumber: gen.generation,
        variant: v,
        threshold: gen.threshold,
      });
    });
  });

  const products = Object.entries(productMap).map(([name, generations]) => {
    const first = generations[0].variant.fitness_score;
    const last = generations[generations.length - 1].variant.fitness_score;
    return { name, generations, delta: last - first, improved: last > first };
  });

  // Sort: most improved first
  products.sort((a, b) => b.delta - a.delta);

  const filtered = filter === 'all' ? products :
    filter === 'improved' ? products.filter((p) => p.improved) :
    products.filter((p) => !p.improved);

  const nImproved = products.filter((p) => p.improved).length;

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Evolution Timeline</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>How each product's ad evolved generation over generation</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium" style={{ color: '#34d399' }}>{nImproved} improved</span>
            <span className="text-xs" style={{ color: 'var(--border-medium)' }}>|</span>
            <span className="text-xs font-medium" style={{ color: '#fb923c' }}>{products.length - nImproved} struggling</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-2">
          {[
            { key: 'all', label: `All (${products.length})` },
            { key: 'improved', label: `Improved (${nImproved})` },
            { key: 'struggling', label: `Struggling (${products.length - nImproved})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="text-xs px-3 py-1 rounded-full transition"
              style={
                filter === tab.key
                  ? { backgroundColor: 'var(--accent-cyan)', color: '#0b0e17' }
                  : { backgroundColor: 'var(--border-medium)', color: 'var(--text-secondary)' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-3 text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#34d399' }} /> Inherited (kept from prev gen)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#fb923c' }} /> Mutated (changed)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22d3ee' }} /> New (first gen)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded" style={{ backgroundColor: 'rgba(251,191,36,0.3)' }} /> Text changed
          </span>
        </div>
      </div>

      {filtered.map((p) => (
        <ProductEvolution key={p.name} productName={p.name} generations={p.generations} />
      ))}
    </div>
  );
}
