'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import History from '@tiptap/extension-history';
import '../../styles/narrativeLayer.css';

interface NarrativeLayerProps {
  prompt: string;
  onSentenceSelect?: (sentence: string, index: number) => void;
}

const NarrativeLayer: React.FC<NarrativeLayerProps> = ({ prompt, onSentenceSelect }) => {
  const [wordCount, setWordCount] = useState(0);
  const [sentenceCount, setSentenceCount] = useState(0);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph.configure({
        HTMLAttributes: {
          class: 'tiptap-paragraph',
        },
      }),
      Text,
      Bold,
      Italic,
      History,
    ],
    content: prompt || '<p>Start writing here...</p>',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.split(/\s+/).filter(Boolean).length;
      const sentences = text.split(/[.!?]+/).filter(line => line.trim().length > 0).length;
      setWordCount(words);
      setSentenceCount(sentences);
    },
    editorProps: {
      attributes: {
        class: 'narrative-editor-content',
      },
      handleKeyDown: (view, event) => {
        // Debug log to see what keys are being pressed
        console.log('Key pressed:', event.key, event.code);
        
        // Let all keys work normally except for specific overrides
        if (event.key === ' ') {
          console.log('Space key - should add space, not new line');
          return false; // Let default behavior handle space
        }
        
        return false; // Let default behavior handle all other keys
      },
    },
  });
  
  // Initialize with prompt
  useEffect(() => {
    if (prompt && editor && editor.getText().trim() === '') {
      editor.commands.setContent(prompt);
    }
  }, [prompt, editor]);

  const handleClick = () => {
    if (onSentenceSelect && editor) {
      const text = editor.getText();
      const sentences = text.split(/[.!?]+/).filter(line => line.trim().length > 0);
      
      // For now, select the first sentence as a simple implementation
      if (sentences.length > 0) {
        onSentenceSelect(sentences[0].trim(), 0);
      }
    }
  };

  return (
    <div className="narrative-layer">
      <div className="narrative-editor">
        <EditorContent 
          editor={editor} 
          onClick={handleClick}
        />
      </div>
      
      <div className="narrative-footer">
        <div className="narrative-stats">
          <span>{sentenceCount} sentences</span>
          <span>{wordCount} words</span>
        </div>
      </div>
    </div>
  );
};

export default NarrativeLayer;
