import Spinner from '../Common/Spinner';
import ErrorBoundary from '../Common/ErrorBoundary';

function ModelDownloaderContent({ models = [] }) {
  // Guard clause to handle undefined values properly
  if (!Array.isArray(models)) {
    return null;
  }
  
  const downloadingModels = models.filter(
    (model) => model && model.downloadProgress !== undefined && model.downloadProgress < 100
  );

  if (downloadingModels.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 w-96 bg-[#1a1a1a] border-l border-t border-[#2a2a2a] shadow-lg">
      <div className="p-4 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
            <h2 className="text-sm font-medium text-white">Download Queue</h2>
          </div>
          <span className="text-xs text-gray-400 bg-[#252525] px-2 py-1 rounded">
            {downloadingModels.length} active
          </span>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {downloadingModels.map((model) => (
          <div 
            key={model.id} 
            className="p-4 border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors"
          >
            <div className="flex items-start space-x-3">
              <Spinner className="h-4 w-4 text-blue-400 mt-1" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-white truncate">
                    {model.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400 tabular-nums">
                      {model.downloadProgress.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-[#0c0c0c] rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1 transition-all duration-300"
                    style={{ width: `${model.downloadProgress}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Estimated time: Calculating...
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelDownloader(props) {
  return (
    <ErrorBoundary 
      fallback={(error) => (
        <div className="fixed bottom-0 right-0 w-96 bg-[#1a1a1a] border-l border-t border-[#2a2a2a] shadow-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-amber-400 text-sm font-medium">Download queue unavailable</div>
          </div>
          <div className="text-xs text-gray-400">Error loading download queue. You can still use the application normally.</div>
          {error && (
            <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-400 overflow-x-auto max-h-24">
              {error.toString()}
            </div>
          )}
        </div>
      )}
    >
      <ModelDownloaderContent {...props} />
    </ErrorBoundary>
  );
}

export default ModelDownloader;