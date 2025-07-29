'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { CompletedSentence } from '../extensions/CompletedSentence';
import '../../styles/narrativeLayer.css';

export default function TestHighlighting() {
  const [debug, setDebug] = useState<string[]>([]);

  const addDebug = (message: string) => {
    setDebug(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      CompletedSentence,
    ],
    content: '<p>This is a test sentence to highlight.</p>',
    onUpdate: ({ editor }) => {
      addDebug(`Text updated: "${editor.getText()}"`);
    },
  });

  const testMarkSentence = () => {
    if (!editor) {
      addDebug('❌ No editor available');
      return;
    }

    addDebug('🧪 Starting test mark sentence');
    
    try {
      const text = editor.getText();
      addDebug(`📝 Current text: "${text}"`);
      
      // Check available commands
      const commands = Object.keys(editor.commands);
      addDebug(`🔧 Available commands: ${commands.join(', ')}`);
      
      // Check if our command exists
      if (!editor.commands.markAsCompletedSentence) {
        addDebug('❌ markAsCompletedSentence command not found');
        return;
      }
      
      // Select all text
      const success1 = editor.commands.setTextSelection({ from: 0, to: text.length });
      addDebug(`📍 Selection result: ${success1}`);
      
      // Apply the mark
      const success2 = editor.commands.markAsCompletedSentence();
      addDebug(`✨ Mark application result: ${success2}`);
      
      // Check DOM
      setTimeout(() => {
        const elements = document.querySelectorAll('.completed-sentence');
        addDebug(`🔍 Found ${elements.length} completed sentence elements in DOM`);
        elements.forEach((el, i) => {
          addDebug(`  Element ${i}: "${el.textContent}" - ${el.tagName}`);
        });
      }, 100);
      
    } catch (error) {
      addDebug(`❌ Error: ${error}`);
    }
  };

  const clearMarks = () => {
    if (editor) {
      editor.commands.selectAll();
      editor.commands.unmarkCompletedSentence();
      addDebug('🧹 Cleared all marks');
    }
  };

  const clearDebug = () => {
    setDebug([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h1>Test Sentence Highlighting</h1>
      
      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <EditorContent editor={editor} />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testMarkSentence}
          style={{ padding: '8px 16px', marginRight: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Test Mark Sentence
        </button>
        <button 
          onClick={clearMarks}
          style={{ padding: '8px 16px', marginRight: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Clear Marks
        </button>
        <button 
          onClick={clearDebug}
          style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Clear Debug
        </button>
      </div>
      
      <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', maxHeight: '300px', overflow: 'auto' }}>
        <h3>Debug Log:</h3>
        {debug.length === 0 ? (
          <p style={{ color: '#666' }}>No debug messages yet...</p>
        ) : (
          debug.map((msg, i) => (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: '12px', marginBottom: '2px' }}>
              {msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
