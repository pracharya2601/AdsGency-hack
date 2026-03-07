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

      {[...history].reverse().map((gen, i) => (
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

          <div className="space-y-2">
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
                  <span className="font-semibold text-gray-800">{v.headline}</span>
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
                <p className="text-gray-600 mb-1">{v.body}</p>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>CTA: <span className="font-medium">{v.cta}</span></span>
                  <span>Tone: {v.emotional_tone}</span>
                  <span>Hook: {v.hook_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
