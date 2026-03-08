export default function StrategyReport({ report }) {
  if (!report) return null;

  // Basic markdown rendering: headers, bold, lists
  const renderMarkdown = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return (
          <h2 key={i} className="text-lg font-bold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
            {line.slice(2)}
          </h2>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={i} className="text-md font-bold mt-3 mb-1" style={{ color: 'var(--text-primary)' }}>
            {line.slice(3)}
          </h3>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h4 key={i} className="text-sm font-bold mt-2 mb-1" style={{ color: 'var(--text-secondary)' }}>
            {line.slice(4)}
          </h4>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={i} className="ml-4 text-sm list-disc" style={{ color: 'var(--text-secondary)' }}>
            {renderInline(line.slice(2))}
          </li>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <li key={i} className="ml-4 text-sm list-decimal" style={{ color: 'var(--text-secondary)' }}>
            {renderInline(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      return (
        <p key={i} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {renderInline(line)}
        </p>
      );
    });
  };

  const renderInline = (text) => {
    // Handle **bold**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div
      className="rounded-xl p-6"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Strategy Discovery Report</h3>
      <div
        className="rounded-md p-4 leading-relaxed"
        style={{
          backgroundColor: 'rgba(167,139,250,0.06)',
          border: '1px solid rgba(167,139,250,0.2)',
        }}
      >
        {renderMarkdown(report)}
      </div>
    </div>
  );
}
