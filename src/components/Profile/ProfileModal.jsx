import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

function ProfileModal({ mode, profile, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && profile) {
      setFormData({
        name: profile.name || '',
        description: profile.description || '',
        isDefault: profile.isDefault || false,
      });
    }
  }, [mode, profile]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Profile name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Profile name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Profile name must not exceed 50 characters';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must not exceed 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">
            {mode === 'create' ? 'Create New Profile' : 'Edit Profile'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-gray-300 mb-2">
              Profile Name <span className="text-red-400">*</span>
            </label>
            <input
              id="profile-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 bg-[#0c0c0c] border rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                errors.name 
                  ? 'border-red-500 focus:ring-red-500/20' 
                  : 'border-[#2a2a2a] focus:ring-blue-500/20'
              }`}
              placeholder="Enter profile name"
              maxLength={50}
              disabled={saving}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.name.length}/50 characters
            </p>
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="profile-description" className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="profile-description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`w-full px-3 py-2 bg-[#0c0c0c] border rounded-lg text-white focus:outline-none focus:ring-2 transition-colors resize-none ${
                errors.description 
                  ? 'border-red-500 focus:ring-red-500/20' 
                  : 'border-[#2a2a2a] focus:ring-blue-500/20'
              }`}
              placeholder="Add a description for this profile"
              rows={3}
              maxLength={200}
              disabled={saving}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* Default Profile Checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="profile-default"
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => handleChange('isDefault', e.target.checked)}
              className="w-4 h-4 bg-[#0c0c0c] border-[#2a2a2a] rounded focus:ring-2 focus:ring-blue-500/20"
              disabled={saving}
            />
            <label htmlFor="profile-default" className="text-sm text-gray-300">
              Set as default profile
            </label>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileModal;
