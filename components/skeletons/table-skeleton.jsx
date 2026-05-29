export default function TableSkeleton({ rows = 5, cols = 4 }) {
  const widths = ["w-1/4", "w-1/2", "w-1/3", "w-2/3", "w-1/5"];

  return (
    <div className="animate-pulse bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          {/* Header Row */}
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              {Array.from({ length: cols }).map((_, cIdx) => (
                <th key={cIdx} className="px-6 py-4">
                  <div className="h-4 bg-muted rounded w-20" />
                </th>
              ))}
            </tr>
          </thead>
          {/* Data Rows */}
          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx} className="hover:bg-muted/10 transition-colors">
                {Array.from({ length: cols }).map((_, cIdx) => {
                  const widthClass = widths[(rIdx + cIdx) % widths.length];
                  return (
                    <td key={cIdx} className="px-6 py-4">
                      <div className={`h-3 bg-muted rounded ${widthClass}`} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
