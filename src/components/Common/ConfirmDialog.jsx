import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function ConfirmDialog({ 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  confirmVariant = 'primary', // 'primary' or 'danger'
  onConfirm, 
  onCancel 
}) {
  const confirmButtonClass = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            {confirmVariant === 'danger' && (
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
            )}
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-[#2a2a2a]">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
