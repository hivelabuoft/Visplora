'use client';

import React, { useState, useEffect, useRef } from 'react';
import '../../styles/narrativeLayer.css';

interface NarrativeLayerProps {
  prompt: string;
  onSentenceSelect?: (sentence: string, index: number) => void;
}



const NarrativeLayer: React.FC<NarrativeLayerProps> = ({ prompt, onSentenceSelect }) => {
  const [wordCount, setWordCount] = useState(0);
  const [sentenceCount, setSentenceCount] = useState(0);
  const [lines, setLines] = useState<string[]>(Array(20).fill(''));
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const linesContainerRef = useRef<HTMLDivElement>(null);
  
  // Function to add more lines when needed
  const addMoreLines = () => {
    setLines(prev => [...prev, ...Array(10).fill('')]);
  };

  // Function to handle text input on a specific line
  const handleLineChange = (index: number, value: string) => {
    setLines(prev => {
      const newLines = [...prev];
      newLines[index] = value;
      return newLines;
    });

    // Check if we need to add more lines (when within 2 lines of the end)
    if (index >= lines.length - 2) {
      addMoreLines();
    }

    // Update word count
    const allText = lines.join(' ');
    setWordCount(allText.split(/\s+/).filter(Boolean).length);
    
    // Update line count (count non-empty lines)
    setSentenceCount(lines.filter(line => line.trim().length > 0).length);
  };

  // Initialize with prompt on the first line
  useEffect(() => {
    if (prompt && lines[0] === '') {
      handleLineChange(0, prompt);
    }
  }, [prompt]);

  // Handle keyboard navigation between lines
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move to next line
      const nextIndex = index + 1;
      setCurrentLineIndex(nextIndex);
      
      // Focus next input
      setTimeout(() => {
        const nextInput = linesContainerRef.current?.querySelector(`input[data-line="${nextIndex}"]`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      }, 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        const prevIndex = index - 1;
        setCurrentLineIndex(prevIndex);
        const prevInput = linesContainerRef.current?.querySelector(`input[data-line="${prevIndex}"]`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = index + 1;
      setCurrentLineIndex(nextIndex);
      const nextInput = linesContainerRef.current?.querySelector(`input[data-line="${nextIndex}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  // Remove the old TipTap editor logic
  const editor = null;

  return (
    <div className="narrative-layer">
      <div className="narrative-editor" ref={editorRef}>
        <div className="lines-container" ref={linesContainerRef}>
          {lines.map((line, index) => (
            <div key={index} className="line-wrapper">
              <input
                type="text"
                value={line}
                data-line={index}
                onChange={(e) => handleLineChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={() => setCurrentLineIndex(index)}
                onClick={() => onSentenceSelect && onSentenceSelect(line, index)}
                placeholder={index === 0 ? 'Start writing here...' : ''}
                className="line-input"
              />
              <div className="line-border"></div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="narrative-footer">
        <div className="narrative-stats">
          <span>{sentenceCount} lines</span>
          <span>{wordCount} words</span>
        </div>
        <div className="narrative-hint">
          Press <kbd>Enter</kbd> to move to next line
        </div>
      </div>
    </div>
  );
};

export default NarrativeLayer;
