import React from 'react';
import PropTypes from 'prop-types';

function SkeletonLoader({ count = 6 }) {
  const renderSkeleton = () => (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4 flex flex-col animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-[#3a3a3a] rounded-full mr-2"></div>
          <div>
            <div className="h-4 w-24 bg-[#3a3a3a] rounded"></div>
            <div className="h-3 w-16 bg-[#3a3a3a] rounded mt-1"></div>
          </div>
        </div>
        <div className="w-5 h-5 bg-[#3a3a3a] rounded-full"></div>
      </div>
      
      <div className="h-10 bg-[#3a3a3a] rounded mb-3"></div>
      
      <div className="flex gap-1 mb-3">
        <div className="h-5 w-14 bg-[#3a3a3a] rounded"></div>
        <div className="h-5 w-10 bg-[#3a3a3a] rounded"></div>
        <div className="h-5 w-12 bg-[#3a3a3a] rounded"></div>
      </div>
      
      <div className="mt-auto flex justify-between items-center">
        <div className="flex space-x-2">
          <div className="h-4 w-12 bg-[#3a3a3a] rounded"></div>
          <div className="h-4 w-16 bg-[#3a3a3a] rounded"></div>
        </div>
        
        <div className="h-6 w-20 bg-[#3a3a3a] rounded"></div>
      </div>
    </div>
  );
  
  return (
    <>
      {Array(count).fill(0).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
}

SkeletonLoader.propTypes = {
  count: PropTypes.number
};

export default SkeletonLoader;
