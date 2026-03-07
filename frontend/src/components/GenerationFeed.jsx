function SignalBar({ label, value, color }) {
  const width = Math.min(Math.max(value * 10, 0), 100);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-gray-500 w-16 text-right shrink-0">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-[10px] font-mono text-gray-500 w-6">{value?.toFixed?.(1) ?? '-'}</span>
    </div>
  );
}

export default function GenerationFeed({ history, currentNode }) {
  if (history.length === 0 && !currentNode) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-400">
        Waiting for evolution to start...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {currentNode && (
        <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-2 text-sm text-blue-700 animate-pulse">
          Running: <span className="font-semibold">{currentNode}</span>
        </div>
      )}

      {[...history].reverse().map((gen) => (
        <div key={gen.generation} className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">Generation {gen.generation}</h3>
            <span className="text-sm text-gray-500">
              Avg Fitness: <span className="font-semibold text-blue-600">{gen.avg_fitness}</span>
            </span>
          </div>

          {gen.hypothesis && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3 text-sm text-yellow-800">
              <span className="font-medium">Hypothesis:</span> {gen.hypothesis}
            </div>
          )}

          {gen.strategies_discovered?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {gen.strategies_discovered.map((s) => (
                <span key={s} className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {gen.variants.map((v) => (
              <div
                key={v.id}
                className={`border rounded-md p-3 text-sm ${
                  v.survived
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{v.headline}</span>
                    {v.creative_strategy && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                        {v.creative_strategy}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">
                      {v.fitness_score.toFixed(2)}
                    </span>
                    {v.survived && (
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-medium">
                        SURVIVOR
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 mb-2">{v.body}</p>

                <div className="flex gap-3 text-xs text-gray-500 mb-2">
                  <span>CTA: <span className="font-medium">{v.cta}</span></span>
                  <span>Tone: {v.emotional_tone}</span>
                  <span>Hook: {v.hook_type}</span>
                </div>

                {v.dimension_scores && Object.keys(v.dimension_scores).length > 0 && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 pt-2 border-t border-gray-200">
                    <SignalBar label="CTR" value={v.dimension_scores.ctr} color="bg-blue-500" />
                    <SignalBar label="Engage" value={v.dimension_scores.engagement} color="bg-green-500" />
                    <SignalBar label="Convert" value={v.dimension_scores.conversion} color="bg-orange-500" />
                    <SignalBar label="Relevance" value={v.dimension_scores.relevance} color="bg-purple-500" />
                    <SignalBar label="Platform" value={v.dimension_scores.platform_fit} color="bg-cyan-500" />
                    <SignalBar label="Scroll Stop" value={v.dimension_scores.scroll_stop} color="bg-red-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
