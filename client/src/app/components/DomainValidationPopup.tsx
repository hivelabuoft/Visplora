import React from 'react';
import { DomainValidationResult } from '../LLMs/domainValidation';
import '../../styles/domainValidationPopup.css';

interface DomainValidationPopupProps {
  validation: DomainValidationResult | null;
  isVisible: boolean;
  onClose: () => void;
  onGenerateVisualization?: (validation: DomainValidationResult) => void;
  position?: { x: number; y: number };
}

const DomainValidationPopup: React.FC<DomainValidationPopupProps> = ({
  validation,
  isVisible,
  onClose,
  onGenerateVisualization,
  position
}) => {
  if (!isVisible || !validation) {
    return null;
  }

  const getStatusIcon = () => {
    if (!validation.is_data_driven_question) {
      return '💬'; // Not a data question
    }
    if (!validation.inquiry_supported) {
      return '⚠️'; // Data question but not supported
    }
    return '✅'; // Valid and supported
  };

  const getStatusMessage = () => {
    if (!validation.is_data_driven_question) {
      return 'Not a Data Question';
    }
    if (!validation.inquiry_supported) {
      return 'Data Not Available';
    }
    return 'View Can Be Generated';
  };

  const getStatusClass = () => {
    if (!validation.is_data_driven_question) {
      return 'not-data-question';
    }
    if (!validation.inquiry_supported) {
      return 'data-unavailable';
    }
    return 'data-available';
  };

  return (
    <>
      {/* Backdrop */}
      <div className="domain-validation-backdrop" onClick={onClose} />
      
      {/* Popup */}
      <div 
        className={`domain-validation-popup ${getStatusClass()}`}
        style={position ? {
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -100%)'
        } : undefined}
      >
        {/* Header */}
        <div className="popup-header">
          <div className="popup-status">
            <span className="status-icon">{getStatusIcon()}</span>
            <span className="status-message">{getStatusMessage()}</span>
          </div>
          <button className="popup-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Content */}
        <div className="popup-content">
          <p className="explanation">{validation.explanation}</p>

          {/* Show matched datasets if available */}
          {validation.matched_dataset.length > 0 && (
            <div className="matched-data">
              <h4>📊 Available Datasets:</h4>
              <ul className="dataset-list">
                {validation.matched_dataset.map((dataset, index) => (
                  <li key={index} className="dataset-item">
                    <span className="dataset-name">{dataset}</span>
                    {validation.matched_columns[dataset] && (
                      <div className="column-list">
                        <span className="column-label">Columns:</span>
                        <span className="columns">
                          {validation.matched_columns[dataset].join(', ')}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="popup-actions">
            {validation.is_data_driven_question && validation.inquiry_supported ? (
              <>
                <button className="action-button secondary" onClick={onClose}>
                  Cancel
                </button>
                <button 
                  className="action-button primary" 
                  onClick={() => {
                    onGenerateVisualization?.(validation);
                    onClose();
                  }}
                >
                  Generate Visualization
                </button>
              </>
            ) : (
              <button className="action-button secondary" onClick={onClose}>
                Got It
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DomainValidationPopup;
