export default function StrategyReport({ report }) {
  if (!report) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="font-bold text-gray-800 mb-3">Strategy Report</h3>
      <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {report}
      </div>
    </div>
  );
}
