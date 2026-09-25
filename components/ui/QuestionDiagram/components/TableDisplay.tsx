import React from 'react';

export function TableDisplay({ data, subtype, width = '100%' }: any) {
  if (!data || !data.columns || !data.rows) {
    return (
      <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width: '100%', minHeight: 100 }}>
        <div className="text-xs text-[#6C6C6A] italic">
          [Invalid Table Data]
        </div>
      </div>
    );
  }

  const normalizedRows = data.rows.map((row: any[]) => {
    if (row.length === data.columns.length) return row;
    const padded = [...row];
    while (padded.length < data.columns.length) padded.push('—');
    return padded.slice(0, data.columns.length);
  });

  return (
    <div className="overflow-x-auto my-4 w-full" style={{ width }}>
      {subtype && <div className="text-sm font-semibold mb-2 text-gray-300">{subtype.replace(/_/g, ' ').toUpperCase()}</div>}
      <table className="w-full text-sm text-left text-gray-400 border-collapse">
        <thead className="text-xs text-gray-300 uppercase bg-[#2C2C2B]">
          <tr>
            {data.columns.map((col: string, i: number) => (
              <th key={i} scope="col" className="px-4 py-3 border border-[#3A3A38]">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {normalizedRows.map((row: any[], i: number) => (
            <tr key={i} className="bg-[#1C1C1B] border-b border-[#2C2C2B] hover:bg-[#252524]">
              {row.map((cell: any, j: number) => (
                <td key={j} className="px-4 py-2 border border-[#3A3A38]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
