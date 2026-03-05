import React from 'react';

const Loader = ({ size = 'md', text = 'Loading...' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className={`${sizes[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`}
      />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
};

export const FullPageLoader = () => (
  <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
    <div className="text-center">
      <div className="h-16 w-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-500 font-medium">Loading, please wait...</p>
    </div>
  </div>
);

export default Loader;
