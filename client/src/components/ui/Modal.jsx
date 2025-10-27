import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md', height = 'auto', maxHeight = 'auto', ...props }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full ${sizes[size]} ${height}`}>
          {/* Header - fixed height */}
          <div className="flex items-center justify-between bg-white px-4 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Content - scrollable area */}
          <div className={`bg-white px-4 pb-4 overflow-y-auto ${maxHeight}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;