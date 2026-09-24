import { X } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '../../utils/cn';

export const Modal = ({ isOpen, onClose, title, children, className }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/50 p-4 mb-0">
      <div className={cn("relative w-full max-w-2xl mx-auto my-6 md:my-10", className)}>
        <div className="relative bg-white rounded-lg shadow-xl flex flex-col max-h-[85vh]">
          <div className="flex items-start justify-between p-4 border-b rounded-t shrink-0">
            <h3 className="text-xl font-semibold text-gray-900">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            >
              <X className="w-5 h-5" />
              <span className="sr-only">Close modal</span>
            </button>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
