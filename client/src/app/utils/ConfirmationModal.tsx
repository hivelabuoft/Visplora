import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning'
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          headerBg: 'bg-red-50',
          headerText: 'text-red-700',
          confirmBg: 'bg-red-600 hover:bg-red-700',
          confirmText: 'text-white',
          icon: '⚠️'
        };
      case 'warning':
        return {
          headerBg: 'bg-yellow-50',
          headerText: 'text-yellow-700',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
          confirmText: 'text-white',
          icon: '⚠️'
        };
      case 'info':
        return {
          headerBg: 'bg-blue-50',
          headerText: 'text-blue-700',
          confirmBg: 'bg-blue-600 hover:bg-blue-700',
          confirmText: 'text-white',
          icon: 'ℹ️'
        };
      default:
        return {
          headerBg: 'bg-gray-50',
          headerText: 'text-gray-700',
          confirmBg: 'bg-gray-600 hover:bg-gray-700',
          confirmText: 'text-white',
          icon: '❓'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className={`px-6 py-4 ${styles.headerBg} rounded-t-lg`}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{styles.icon}</span>
            <h3 className={`text-lg font-semibold ${styles.headerText}`}>
              {title}
            </h3>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium ${styles.confirmText} ${styles.confirmBg} border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Utility function to show a confirmation modal programmatically
export const showConfirmationModal = (options: Omit<ConfirmationModalProps, 'isOpen'>): Promise<boolean> => {
  return new Promise((resolve) => {
    // Create a container div
    const modalContainer = document.createElement('div');
    document.body.appendChild(modalContainer);

    // Import React and ReactDOM dynamically (if not already available)
    import('react').then((React) => {
      import('react-dom/client').then(({ createRoot }) => {
        const root = createRoot(modalContainer);

        const handleConfirm = () => {
          cleanup();
          resolve(true);
        };

        const handleCancel = () => {
          cleanup();
          resolve(false);
        };

        const cleanup = () => {
          root.unmount();
          document.body.removeChild(modalContainer);
        };

        // Render the modal
        root.render(
          React.createElement(ConfirmationModal, {
            ...options,
            isOpen: true,
            onConfirm: handleConfirm,
            onCancel: handleCancel,
          })
        );
      });
    });
  });
};

export default ConfirmationModal;
