'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { IoSaveSharp, IoArrowUndo } from "react-icons/io5";
import { FaSave } from "react-icons/fa";
import { ImRedo2 } from "react-icons/im";
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import History from '@tiptap/extension-history';
import Placeholder from '@tiptap/extension-placeholder';
import { CompletedSentence } from '../extensions/CompletedSentence';
import { detectSentenceEndWithTiming, getCurrentSentence } from '../utils/sentenceDetector';
import { testAnalysis } from '../LLMs/testAnalysis';
import '../../styles/narrativeLayer.css';

interface NarrativeLayerProps {
  prompt: string;
  onSentenceSelect?: (sentence: string, index: number) => void;
  onSentenceEnd?: (sentence: string, confidence: number) => void; // New callback for sentence end detection
}

const NarrativeLayer: React.FC<NarrativeLayerProps> = ({ prompt, onSentenceSelect, onSentenceEnd }) => {
  const [wordCount, setWordCount] = useState(0);
  const [sentenceCount, setSentenceCount] = useState(0);
  const lastKeystrokeTimeRef = useRef<number>(Date.now());
  const [previousText, setPreviousText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<string>('');
  const processedSentencesRef = useRef<Set<string>>(new Set()); // Track processed sentences
  const lastProcessedCountRef = useRef<number>(0); // Track the last count to detect changes
  const isEditingRef = useRef<boolean>(false); // Track if user is editing a sentence
  const [isEditingState, setIsEditingState] = useState<boolean>(false); // State for UI reactivity
  const editingTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track editing timeout
  const [editingPosition, setEditingPosition] = useState<{from: number, to: number} | null>(null); // Track editing position for save button
  const saveButtonRef = useRef<HTMLButtonElement>(null); // Ref for positioning save button
  const [selectedSentence, setSelectedSentence] = useState<{element: HTMLElement, position: {from: number, to: number}} | null>(null); // Track selected sentence for dropdown
  const [dropdownPosition, setDropdownPosition] = useState<{left: number, top: number} | null>(null); // Track dropdown position
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track click timeout to prevent click on double-click
  const [editorHistory, setEditorHistory] = useState<string[]>([]); // Track editor history for undo/redo
  const [historyIndex, setHistoryIndex] = useState<number>(-1); // Track current position in history

  // Simple function to enhance click detection (no DOM manipulation needed)
  const addInsertionAreasBetweenSentences = useCallback((editorInstance: any) => {
    // The CSS pseudo-elements and click detection in handleClick already handle
    // the insertion functionality, so this function just ensures proper spacing
    if (!editorInstance) return;
    
    // console.log('📍 Insertion areas handled via CSS pseudo-elements and click detection');
  }, []);

  // Function to proactively mark completed sentences as the user types
  const markCompletedSentencesProactively = useCallback((editorInstance: any) => {
    if (!editorInstance || !editorInstance.commands.markAsCompletedSentence) {
      return;
    }

    // Don't mark sentences if user is actively editing
    if (isEditingRef.current) {
      // console.log('🚫 Skipping proactive marking - user is editing');
      return;
    }

    try {
      const fullText = editorInstance.getText();
      if (fullText.trim().length === 0) return;

      // Store current cursor position to restore it later
      const currentCursorPos = editorInstance.state.selection.from;
      const currentCursorEnd = editorInstance.state.selection.to;

      // Split text into sentences based on punctuation
      const sentences = fullText.split(/([.!?]+\s*)/);
      let currentPos = 0;
      
      // console.log('🔍 Proactive marking - found sentence parts:', sentences);
      
      for (let i = 0; i < sentences.length; i += 2) {
        const sentence = sentences[i];
        const punctuation = sentences[i + 1] || '';
        
        // If this part has content and is followed by punctuation, it's a complete sentence
        if (sentence.trim().length > 0 && punctuation.match(/[.!?]/)) {
          const sentenceWithPunctuation = sentence + punctuation.replace(/\s+$/, ''); // Remove trailing spaces from punctuation
          const from = currentPos;
          const to = currentPos + sentenceWithPunctuation.length;
          
          // console.log(`🔍 Found complete sentence: "${sentenceWithPunctuation}" at position ${from}-${to}`);
          
          // Check if this range is already marked
          const marks = editorInstance.state.doc.resolve(from).marks();
          const alreadyMarked = marks.some((mark: any) => mark.type.name === 'completedSentence');
          
          if (!alreadyMarked) {
            // console.log(`✨ Marking sentence: "${sentenceWithPunctuation}"`);
            
            // Temporarily select this sentence to apply marking
            editorInstance.commands.setTextSelection({ from, to });
            
            // Apply the completed sentence mark
            editorInstance.commands.markAsCompletedSentence();
          } else {
            // console.log(`⏭️ Sentence already marked: "${sentenceWithPunctuation}"`);
          }
        }
        
        // Move position forward
        currentPos += sentence.length + (punctuation ? punctuation.length : 0);
      }
      
      // ALWAYS restore the original cursor position - don't move to end!
      // console.log(`🔄 Restoring cursor to original position: ${currentCursorPos}-${currentCursorEnd}`);
      editorInstance.commands.setTextSelection({ from: currentCursorPos, to: currentCursorEnd });
      
      // Add insertion areas between completed sentences after a brief delay
      setTimeout(() => {
        addInsertionAreasBetweenSentences(editorInstance);
      }, 100);
      
    } catch (error) {
      // console.error('❌ Error in proactive marking:', error);
    }
  }, [addInsertionAreasBetweenSentences]);

  // Function to collect completed sentences from the editor
  const getCompletedSentences = useCallback((editorInstance: any): string[] => {
    if (!editorInstance) return [];
    
    try {
      // Get all completed sentence elements
      const completedElements = document.querySelectorAll('.completed-sentence');
      const completedSentences: string[] = [];
      
      completedElements.forEach((element) => {
        const text = element.textContent?.trim();
        if (text) {
          completedSentences.push(text);
        }
      });
      
      // console.log('📝 Found completed sentences:', completedSentences);
      return completedSentences;
    } catch (error) {
      // console.error('❌ Error collecting completed sentences:', error);
      return [];
    }
  }, []);

  // Sentence end detection and LLM trigger function
  const checkSentenceEnd = useCallback(async (text: string, editorInstance?: any) => {
    const result = detectSentenceEndWithTiming(text, lastKeystrokeTimeRef.current, 2000);
    
    // Enhanced debug logging with timing information (keep for console)
    const timeSinceKeystroke = Date.now() - lastKeystrokeTimeRef.current;
    const debugInfo = `${result.reason} (${(result.confidence * 100).toFixed(0)}%, ${Math.round(timeSinceKeystroke/1000)}s since keystroke)`;
    
    // Simple user-friendly status messages
    if (result.isSentenceEnd && result.confidence > 0.6) {
      setDetectionStatus('Thoughts received');
    } else if (text.trim()) {
      setDetectionStatus('Listening…');
    } else {
      setDetectionStatus('');
    }
    
    if (result.isSentenceEnd && result.confidence > 0.6) {
      let sentenceForAnalysis = '';
      
      // Try to get the sentence being typed at the current cursor position
      if (editorInstance) {
        const cursorPos = editorInstance.state.selection.from;
        const fullText = editorInstance.getText();
        
        // Find the sentence boundaries around the cursor position
        let sentenceStart = 0;
        let sentenceEnd = fullText.length;
        
        // Look backwards from cursor to find sentence start (after previous sentence ending)
        for (let i = cursorPos - 1; i >= 0; i--) {
          if (/[.!?]/.test(fullText[i])) {
            sentenceStart = i + 1;
            break;
          }
        }
        
        // Look forwards from cursor to find sentence end (before next sentence ending)
        for (let i = cursorPos; i < fullText.length; i++) {
          if (/[.!?]/.test(fullText[i])) {
            sentenceEnd = i;
            break;
          }
        }
        
        // Extract the sentence around the cursor
        sentenceForAnalysis = fullText.substring(sentenceStart, sentenceEnd).trim();
        // console.log(`🎯 Extracted sentence at cursor position ${cursorPos}: "${sentenceForAnalysis}"`);
      }
      
      // Fallback to original logic if cursor-based extraction fails
      if (!sentenceForAnalysis || sentenceForAnalysis.length <= 2) {
        let currentSentence = getCurrentSentence(text);
        sentenceForAnalysis = currentSentence.trim();
        
        // If getCurrentSentence returns empty, try to extract the last complete sentence manually
        if (!sentenceForAnalysis || sentenceForAnalysis.length <= 2) {
          // Split by sentence endings and find the last meaningful sentence
          const parts = text.trim().split(/([.!?]+)/);
          for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i]?.trim();
            if (part && part.length > 5 && !/^[.!?]+$/.test(part)) {
              sentenceForAnalysis = part;
              break;
            }
          }
          
          // If still no good sentence, use the full text if it's reasonable length
          if (!sentenceForAnalysis && text.trim().length > 5 && text.trim().length < 200) {
            sentenceForAnalysis = text.trim();
          }
        }
        // console.log(`🔄 Fallback extraction used: "${sentenceForAnalysis}"`);
      }
      
      // Check if sentence doesn't end with punctuation or if user might be typing punctuation
      const endsWithPartialPunctuation = /\.$/.test(sentenceForAnalysis) || /\.{1,2}$/.test(sentenceForAnalysis);
      const needsPunctuation = sentenceForAnalysis && 
        !/[.!?…]$/.test(sentenceForAnalysis) && 
        !sentenceForAnalysis.endsWith('...') &&
        !endsWithPartialPunctuation;
      
      // Store original sentence before modification for marking
      const originalSentence = sentenceForAnalysis;
      
      // Auto-append period for analysis
      if (needsPunctuation) {
        sentenceForAnalysis += '.';
        
        // Also add the period to the UI if editor is available and this is from pause detection
        // Only add period if user hasn't recently typed any punctuation
        if (editorInstance && (result.reason.includes('pause') || result.reason.includes('complete_thought') || result.reason.includes('emotional') || result.reason.includes('negative'))) {
          const currentText = editorInstance.getText();
          const timeSinceKeystroke = Date.now() - lastKeystrokeTimeRef.current;
          
          // Only auto-add period if:
          // 1. Text doesn't end with punctuation
          // 2. User has paused for at least 1 second (to avoid interfering with typing)
          // 3. Text doesn't end with partial punctuation that user might be expanding
          if (!currentText.endsWith('.') && 
              !currentText.endsWith('!') && 
              !currentText.endsWith('?') && 
              !currentText.endsWith('…') && 
              !currentText.endsWith('...') &&
              !currentText.endsWith('..') &&
              timeSinceKeystroke > 1000) {
            editorInstance.commands.insertContent('.');
          }
        }
      }
      
      // Create a unique key for this sentence (normalized)
      // Remove punctuation for duplicate detection, but keep original for analysis
      const sentenceKey = sentenceForAnalysis
        .toLowerCase()
        .replace(/[.!?]+$/, '') // Remove ending punctuation for deduplication
        .replace(/\s+/g, ' ')
        .trim();
      
      // Check if we've already processed this sentence
      if (processedSentencesRef.current.has(sentenceKey)) {
        return;
      }
      
      if (sentenceForAnalysis.length > 3 && onSentenceEnd) {
        // Mark this sentence as processed
        processedSentencesRef.current.add(sentenceKey);
        
        // Check if the count of processed sentences has changed and log only then
        const currentCount = processedSentencesRef.current.size;
        if (currentCount !== lastProcessedCountRef.current) {
          lastProcessedCountRef.current = currentCount;
        }
        
        // Get completed sentences
        const completedSentences = getCompletedSentences(editorInstance);
        
        try {
          const testResult = await testAnalysis(
            sentenceForAnalysis,
            text, // full text
            completedSentences // completed sentences
          );
        } catch (error) {
          console.error('🧪 Test analysis failed:', error);
        }
        
        // Mark the sentence as completed in the editor proactively
        setTimeout(() => {
          if (editorInstance && !isEditingRef.current) {
            markCompletedSentencesProactively(editorInstance);
          }
        }, 200); // Slightly longer delay to ensure text is updated
        
        setIsAnalyzing(true);
        setDetectionStatus('Analyzing…');
        try {
          await onSentenceEnd(sentenceForAnalysis, result.confidence);
        } finally {
          setIsAnalyzing(false);
          setDetectionStatus('');
        }
      }
    }
  }, [onSentenceEnd, getCompletedSentences]);

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
      CompletedSentence,
      Placeholder.configure({
        placeholder: 'Start with a hunch, goal, or observation…',
      }),
    ],
    content: '<p></p>',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.split(/\s+/).filter(Boolean).length;
      const sentences = text.split(/[.!?]+/).filter(line => line.trim().length > 0).length;
      setWordCount(words);
      setSentenceCount(sentences);
      
      // Log cursor position during updates when editing
      if (isEditingRef.current) {
        const cursorPos = editor.state.selection.from;
        // console.log(`🔍 onUpdate while editing - cursor at position: ${cursorPos}`);
      }
      
      // Clear processed sentences if text was significantly reduced (user deleted content)
      if (text.length < previousText.length - 10) {
        const previousCount = processedSentencesRef.current.size;
        processedSentencesRef.current.clear();
        lastProcessedCountRef.current = 0;
        console.log(`🧹 Text reduced significantly, cleared ${previousCount} processed sentences`);
      }
      
      // Proactively mark completed sentences on every update (but don't move cursor)
      if (!isEditingRef.current) {
        markCompletedSentencesProactively(editor);
      }
      
      // Check for sentence end and trigger LLM if needed
      checkSentenceEnd(text, editor);
      
      // Auto-save to history on significant changes (but not on every keystroke)
      const significantChange = Math.abs(text.length - previousText.length) > 5 || 
                               (text !== previousText && text.trim().endsWith('.'));
      
      if (significantChange && text.trim() !== '') {
        // Debounce history updates to avoid too many entries
        const shouldAddToHistory = editorHistory.length === 0 || 
                                  editorHistory[editorHistory.length - 1] !== text;
        
        if (shouldAddToHistory) {
          setEditorHistory(prev => {
            const newHistory = [...prev.slice(0, historyIndex + 1), text];
            // Keep history size manageable (max 50 entries)
            const trimmedHistory = newHistory.slice(-50);
            setHistoryIndex(trimmedHistory.length - 1);
            return trimmedHistory;
          });
        }
      }
      
      // Update previous text for comparison
      setPreviousText(text);
    },
    editorProps: {
      attributes: {
        class: 'narrative-editor-content',
        'data-gramm': 'false',
        'data-gramm_editor': 'false',
        'data-enable-grammarly': 'false',
        spellcheck: 'false',
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
      },
      handleKeyDown: (view, event) => {
        // Update keystroke timing for pause detection
        lastKeystrokeTimeRef.current = Date.now();
        
        // Check if cursor is inside a completed sentence
        const cursorPos = view.state.selection.from;
        const marks = view.state.doc.resolve(cursorPos).marks();
        const isInCompletedSentence = marks.some((mark: any) => mark.type.name === 'completedSentence');
        
        // Handle delete key for completed sentences
        if (isInCompletedSentence && (event.key === 'Delete' || event.key === 'Backspace')) {
          console.log('🗑️ Delete key pressed on completed sentence - deleting whole sentence');
          
          // Find the completed sentence element at cursor position
          const completedSentences = document.querySelectorAll('.completed-sentence');
          let sentenceToDelete: HTMLElement | null = null;
          
          for (const sentence of completedSentences) {
            const sentenceStart = view.posAtDOM(sentence as HTMLElement, 0);
            const sentenceEnd = view.posAtDOM(sentence as HTMLElement, (sentence as HTMLElement).childNodes.length);
            
            if (cursorPos >= sentenceStart && cursorPos <= sentenceEnd) {
              sentenceToDelete = sentence as HTMLElement;
              break;
            }
          }
          
          if (sentenceToDelete) {
            let sentenceStart = view.posAtDOM(sentenceToDelete, 0);
            let sentenceEnd = view.posAtDOM(sentenceToDelete, sentenceToDelete.childNodes.length);
            
            // Extend the deletion range to include punctuation that follows
            const fullText = view.state.doc.textBetween(0, view.state.doc.content.size);
            let extendedEnd = sentenceEnd;
            
            // Look ahead to include any punctuation and trailing spaces
            while (extendedEnd < fullText.length) {
              const char = fullText.charAt(extendedEnd);
              if (/[.!?…]/.test(char)) {
                // Include the punctuation
                extendedEnd++;
                // Also include any trailing spaces after punctuation
                while (extendedEnd < fullText.length && /\s/.test(fullText.charAt(extendedEnd))) {
                  extendedEnd++;
                }
                break;
              } else if (/\s/.test(char)) {
                // Skip spaces between sentence and punctuation
                extendedEnd++;
              } else {
                // Stop if we hit non-punctuation, non-space character
                break;
              }
            }
            
            // Delete the entire sentence including punctuation
            view.dispatch(
              view.state.tr.delete(sentenceStart, extendedEnd)
            );
            
            console.log(`🗑️ Deleted completed sentence with punctuation: "${sentenceToDelete.textContent}"`);
          }
          
          event.preventDefault();
          return true;
        }
        
        // If cursor is in a completed sentence and we're not in editing mode, block typing
        if (isInCompletedSentence && !isEditingRef.current) {
          // console.log('🚫 Blocking keystroke in completed sentence - double-click to edit');
          event.preventDefault();
          return true; // Block the keystroke
        }
        
        // Log cursor position when in editing mode for debugging
        if (isEditingRef.current) {
          const cursorPos = view.state.selection.from;
          // console.log(`🔍 Keystroke while editing - cursor at position: ${cursorPos}, key: ${event.key}`);
          
          // Reset the editing timeout on every keystroke to keep editing mode active
          if (editingTimeoutRef.current) {
            clearTimeout(editingTimeoutRef.current);
          }
          editingTimeoutRef.current = setTimeout(() => {
            if (isEditingRef.current) {
              isEditingRef.current = false;
              setIsEditingState(false);
              setEditingPosition(null);
              editingTimeoutRef.current = null;
              // console.log('🔓 Editing timeout after keystroke inactivity - clearing editing mode');
            }
          }, 10000); // 3 seconds after last keystroke
        }
        
        // If user was editing and presses Enter or Escape, handle accordingly
        if (isEditingRef.current) {
          if (event.key === 'Enter') {
            // console.log('💾 Enter pressed - saving sentence and clearing editing mode');
            event.preventDefault(); // Prevent default Enter behavior (line break)
            finishEditingSentence(); // Save the sentence
            return true; // Block the keystroke to prevent line break
          } else if (event.key === 'Escape') {
            // console.log('🔓 Escape pressed - clearing editing mode without saving');
            isEditingRef.current = false;
            setIsEditingState(false);
            setEditingPosition(null);
            if (editingTimeoutRef.current) {
              clearTimeout(editingTimeoutRef.current);
              editingTimeoutRef.current = null;
            }
          }
        }
        
        // Debug log to see what keys are being pressed
        // console.log('Key pressed:', event.key, event.code);
        
        // Let all keys work normally except for specific overrides
        if (event.key === ' ') {
          // console.log('Space key - should add space, not new line');
          return false; // Let default behavior handle space
        }
        
        return false; // Let default behavior handle all other keys
      },
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;
        
        // Check if clicked in the left margin area of sentences (8px space before sentences)
        const clickX = event.clientX;
        const clickY = event.clientY;
        
        // Get all completed sentences
        const completedSentences = document.querySelectorAll('.completed-sentence');
        
        // Check each sentence's left margin area (starting from second sentence)
        for (let i = 1; i < completedSentences.length; i++) {
          const sentence = completedSentences[i] as HTMLElement;
          const sentenceRect = sentence.getBoundingClientRect();
          
          // Check if click is in the 8px left margin space of this sentence
          if (clickX >= sentenceRect.left - 8 && 
              clickX < sentenceRect.left && 
              clickY >= sentenceRect.top && 
              clickY <= sentenceRect.bottom) {
            
            console.log('📝 Clicked in left margin before sentence - positioning cursor for insertion');
            
            // Find the position at the start of this sentence
            const sentenceStartPos = view.posAtDOM(sentence, 0);
            
            // Position cursor before this sentence
            editor?.commands.setTextSelection(sentenceStartPos);
            editor?.commands.focus();
            
            event.preventDefault();
            return true;
          }
        }
        
        // Check if clicked on a completed sentence
        if (target.closest('.completed-sentence')) {
          const sentenceElement = target.closest('.completed-sentence') as HTMLElement;
          console.log('🖱️ Clicked on completed sentence:', sentenceElement.textContent);
          
          // Clear any existing click timeout
          if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
          }
          
          // Set a timeout to handle the click - this will be cancelled if a double-click occurs
          clickTimeoutRef.current = setTimeout(() => {
            // Get the position of the clicked sentence
            const position = view.posAtDOM(sentenceElement, 0);
            const endPosition = view.posAtDOM(sentenceElement, sentenceElement.childNodes.length);
            
            // Set the selected sentence and show dropdown
            setSelectedSentence({ 
              element: sentenceElement, 
              position: { from: position, to: endPosition } 
            });
            
            // Calculate dropdown position at the end of the sentence
            const sentenceRect = sentenceElement.getBoundingClientRect();
            setDropdownPosition({
              left: sentenceRect.right + 8, // 8px gap from sentence end
              top: sentenceRect.top
            });
            
            // Add selected styling to the sentence
            sentenceElement.setAttribute('data-selected', 'true');
            
            // console.log('📋 Dropdown shown after click delay');
            clickTimeoutRef.current = null;
          }, 200); // 200ms delay to allow double-click to cancel
          
          event.preventDefault();
          return true;
        }
        
        // Check if clicked on the dropdown menu
        if (target.closest('.sentence-dropdown')) {
          // Don't clear dropdown if clicking on the dropdown itself
          // console.log('🖱️ Clicked on dropdown menu - keeping dropdown open');
          return false;
        }
        
        // Note: Global click handler now manages dropdown clearing for clicks outside editor
        
        // Only clear editing mode if clicked outside the editor content area
        if (isEditingRef.current) {
          const isInsideEditor = (event.target as HTMLElement)?.closest('.narrative-editor');
          if (!isInsideEditor) {
            console.log('🔓 Clicked outside editor - clearing editing mode');
            isEditingRef.current = false;
            setIsEditingState(false);
            setEditingPosition(null);
            if (editingTimeoutRef.current) {
              clearTimeout(editingTimeoutRef.current);
              editingTimeoutRef.current = null;
            }
          } else {
            console.log('🛑 Clicked inside editor - keeping editing mode');
          }
        }
        
        return false;
      },
      handleDoubleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;
        
        // Check if double-clicked on a completed sentence
        if (target.closest('.completed-sentence')) {
          const sentenceElement = target.closest('.completed-sentence') as HTMLElement;
          console.log('✏️ Double-clicked to edit sentence:', sentenceElement.textContent);
          
          // Cancel any pending click timeout to prevent dropdown from showing
          if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
            console.log('🚫 Cancelled click timeout due to double-click');
          }
          
          // Clear any existing dropdown/selection from previous clicks
          if (selectedSentence) {
            selectedSentence.element.removeAttribute('data-selected');
            setSelectedSentence(null);
            setDropdownPosition(null);
          }
          
          // Clear any existing timeout
          if (editingTimeoutRef.current) {
            clearTimeout(editingTimeoutRef.current);
          }
          
          // Set editing flag to prevent re-marking during editing
          isEditingRef.current = true;
          setIsEditingState(true);
          console.log('🔒 Editing mode enabled - proactive marking disabled');
          
          // Get the position of the clicked element
          const position = view.posAtDOM(sentenceElement, 0);
          const endPosition = view.posAtDOM(sentenceElement, sentenceElement.childNodes.length);
          
          // Store the editing position for the save button
          setEditingPosition({ from: position, to: endPosition });
          
          console.log(`📝 Editing sentence range: ${position}-${endPosition}`);
          
          // Select the sentence text using setTextSelection
          editor?.commands.setTextSelection({ from: position, to: endPosition });
          
          // Remove the completed sentence mark to allow editing
          editor?.commands.unmarkCompletedSentence();
          
          console.log('Removed completed sentence mark for editing');
          
          // Set a timeout to disable editing mode after 10 seconds of inactivity
          editingTimeoutRef.current = setTimeout(() => {
            if (isEditingRef.current) {
              isEditingRef.current = false;
              setIsEditingState(false);
              setEditingPosition(null);
              editingTimeoutRef.current = null;
              console.log('🔓 Editing timeout - clearing editing mode');
            }
          }, 10000); // 10 seconds timeout
          
          event.preventDefault();
          return true;
        }
        
        return false;
      },
      handleDOMEvents: {
        mouseover: (view, event) => {
          const target = event.target as HTMLElement;
          
          // Check if hovering over a completed sentence
          if (target.closest('.completed-sentence')) {
            const sentenceElement = target.closest('.completed-sentence') as HTMLElement;
            // console.log('👆 Hovering over completed sentence:', sentenceElement.textContent);
          }
          
          return false;
        },
        mouseout: (view, event) => {
          const target = event.target as HTMLElement;
          
          // Check if leaving a completed sentence
          if (target.closest('.completed-sentence')) {
            const sentenceElement = target.closest('.completed-sentence') as HTMLElement;
            // console.log('👋 Left completed sentence:', sentenceElement.textContent);
          }
          
          return false;
        },
      },
    },
  });
  
  // Function to save/finish editing a sentence
  const finishEditingSentence = useCallback(() => {
    if (isEditingRef.current && editor && editingPosition) {
      console.log('💾 Finishing sentence editing and re-marking as completed');
      
      // Clear editing state
      isEditingRef.current = false;
      setIsEditingState(false);
      setEditingPosition(null);
      
      // Clear timeout
      if (editingTimeoutRef.current) {
        clearTimeout(editingTimeoutRef.current);
        editingTimeoutRef.current = null;
      }
      
      // Re-mark completed sentences after a brief delay
      setTimeout(() => {
        markCompletedSentencesProactively(editor);
        // Also add insertion areas after re-marking
        setTimeout(() => {
          addInsertionAreasBetweenSentences(editor);
        }, 100);
      }, 100);
    }
  }, [editor, editingPosition, markCompletedSentencesProactively, addInsertionAreasBetweenSentences]);

  // Function to position save button next to the editing sentence
  const positionSaveButton = useCallback(() => {
    if (!saveButtonRef.current || !editingPosition || !editor) return;

    // Find the sentence element being edited
    const editorElement = document.querySelector('.narrative-editor-content');
    if (!editorElement) return;

    // Get the DOM position of the editing range
    const view = editor.view;
    const { from } = editingPosition;
    
    try {
      const coords = view.coordsAtPos(from);
      const editorRect = editorElement.getBoundingClientRect();
      
      // Position the button to the right of the sentence, aligned with its top
      const buttonElement = saveButtonRef.current;
      buttonElement.style.left = `${coords.right + 8}px`; // 8px gap from sentence
      buttonElement.style.top = `${coords.top - 10}px`; // Moved up by 36px from previous position (-2px)
      
      console.log(`📍 Positioned save button at (${coords.right + 8}, ${coords.top - 38})`);
    } catch (error) {
      console.error('❌ Error positioning save button:', error);
    }
  }, [editingPosition, editor]);

  // Function to handle dropdown actions
  const handleDropdownAction = useCallback((action: string, event?: React.MouseEvent) => {
    // Prevent event bubbling to avoid clearing the dropdown
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    if (!selectedSentence) return;
    
    console.log(`🎯 ${action} action for sentence:`, selectedSentence.element.textContent);
    
    // Clear selection after action
    selectedSentence.element.removeAttribute('data-selected');
    setSelectedSentence(null);
    setDropdownPosition(null);
    
    // Handle different actions
    switch (action) {
      case 'show-view':
        console.log('📊 Showing view for sentence...');
        // TODO: Implement show view functionality
        break;
      case 'branch':
        console.log('🌿 Creating branch from sentence...');
        // TODO: Implement branch functionality
        break;
      case 'add-next':
        console.log('➕ Adding next sentence after:', selectedSentence.element.textContent);
        // Position cursor right after this sentence for continuing
        if (editor) {
          // Position cursor at the end of the selected sentence
          const insertionPos = selectedSentence.position.to;
          
          // Insert a space if there isn't one already
          const currentText = editor.getText();
          const charAfterSentence = currentText.charAt(insertionPos);
          
          if (charAfterSentence && charAfterSentence !== ' ') {
            // Insert a space after the sentence
            editor.commands.setTextSelection(insertionPos);
            editor.commands.insertContent(' ');
            // Position cursor after the space we just inserted
            editor.commands.setTextSelection(insertionPos + 1);
          } else if (charAfterSentence === ' ') {
            // There's already a space, position cursor after it
            editor.commands.setTextSelection(insertionPos + 1);
          } else {
            // We're at the end of the text, insert a space and position after it
            editor.commands.setTextSelection(insertionPos);
            editor.commands.insertContent(' ');
            editor.commands.setTextSelection(insertionPos + 1);
          }
          
          // Focus the editor so user can start typing immediately
          editor.commands.focus();
          
          // Double-check that we're not in a completed sentence mark
          setTimeout(() => {
            const newCursorPos = editor.state.selection.from;
            const marks = editor.state.doc.resolve(newCursorPos).marks();
            const isStillInCompletedSentence = marks.some((mark: any) => mark.type.name === 'completedSentence');
            
            if (isStillInCompletedSentence) {
              console.log('⚠️ Still in completed sentence, inserting additional space');
              editor.commands.insertContent(' ');
            }
            
            console.log(`📍 Cursor positioned at position ${newCursorPos} for next sentence`);
          }, 50);
        }
        break;
    }
  }, [selectedSentence, editor]);
  
  // Add global click listener to handle clicks outside the editor
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't clear if clicking on completed sentence or dropdown
      if (target.closest('.completed-sentence') || target.closest('.sentence-dropdown')) {
        return;
      }
      
      // Clear dropdown and selection if clicked anywhere else
      if (selectedSentence) {
        console.log('🔄 Global click outside sentence/dropdown - clearing selection');
        selectedSentence.element.removeAttribute('data-selected');
        setSelectedSentence(null);
        setDropdownPosition(null);
      }
    };
    
    // Add the global click listener
    document.addEventListener('click', handleGlobalClick);
    
    // Cleanup on unmount
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      
      // Clean up any pending timeouts
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [selectedSentence]);

  // Periodically check for sentence endings when user has paused
  useEffect(() => {
    if (!editor) return;
    
    const interval = setInterval(() => {
      const currentText = editor.getText();
      // Always check if there's text, regardless of whether it changed
      // This is important for detecting pauses
      if (currentText.trim()) {
        checkSentenceEnd(currentText, editor);
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [editor, checkSentenceEnd]);

  // Position save button when editing position changes
  useEffect(() => {
    if (editingPosition && isEditingState) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        positionSaveButton();
      }, 50);
    }
  }, [editingPosition, isEditingState, positionSaveButton]);
  
  // Remove the useEffect that was setting prompt content
  // The editor will now always start empty and show the CSS placeholder

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

  // Handler functions for save, redo, and reset buttons
  const handleSave = useCallback(() => {
    if (!editor) return;
    
    const currentText = editor.getText();
    console.log('💾 Saving current narrative state');
    
    // Add current state to history
    setEditorHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), currentText];
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
    
    // You can add additional save logic here (e.g., save to localStorage, database, etc.)
    alert('Narrative saved successfully!');
  }, [editor, historyIndex]);

  const handleUndo = useCallback(() => {
    if (!editor || historyIndex <= 0) return;
    
    console.log('↶ Undoing to previous state');
    const previousState = editorHistory[historyIndex - 1];
    editor.commands.setContent(previousState);
    setHistoryIndex(prev => prev - 1);
  }, [editor, editorHistory, historyIndex]);

  const handleRedo = useCallback(() => {
    if (!editor || historyIndex >= editorHistory.length - 1) return;
    
    console.log('↷ Redoing to next state');
    const nextState = editorHistory[historyIndex + 1];
    editor.commands.setContent(nextState);
    setHistoryIndex(prev => prev + 1);
  }, [editor, editorHistory, historyIndex]);

  const handleReset = useCallback(() => {
    if (!editor) return;
    
    const confirmReset = window.confirm('Are you sure you want to reset the entire narrative? This cannot be undone.');
    if (confirmReset) {
      console.log('🔄 Resetting narrative to empty state');
      editor.commands.clearContent();
      setEditorHistory([]);
      setHistoryIndex(-1);
      processedSentencesRef.current.clear();
      lastProcessedCountRef.current = 0;
      setPreviousText('');
      setWordCount(0);
      setSentenceCount(0);
    }
  }, [editor]);

  return (
    <div className="narrative-layer">
      {/* Action buttons bar */}
      <div className="narrative-actions">
        <button
          className="action-button save-button"
          onClick={handleSave}
          title="Save current narrative state"
        >
          <FaSave /> Save
        </button>
        <button
          className="action-button undo-button"
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          title="Undo last change"
        >
          <IoArrowUndo /> Undo
        </button>
        <button
          className="action-button reset-button"
          onClick={handleReset}
          title="Reset entire narrative (WARNING: This cannot be undone)"
        >
          <ImRedo2 /> Reset
        </button>
      </div>
      
      <div className="narrative-editor">
        <EditorContent 
          editor={editor} 
          onClick={handleClick}
        />
        
        {/* Save button for editing mode */}
        {editingPosition && isEditingState && (
          <button
            ref={saveButtonRef}
            className="sentence-save-button"
            onClick={finishEditingSentence}
            title="Save changes"
          >
            <IoSaveSharp />
          </button>
        )}
        
        {/* Dropdown menu for sentence actions */}
        {selectedSentence && dropdownPosition && (
          <div
            className="sentence-dropdown"
            style={{
              position: 'fixed',
              left: `${dropdownPosition.left}px`,
              top: `${dropdownPosition.top}px`,
              zIndex: 1000
            }}
          >
            <button
              className="dropdown-item"
              onClick={(e) => handleDropdownAction('show-view', e)}
              title="See the data or view that supported this sentence"
            >
              Show view
            </button>
            <button
              className="dropdown-item"
              onClick={(e) => handleDropdownAction('branch', e)}
              title="Fork from this sentence to explore an alternative framing or direction"
            >
              Branches
            </button>
            <button
              className="dropdown-item"
              onClick={(e) => handleDropdownAction('add-next', e)}
              title="Continue the narrative from this sentence"
            >
              Add next
            </button>
          </div>
        )}
      </div>
      
      <div className="narrative-footer">
        <div className="narrative-stats">
          <span>{sentenceCount} sentences</span>
          <span>{wordCount} words</span>
          {isAnalyzing && <span className="ai-analyzing">Analyzing…</span>}
          {detectionStatus && !isAnalyzing && (
            <span className="detection-status">{detectionStatus}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NarrativeLayer;
