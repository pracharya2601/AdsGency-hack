function ExperimentCard({ log, index, total }) {
  const exp = log.experiment;
  const hasExperiment = exp && (exp.tried || exp.observed || exp.learned || exp.next_action);

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}
          >
            {log.generation}
          </span>
          <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>Generation {log.generation}</h4>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span
            className="px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: 'rgba(52,211,153,0.12)', color: '#34d399' }}
          >
            {log.above_threshold_ids.length} above
          </span>
          <span
            className="px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: 'rgba(251,191,36,0.12)', color: '#fb923c' }}
          >
            {log.below_threshold_ids.length} below
          </span>
          <span style={{ color: 'var(--text-muted)' }}>threshold: {log.threshold}</span>
        </div>
      </div>

      {/* Structured Experiment */}
      {hasExperiment && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {[
            { label: 'Tried', value: exp.tried, color: 'blue' },
            { label: 'Observed', value: exp.observed, color: 'amber' },
            { label: 'Learned', value: exp.learned, color: 'green' },
            { label: 'Next Action', value: exp.next_action, color: 'purple' },
          ].map(({ label, value, color }) =>
            value ? (
              <div
                key={label}
                className="rounded-md border p-2.5"
                style={{
                  backgroundColor:
                    color === 'blue' ? 'rgba(34,211,238,0.08)' :
                    color === 'amber' ? 'rgba(251,191,36,0.08)' :
                    color === 'green' ? 'rgba(52,211,153,0.08)' :
                    'rgba(167,139,250,0.08)',
                  borderColor:
                    color === 'blue' ? 'rgba(34,211,238,0.2)' :
                    color === 'amber' ? 'rgba(251,191,36,0.2)' :
                    color === 'green' ? 'rgba(52,211,153,0.2)' :
                    'rgba(167,139,250,0.2)',
                }}
              >
                <div
                  className="text-[10px] font-semibold uppercase tracking-wide mb-1"
                  style={{
                    color:
                      color === 'blue' ? '#22d3ee' :
                      color === 'amber' ? '#fbbf24' :
                      color === 'green' ? '#34d399' :
                      '#a78bfa',
                  }}
                >
                  {label}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{value}</p>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Mutation Instructions */}
      {log.mutation_instructions_used && (
        <details className="group">
          <summary
            className="cursor-pointer text-xs font-medium flex items-center gap-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="group-open:rotate-90 transition-transform text-[10px]">&#9654;</span>
            Mutation Instructions Fed to LLM
          </summary>
          <pre
            className="mt-2 p-3 rounded-md text-[11px] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            {log.mutation_instructions_used}
          </pre>
        </details>
      )}

      {!hasExperiment && !log.mutation_instructions_used && (
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
          Generation 1 — initial creative exploration (no prior experiment)
        </p>
      )}
    </div>
  );
}

export default function ExperimentLog({ history }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Experiment Log</h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Structured A/B learning: what was tried, observed, learned, and planned next
        </p>
      </div>

      {history.map((log, i) => (
        <ExperimentCard key={log.generation} log={log} index={i} total={history.length} />
      ))}
    </div>
  );
}
