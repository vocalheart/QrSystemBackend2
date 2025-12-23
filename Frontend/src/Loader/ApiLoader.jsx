import React from 'react';

const Loader = () => {
  return (
    <div className="fixed inset-0 bg-black/10 bg-opacity-50 flex justify-center items-center">
      <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
    </div>
  );
};

export default Loader;