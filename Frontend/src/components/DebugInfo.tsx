import React from 'react';

interface DebugInfoProps {
  data: any;
  label: string;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ data, label }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs max-w-xs">
      <strong>{label}:</strong>
      <pre className="mt-1 overflow-auto max-h-32">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};