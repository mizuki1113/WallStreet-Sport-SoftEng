import React from 'react';

export const Loader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
    </div>
  );
};
