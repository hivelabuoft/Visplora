'use client';

import React, { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Editor } from '@tiptap/core';
import { IoSaveSharp, IoArrowUndo } from "react-icons/io5";
import { FaSave } from "react-icons/fa";
import { ImRedo2 } from "react-icons/im";
import { HiOutlineDocumentDuplicate, HiOutlineTrash, HiOutlineChartBar, HiOutlinePlus } from "react-icons/hi2";
import { MdCancel } from "react-icons/md";
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import History from '@tiptap/extension-history';
import Placeholder from '@tiptap/extension-placeholder';
import HardBreak from '@tiptap/extension-hard-break';
import { CompletedSentence } from '../extensions/CompletedSentence';
import { detectSentenceEndWithTiming, getCurrentSentence } from '../utils/sentenceDetector';
import { detectNumbers } from '../utils/numberDetector';
import { testAnalysis } from '../LLMs/testAnalysis';
import { validateDomain } from '../LLMs/domainValidation';
import { NarrativeSuggestion } from '../LLMs/suggestion_from_interaction';
import NarrativeSuggestionBox from './NarrativeSuggestion';
import '../../styles/narrativeLayer.css';
import { ConfirmationModal } from '../utils/ConfirmationModal';

interface NarrativeLayerProps {
  prompt: string;
  onSentenceSelect?: (sentence: string, index: number) => void;
  onSentenceEnd?: (sentence: string, confidence: number) => void; // New callback for sentence end detection
  onSuggestionReceived?: (suggestion: NarrativeSuggestion) => void; // New callback for when suggestions are received
  onSuggestionResolved?: () => void; // New callback for when suggestions are accepted or denied
  onGenerateVisualization?: (sentence: string, validation: any) => void; // New callback for visualization generation
  disableInteractions?: boolean; // New prop to disable interactions when info nodes are active
  onContentChange?: (oldContent: string, newContent: string) => void; // New callback for content changes
  isExampleScenario?: boolean; // New prop to indicate if we're in an example scenario
  onShowViewForSentence?: (sentence: string, sentenceId?: string, shouldGenerateIfMissing?: boolean) => void; // New callback for showing view for a sentence
  // New simplified props for tree structure
  getBranchesForSentence?: (sentenceContent: string) => Array<{
    id: string;
    content: string;
    fullPathContent: string; // Full content following this branch
    type: 'branch' | 'original_continuation';
  }>;
  onSwitchToBranch?: (branchId: string) => void;
  onCreateBranch?: (fromSentenceContent: string, branchContent: string) => void;
  onUpdateBranchContent?: (branchId: string, newContent: string) => void; // New callback for updating branch content
  onEnterEditMode?: (sentenceContent: string) => void; // New callback for entering edit mode
  onExitEditMode?: (sentenceContent: string) => void; // New callback for exiting edit mode
  findNodeIdByContent?: (content: string) => string | null; // Helper to find node ID by content
  onDeleteSentence?: (sentenceIdOrContent: string) => void; // New callback for deleting sentences from tree
  onDeleteBranch?: (branchId: string) => void; // New callback for deleting entire branches from tree
  onInsertNodeAfter?: (afterSentenceContentOrId: string, newSentenceContent: string, useId?: boolean) => void; // New callback for inserting node after a sentence
  updateSentenceNodeContent?: (nodeId: string, newContent: string) => boolean; // New callback for updating specific node content by ID
  currentEditSentenceId?: string | null; // ID of the sentence currently being edited
  onResetPage?: () => void; // New callback for resetting the current page
}

// Expose methods for parent components to access editor content
export interface NarrativeLayerRef {
  getFullText: () => string;
  getCurrentSentence: () => string;
  updateContent: (newContent: string) => void;
  showSuggestion: (suggestion: NarrativeSuggestion) => void;
  clearSuggestion: () => void;
  showLoadingSuggestion: () => void;
  hideLoadingSuggestion: () => void;
  hasPendingSuggestion: () => boolean;
  highlightSentence: (sentenceContent: string) => boolean; // New method for timeline integration
}

const NarrativeLayer = forwardRef<NarrativeLayerRef, NarrativeLayerProps>(({ 
  prompt, 
  onSentenceSelect, 
  onSentenceEnd, 
  onSuggestionReceived, 
  onSuggestionResolved, 
  onGenerateVisualization, 
  disableInteractions = false,
  onContentChange,
  isExampleScenario = false,
  onShowViewForSentence,
  getBranchesForSentence,
  onSwitchToBranch,
  onCreateBranch,
  onUpdateBranchContent,
  onEnterEditMode,
  onExitEditMode,
  findNodeIdByContent,
  onDeleteSentence,
  onDeleteBranch,
  onInsertNodeAfter,
  updateSentenceNodeContent,
  currentEditSentenceId,
  onResetPage
}, ref) => {
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
  const recentlyEditedContentRef = useRef<Set<string>>(new Set()); // Track recently edited content to prevent duplicate processing
  const [editingPosition, setEditingPosition] = useState<{from: number, to: number} | null>(null); // Track editing position for save button
  const [originalEditingContent, setOriginalEditingContent] = useState<string | null>(null); // Store original content when edit mode starts
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null); // Store the actual node ID being edited
  const saveButtonRef = useRef<HTMLButtonElement>(null); // Ref for positioning save button
  const [selectedSentence, setSelectedSentence] = useState<{element: HTMLElement, position: {from: number, to: number}, sentenceId: string | null} | null>(null); // Track selected sentence for dropdown
  const [dropdownPosition, setDropdownPosition] = useState<{left: number, top: number} | null>(null); // Track dropdown position
  const [addNextMode, setAddNextMode] = useState<{
    isActive: boolean;
    afterSentenceContent: string;
    afterSentenceId: string | null; // Add the sentence ID
    position: {left: number, top: number};
  } | null>(null); // Track "add next" inline editor state
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track click timeout to prevent click on double-click
  const [editorHistory, setEditorHistory] = useState<string[]>([]); // Track editor history for undo/redo
  const [historyIndex, setHistoryIndex] = useState<number>(-1); // Track current position in history
  const [showResetModal, setShowResetModal] = useState(false); // Track reset confirmation modal
  
  // Undo system for deletions
  const [undoStack, setUndoStack] = useState<Array<{
    type: 'delete_sentence' | 'delete_branch';
    timestamp: number;
    deletedContent: string;
    deletedBranchId?: string; // For branch deletions
    context: any; // Store the deletion context for restoration
  }>>([]);
  const [showUndoButton, setShowUndoButton] = useState(false);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Enhanced branch state for inline branching interface
  const [branchingMode, setBranchingMode] = useState<{
    isActive: boolean;
    isDraft: boolean; // True when branches are not yet committed to tree structure
    parentSentence: string;
    branches: Array<{
      id: string;
      content: string;
      originalContent: string; // Store original content for comparison when saving
      type: 'original' | 'alternative';
      editor: any;
      isNew?: boolean; // True for newly created branches not yet in tree structure
    }>;
    insertPosition: number; // Position where branch section should be inserted
    position?: { left: number; top: number }; // Visual position for inline display
  }>({
    isActive: false,
    isDraft: false,
    parentSentence: '',
    branches: [],
    insertPosition: 0,
    position: undefined
  });
  
  // Suggestion state
  const [currentSuggestion, setCurrentSuggestion] = useState<NarrativeSuggestion | null>(null);
  const [suggestionPosition, setSuggestionPosition] = useState<{top: number, left: number} | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

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

      // Use smart sentence splitting that considers decimal numbers
      const sentences = [];
      let currentPos = 0;
      let sentenceStart = 0;
      
      for (let i = 0; i < fullText.length; i++) {
        const char = fullText[i];
        
        if (/[.!?]/.test(char)) {
          // Check if this period is part of a decimal number
          const beforePeriod = fullText.substring(Math.max(0, i - 10), i);
          const afterPeriod = fullText.substring(i + 1, Math.min(fullText.length, i + 10));
          
          // For periods, be more specific about decimal detection
          if (char === '.') {
            // Check if this is truly part of a decimal number:
            // 1. Must have a digit immediately before
            // 2. Must have a digit immediately after (not just whitespace or end of text)
            const hasDigitBefore = /\d$/.test(beforePeriod);
            const hasDigitAfter = /^\d/.test(afterPeriod);
            
            // If it has digit before but NOT digit after, it's likely sentence punctuation after a decimal
            // If it has both digits before and after, it's part of a decimal number
            if (hasDigitBefore && hasDigitAfter) {
              continue; // Skip this period, it's part of a decimal
            }
            // If it has digit before but no digit after, treat it as sentence punctuation
          }
          
          // This is a real sentence ending punctuation
          const sentenceText = fullText.substring(sentenceStart, i + 1).trim();
          
          if (sentenceText.length > 0) {
            sentences.push({
              text: sentenceText,
              start: sentenceStart,
              end: i + 1
            });
          }
          
          // Move to start of next sentence (skip any whitespace)
          let nextStart = i + 1;
          while (nextStart < fullText.length && /\s/.test(fullText[nextStart])) {
            nextStart++;
          }
          sentenceStart = nextStart;
        }
      }
      
      // console.log('🔍 Proactive marking - found sentences:', sentences);
      
      // Mark each detected sentence
      for (const sentence of sentences) {
        // Check if this range is already marked
        const marks = editorInstance.state.doc.resolve(sentence.start).marks();
        const alreadyMarked = marks.some((mark: any) => mark.type.name === 'completedSentence');
        
        if (!alreadyMarked) {
          // console.log(`✨ Marking sentence: "${sentence.text}"`);
          
          // Temporarily select this sentence to apply marking
          editorInstance.commands.setTextSelection({ from: sentence.start, to: sentence.end });
          
          // Apply the completed sentence mark
          editorInstance.commands.markAsCompletedSentence();
        } else {
          // console.log(`⏭️ Sentence already marked: "${sentence.text}"`);
        }
      }
      
      // ALWAYS restore the original cursor position - don't move to end!
      // console.log(`🔄 Restoring cursor to original position: ${currentCursorPos}-${currentCursorEnd}`);
      editorInstance.commands.setTextSelection({ from: currentCursorPos, to: currentCursorEnd });
      
      // Add insertion areas between completed sentences after a brief delay - but not when editing
      if (!isEditingRef.current) {
        setTimeout(() => {
          addInsertionAreasBetweenSentences(editorInstance);
          
          // IMPORTANT: Restore data-selected attribute after marking is complete
          // This ensures the selection survives the DOM re-creation from markAsCompletedSentence
          if (selectedSentence && selectedSentence.element) {
            const sentenceText = selectedSentence.element.textContent?.trim();
            if (sentenceText) {
              // Find the newly created sentence element with the same text
              const completedSentences = document.querySelectorAll('.completed-sentence');
              for (const sentence of completedSentences) {
                if ((sentence as HTMLElement).textContent?.trim() === sentenceText) {
                  sentence.setAttribute('data-selected', 'true');
                  
                  // Update the selectedSentence reference to the new DOM element
                  setSelectedSentence(prev => prev ? {
                    ...prev,
                    element: sentence as HTMLElement
                  } : null);
                  break;
                }
              }
            }
          }
        }, 100);
      }
      
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
    // Skip sentence detection if user is actively editing
    if (isEditingRef.current) {
      return;
    }
    
    // Also skip if this content was recently edited to prevent duplicate processing
    const currentText = text.trim();
    
    // Check both the exact text and normalized versions against recently edited content
    const normalizedCurrentText = currentText
      .toLowerCase()
      .replace(/[.!?]+$/, '') // Remove ending punctuation for deduplication
      .replace(/\s+/g, ' ')
      .trim();
    
    if (recentlyEditedContentRef.current.has(currentText) || 
        recentlyEditedContentRef.current.has(normalizedCurrentText)) {
      return;
    }
    
    // First, check for decimal numbers in the text to avoid false sentence detection
    const numberDetectionResult = detectNumbers(text);
    
    // Check if the text ends with an incomplete decimal number
    const trimmedText = text.trim();
    const endsWithIncompleteDecimal = /\b\d+\.$/.test(trimmedText);
    
    // If text ends with incomplete decimal (e.g., "70."), don't trigger sentence detection
    if (endsWithIncompleteDecimal) {
      setDetectionStatus('Listening…');
      return;
    }
    
    // Check if text ends with complete decimal but no sentence punctuation (e.g., "70.46")
    // Only block sentence detection if the decimal is truly at the end with no punctuation
    const endsWithCompleteDecimalOnly = /\b\d+\.\d+$/.test(trimmedText);
    
    if (endsWithCompleteDecimalOnly) {
      // Check if this decimal is at the very end and might be part of ongoing input
      const lastNumber = numberDetectionResult.numbers[numberDetectionResult.numbers.length - 1];
      if (lastNumber && lastNumber.end === trimmedText.length) {
        // The decimal number is at the very end with no punctuation - be cautious
        setDetectionStatus('Listening…');
        return;
      }
    }
    
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
        // But be careful not to split on periods that are part of decimal numbers
        for (let i = cursorPos - 1; i >= 0; i--) {
          if (/[.!?]/.test(fullText[i])) {
            // For periods, check if this is part of a decimal number
            if (fullText[i] === '.') {
              const beforePeriod = fullText.substring(Math.max(0, i - 10), i);
              const afterPeriod = fullText.substring(i + 1, Math.min(fullText.length, i + 10));
              
              // Only skip if it has digits immediately before AND after
              const hasDigitBefore = /\d$/.test(beforePeriod);
              const hasDigitAfter = /^\d/.test(afterPeriod);
              
              if (hasDigitBefore && hasDigitAfter) {
                continue; // Skip this period, it's part of a decimal
              }
            }
            
            sentenceStart = i + 1;
            break;
          }
        }
        
        // Look forwards from cursor to find sentence end (before next sentence ending)
        // Again, be careful about decimal numbers
        for (let i = cursorPos; i < fullText.length; i++) {
          if (/[.!?]/.test(fullText[i])) {
            // For periods, check if this is part of a decimal number
            if (fullText[i] === '.') {
              const beforePeriod = fullText.substring(Math.max(0, i - 10), i);
              const afterPeriod = fullText.substring(i + 1, Math.min(fullText.length, i + 10));
              
              // Only skip if it has digits immediately before AND after
              const hasDigitBefore = /\d$/.test(beforePeriod);
              const hasDigitAfter = /^\d/.test(afterPeriod);
              
              if (hasDigitBefore && hasDigitAfter) {
                continue; // Skip this period, it's part of a decimal
              }
            }
            
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
      // But be careful about decimal numbers
      const endsWithDecimalNumber = /\b\d+\.\d*$/.test(sentenceForAnalysis);
      const endsWithPartialPunctuation = !endsWithDecimalNumber && (/\.$/.test(sentenceForAnalysis) || /\.{1,2}$/.test(sentenceForAnalysis));
      const needsPunctuation = sentenceForAnalysis && 
        !/[.!?…]$/.test(sentenceForAnalysis) && 
        !sentenceForAnalysis.endsWith('...') &&
        !endsWithPartialPunctuation &&
        !endsWithDecimalNumber; // Don't add punctuation if it ends with a decimal number
      
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
      
      // EXTRA PROTECTION: Double-check against recently edited content before processing
      if (recentlyEditedContentRef.current.has(sentenceForAnalysis) || 
          recentlyEditedContentRef.current.has(sentenceKey)) {
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
      HardBreak.configure({
        keepMarks: false,
        HTMLAttributes: {
          class: 'tiptap-hard-break',
        },
      }),
      CompletedSentence,
      Placeholder.configure({
        placeholder: 'Start with a hunch, goal, or observation…',
      }),
    ],
    content: '<p></p>',
    immediatelyRender: false,
    editable: !branchingMode.isActive, // Disable when branching mode is active
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = text.split(/\s+/).filter(Boolean).length;
      const sentences = text.split(/[.!?]+/).filter(line => line.trim().length > 0).length;
      setWordCount(words);
      setSentenceCount(sentences);
      
      // Notify parent of content changes - but NOT when user is editing
      if (text !== previousText && onContentChange && !isEditingRef.current) {
        onContentChange(previousText, text);
      }
      
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
        
        // Handle Enter key with priority logic
        if (event.key === 'Enter') {
          // Disable Enter key - prevent new lines completely
          event.preventDefault();
          return true; // Block the keystroke
        }
        
        // Handle delete key for completed sentences
        if (isInCompletedSentence && (event.key === 'Delete' || event.key === 'Backspace')) {
          // Find the completed sentence element at cursor position
          const completedSentences = document.querySelectorAll('.completed-sentence');
          let currentSentence: HTMLElement | null = null;
          let sentenceStart = -1;
          let sentenceEnd = -1;
          
          for (const sentence of completedSentences) {
            const start = view.posAtDOM(sentence as HTMLElement, 0);
            const end = view.posAtDOM(sentence as HTMLElement, (sentence as HTMLElement).childNodes.length);
            
            if (cursorPos >= start && cursorPos <= end) {
              currentSentence = sentence as HTMLElement;
              sentenceStart = start;
              sentenceEnd = end;
              break;
            }
          }
          
          if (currentSentence && sentenceStart !== -1) {
            // Check if cursor is at the very beginning of the completed sentence
            const isAtBeginning = cursorPos === sentenceStart;
            
            if (isAtBeginning && event.key === 'Backspace') {
              // Check if there's content before this sentence
              const fullText = view.state.doc.textBetween(0, view.state.doc.content.size);
              const textBeforeSentence = fullText.substring(0, sentenceStart).trim();
              
              if (textBeforeSentence.length > 0) {
                // There's content before this sentence, allow normal backspace behavior
                // This will move cursor to the previous line/position
                return false; // Let default behavior handle backspace
              } else {
                // No content before, prevent deletion
                event.preventDefault();
                return true;
              }
            } else if (!isAtBeginning || event.key === 'Delete') {
              // Cursor is in the middle/end of sentence, or Delete key pressed
              // Delete the entire sentence
              
              let extendedEnd = sentenceEnd;
              
              // Extend the deletion range to include punctuation that follows
              const fullText = view.state.doc.textBetween(0, view.state.doc.content.size);
              
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
              
              
              event.preventDefault();
              return true;
            }
          }
        }
        
        // If cursor is in a completed sentence and we're not in editing mode, block typing (except Enter)
        if (isInCompletedSentence && !isEditingRef.current) {
          event.preventDefault();
          return true; // Block the keystroke
        }
        
        // Log cursor position when in editing mode for debugging
        if (isEditingRef.current) {
          const cursorPos = view.state.selection.from;
          
          if (editingTimeoutRef.current) {
            clearTimeout(editingTimeoutRef.current);
          }
          editingTimeoutRef.current = setTimeout(() => {
            if (isEditingRef.current) {
              isEditingRef.current = false;
              setIsEditingState(false);
              setEditingPosition(null);
              editingTimeoutRef.current = null;
            }
          }, 10000); // 10 seconds after last keystroke
          
          // If user was editing and presses Escape, handle it
          if (event.key === 'Escape') {
            isEditingRef.current = false;
            setIsEditingState(false);
            setEditingPosition(null);
            if (editingTimeoutRef.current) {
              clearTimeout(editingTimeoutRef.current);
              editingTimeoutRef.current = null;
            }
            event.preventDefault();
            return true;
          }
        }
        
        // Allow all other keys to work normally, including Enter for new lines
        return false; // Let default behavior handle all keys
      },
      handleClick: (view, pos, event) => {
        // Don't handle clicks if interactions are disabled
        if (disableInteractions) {
          return false;
        }
        
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
            
            
            // Find the position at the start of this sentence
            const sentenceStartPos = view.posAtDOM(sentence, 0);
            
            // Position cursor before this sentence
            editor?.commands.setTextSelection(sentenceStartPos);
            editor?.commands.focus();
            
            event.preventDefault();
            return true;
          }
        }
        
        // Check if clicked on a completed sentence (with reduced sensitivity - 10px margin from left/right)
        if (target.closest('.completed-sentence')) {
          const sentenceElement = target.closest('.completed-sentence') as HTMLElement;
          const sentenceRect = sentenceElement.getBoundingClientRect();
          const clickX = event.clientX;
          const clickY = event.clientY;
          
          // Check if click is within the sentence bounds but excluding 10px margin from left and right
          const isWithinReducedArea = clickX >= sentenceRect.left + 10 && 
                                     clickX <= sentenceRect.right - 10 && 
                                     clickY >= sentenceRect.top && 
                                     clickY <= sentenceRect.bottom;
          
          if (!isWithinReducedArea) {
            // Click is in the margin area, don't handle it as a sentence click
            return false;
          }
          
          
          // Clear any existing click timeout
          if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
          }
          
          // Set a timeout to handle the click - this will be cancelled if a double-click occurs
          clickTimeoutRef.current = setTimeout(() => {
            // Get the position of the clicked sentence
            const position = view.posAtDOM(sentenceElement, 0);
            const endPosition = view.posAtDOM(sentenceElement, sentenceElement.childNodes.length);
            
          
            
            // Check if this is the same sentence that's already selected
            if (selectedSentence && selectedSentence.element === sentenceElement) {
              // Same sentence clicked - do nothing, keep it selected
              return;
            }
            
            // Different sentence clicked - transfer selection
            if (selectedSentence && selectedSentence.element !== sentenceElement) {
              // Remove selection from previous sentence
              const previousSentenceText = selectedSentence.element.textContent?.trim();
              selectedSentence.element.removeAttribute('data-selected');
        
            }
            
            // Get sentence content and ID
            const sentenceContent = sentenceElement.textContent?.trim() || '';
            let sentenceId: string | null = null;
            
            // Find the sentence ID using the same logic as in double-click
            if (findNodeIdByContent && sentenceContent) {
              sentenceId = findNodeIdByContent(sentenceContent);
            }
            
            if (!sentenceId && getBranchesForSentence && sentenceContent) {
              const branches = getBranchesForSentence(sentenceContent);
              if (branches.length > 0) {
                sentenceId = branches[0].id; // Use the first branch's ID
              }
            }
            
            
            // Set the selected sentence and show dropdown
            setSelectedSentence({ 
              element: sentenceElement, 
              position: { from: position, to: endPosition },
              sentenceId: sentenceId
            });
            
            // Calculate dropdown position at the end of the sentence
            const sentenceRect = sentenceElement.getBoundingClientRect();
            setDropdownPosition({
              left: sentenceRect.right + 8, // 8px gap from sentence end
              top: sentenceRect.top
            });
            
            // Add selected styling to the new sentence AFTER state updates to avoid re-render clearing it
            setTimeout(() => {
              // Double-check that this is still the selected sentence before applying styling
              const currentSelectedText = sentenceElement.textContent?.trim();
              sentenceElement.setAttribute('data-selected', 'true');
            
            }, 0); // Set on next tick to ensure all React state updates are processed first
            clickTimeoutRef.current = null;
          }, 200); // 200ms delay to allow double-click to cancel
          
          event.preventDefault();
          event.stopPropagation(); // Prevent global click handler from interfering
          return true;
        }
        
        // Check if clicked on the dropdown menu
        if (target.closest('.sentence-dropdown')) {
          // Don't clear dropdown if clicking on the dropdown itself
          return false;
        }
        
        // Note: Global click handler now manages dropdown clearing for clicks outside editor
        
        // Only clear editing mode if clicked outside the editor content area
        if (isEditingRef.current) {
          const isInsideEditor = (event.target as HTMLElement)?.closest('.narrative-editor');
          if (!isInsideEditor) {
            isEditingRef.current = false;
            setIsEditingState(false);
            setEditingPosition(null);
            if (editingTimeoutRef.current) {
              clearTimeout(editingTimeoutRef.current);
              editingTimeoutRef.current = null;
            }
          } else {
          }
        }
        
        return false;
      },
      handleDoubleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;
        
        // Check if double-clicked on a completed sentence (with reduced sensitivity - 10px margin from left/right)
        if (target.closest('.completed-sentence')) {
          const sentenceElement = target.closest('.completed-sentence') as HTMLElement;
          const sentenceRect = sentenceElement.getBoundingClientRect();
          const clickX = event.clientX;
          const clickY = event.clientY;
          
          // Check if double-click is within the sentence bounds but excluding 10px margin from left and right
          const isWithinReducedArea = clickX >= sentenceRect.left + 20 && 
                                     clickX <= sentenceRect.right - 20 && 
                                     clickY >= sentenceRect.top && 
                                     clickY <= sentenceRect.bottom;
          
          if (!isWithinReducedArea) {
            // Double-click is in the margin area, don't handle it as a sentence double-click
            return false;
          }
          
          
          // Cancel any pending click timeout to prevent dropdown from showing
          if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
          }
          
          // Clear any existing dropdown/selection from previous clicks using our helper function
          clearAllSelectedSentences();
          
          // Clear any existing timeout
          if (editingTimeoutRef.current) {
            clearTimeout(editingTimeoutRef.current);
          }
          
          // Get the sentence content and immediately log the node ID
          const sentenceContent = sentenceElement.textContent?.trim() || '';
          
          // Find and log the sentence node ID immediately upon double-click
          let nodeId: string | null = null;
          
          if (findNodeIdByContent && sentenceContent) {
            nodeId = findNodeIdByContent(sentenceContent);
          } else {
          }
          
          if (!nodeId && getBranchesForSentence && sentenceContent) {
            // Fallback method
            const branches = getBranchesForSentence(sentenceContent);
            const matchingBranch = branches.find(b => b.content === sentenceContent);
            if (matchingBranch) {
              nodeId = matchingBranch.id;
            } else {
            }
          }
          
          if (!nodeId) {
          }
          
          // Store the node ID for later use in editing
          setEditingNodeId(nodeId);
          
          // Set editing flag to prevent re-marking during editing
          isEditingRef.current = true;
          setIsEditingState(true);
          
          // Get the position of the clicked element
          const position = view.posAtDOM(sentenceElement, 0);
          const endPosition = view.posAtDOM(sentenceElement, sentenceElement.childNodes.length);
          
          // Store the editing position for the save button
          setEditingPosition({ from: position, to: endPosition });
          
          // Store original content for later comparison when saving
          setOriginalEditingContent(sentenceContent);
          
          // Notify parent to enter edit mode
          if (onEnterEditMode && sentenceContent) {
            onEnterEditMode(sentenceContent);
          }
          
          
          // Select the sentence text using setTextSelection
          editor?.commands.setTextSelection({ from: position, to: endPosition });
          
          // Remove the completed sentence mark to allow editing
          editor?.commands.unmarkCompletedSentence();
          
          
          // Set a timeout to disable editing mode after 10 seconds of inactivity
          editingTimeoutRef.current = setTimeout(() => {
            if (isEditingRef.current) {
              isEditingRef.current = false;
              setIsEditingState(false);
              setEditingPosition(null);
              editingTimeoutRef.current = null;
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
          }
          
          return false;
        },
        mouseout: (view, event) => {
          const target = event.target as HTMLElement;
          
          // Check if leaving a completed sentence
          if (target.closest('.completed-sentence')) {
            const sentenceElement = target.closest('.completed-sentence') as HTMLElement;
          }
          
          return false;
        },
      },
    },
  });
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getFullText: () => {
      return editor?.getText() || '';
    },
    getCurrentSentence: () => {
      if (!editor) return '';
      
      const cursorPos = editor.state.selection.from;
      const fullText = editor.getText();
      
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
      return fullText.substring(sentenceStart, sentenceEnd).trim();
    },
    updateContent: (newContent: string) => {
      // Don't update content if user is actively editing
      if (isEditingRef.current) {
        return;
      }
      
      if (editor) {
        editor.commands.setContent(`<p>${newContent}</p>`);
      }
    },
    showSuggestion: (suggestion: NarrativeSuggestion) => {
      setCurrentSuggestion(suggestion);
      setIsLoadingSuggestion(false);
      if (onSuggestionReceived) {
        onSuggestionReceived(suggestion);
      }
    },
    clearSuggestion: () => {
      setCurrentSuggestion(null);
      setSuggestionPosition(null);
      setIsLoadingSuggestion(false);
    },
    showLoadingSuggestion: () => {
      setIsLoadingSuggestion(true);
      setCurrentSuggestion(null);
    },
    hideLoadingSuggestion: () => {
      setIsLoadingSuggestion(false);
    },
    hasPendingSuggestion: () => {
      return isLoadingSuggestion || (currentSuggestion !== null && currentSuggestion.narrative_suggestion !== null);
    },
    highlightSentence: (sentenceContent: string) => {
      if (!editor) {
        console.log('❌ Timeline → Narrative: No editor available');
        return false;
      }
      
      // Clear any existing selections first
      clearAllSelectedSentences();
      
      // Find all completed sentences in the editor
      const editorElement = editor.view.dom;
      const completedSentences = editorElement.querySelectorAll('.completed-sentence');
      
      console.log(`🔍 Timeline → Narrative: Looking for sentence in ${completedSentences.length} completed sentences`);
      console.log('🎯 Target sentence:', `"${sentenceContent}"`);
      
      // Normalize the target content for comparison
      const normalizeText = (text: string) => {
        return text
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/[.!?]+$/, '') // Remove trailing punctuation
          .trim()
          .toLowerCase(); // Convert to lowercase for case-insensitive comparison
      };
      const normalizedTarget = normalizeText(sentenceContent);
      
      // Look for a sentence that matches the content
      for (let i = 0; i < completedSentences.length; i++) {
        const sentenceElement = completedSentences[i] as HTMLElement;
        const elementContent = sentenceElement.textContent?.trim();
        const normalizedContent = normalizeText(elementContent || '');
        
        console.log(`📝 Sentence ${i + 1}:`, `"${elementContent}"`);
        console.log(`📝 Normalized ${i + 1}:`, `"${normalizedContent}"`);
        
        // Debug exact character comparison
        if (i === 1) { // Check the second sentence specifically
          console.log('🔍 Target length:', normalizedTarget.length);
          console.log('🔍 Content length:', normalizedContent.length);
          console.log('🔍 Target chars:', normalizedTarget.split('').map(c => c.charCodeAt(0)));
          console.log('🔍 Content chars:', normalizedContent.split('').map(c => c.charCodeAt(0)));
          console.log('🔍 Strings equal?', normalizedContent === normalizedTarget);
        }
        
        if (normalizedContent === normalizedTarget) {
          // Found the matching sentence - highlight it
          sentenceElement.setAttribute('data-selected', 'true');
          
          // Also set the internal state to maintain the selection
          const position = editor.view.posAtDOM(sentenceElement, 0);
          const endPosition = editor.view.posAtDOM(sentenceElement, sentenceElement.childNodes.length);
          
          setSelectedSentence({
            element: sentenceElement,
            position: {
              from: position,
              to: endPosition
            },
            sentenceId: null // We don't have the ID in this context
          });
          
          console.log('✅ Timeline → Narrative: Found matching sentence, applying highlight');
          console.log('🎨 Applied data-selected="true" to element:', sentenceElement);
          console.log('📍 Updated selectedSentence state to maintain highlighting');
          
          // Scroll the sentence into view
          sentenceElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
          
          console.log('🎯 Timeline → Narrative: Highlighted sentence:', sentenceContent.substring(0, 50) + '...');
          return true;
        }
      }
      
      console.log('❌ Timeline → Narrative: Could not find matching sentence');
      console.log('🔍 Available sentences:');
      for (let i = 0; i < completedSentences.length; i++) {
        const element = completedSentences[i] as HTMLElement;
        console.log(`   ${i + 1}. "${element.textContent?.trim()}"`);
      }
      return false;
    }
  }), [editor, onSuggestionReceived, isLoadingSuggestion, currentSuggestion]);
  
  // Helper function to update sentence node on edit
  const updateSentenceNodeOnEdit = useCallback((nodeId: string | null, originalContent: string, editedContent: string) => {
    
    // PRIORITY 1: Use the currentEditSentenceId if available (from double-click)
    let targetNodeId: string | null = currentEditSentenceId || nodeId;
    
    if (currentEditSentenceId) {
    } else if (nodeId) {
    } else {
      
      if (findNodeIdByContent) {
      targetNodeId = findNodeIdByContent(originalContent);
    } else {
      // console.warn(`⚠️ findNodeIdByContent not available, using fallback method`);
      // Fallback to the old method if findNodeIdByContent is not available
      if (getBranchesForSentence) {
        const branches = getBranchesForSentence(originalContent);
        // console.log(`📝 Fallback - Available branches for "${originalContent}":`, branches.map(b => ({ id: b.id, content: b.content })));
        const matchingBranch = branches.find(b => b.content === originalContent);
        if (matchingBranch) {
          targetNodeId = matchingBranch.id;
          // console.log(`📝 Fallback - Found matching branch ID: ${targetNodeId}`);
        } else {
          // console.error(`❌ Fallback - No matching branch found for content: "${originalContent}"`);
        }
      }
    }
    }
    
    if (targetNodeId && updateSentenceNodeContent) {
      
      // Call the new update function
      const success = updateSentenceNodeContent(targetNodeId, editedContent);
      if (success) {
        
      } else {

      }
      
    }
  }, [updateSentenceNodeContent, currentEditSentenceId, findNodeIdByContent, getBranchesForSentence]);

  // Function to save/finish editing a sentence
  const finishEditingSentence = useCallback(() => {
    if (isEditingRef.current && editor && originalEditingContent) {
      
      // Get the edited content from the current selection or by finding the original content
      let editedContent = '';
      
      // Method 1: Try to get content from current selection (if user selected text)
      const selection = editor.state.selection;
      if (!selection.empty) {
        editedContent = editor.state.doc.textBetween(selection.from, selection.to).trim();
        console.log(`💾 SAVE: Using selected content: "${editedContent}"`);
      } else {
        // Method 2: Get ALL editor text and find what replaced the original content
        const fullText = editor.getText();
        console.log(`💾 SAVE: Full editor text: "${fullText}"`);
        console.log(`💾 SAVE: Original editing content: "${originalEditingContent}"`);
        
        // Find the original content in the full text and get the new version
        // Since the original content might have been modified, we need to be smart about this
        
        // Simple approach: if there's only one sentence, use the full text
        const sentences = fullText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
        console.log(`💾 SAVE: Found ${sentences.length} sentences:`, sentences);
        
        if (sentences.length === 1) {
          // Only one sentence, use it
          editedContent = sentences[0];
          console.log(`💾 SAVE: Single sentence detected: "${editedContent}"`);
        } else {
          // Multiple sentences - find the one that's most similar to originalEditingContent
          // or find the one that contains the editing changes
          let bestMatch = sentences[0];
          let maxSimilarity = 0;
          
          const originalClean = originalEditingContent.replace(/[.!?]+$/, '').trim();
          
          for (const sentence of sentences) {
            // Check if this sentence contains most of the original content
            const commonLength = Math.min(sentence.length, originalClean.length);
            let similarity = 0;
            for (let i = 0; i < commonLength; i++) {
              if (sentence[i] === originalClean[i]) similarity++;
            }
            const similarityRatio = similarity / Math.max(sentence.length, originalClean.length);
            
            console.log(`💾 SAVE: Sentence "${sentence}" similarity to original: ${similarityRatio}`);
            
            if (similarityRatio > maxSimilarity) {
              maxSimilarity = similarityRatio;
              bestMatch = sentence;
            }
          }
          
          editedContent = bestMatch;
          console.log(`💾 SAVE: Best match selected: "${editedContent}" (similarity: ${maxSimilarity})`);
        }
      }
      

      
      // If content changed, IMMEDIATELY block it from being processed as a new sentence
      if (editedContent !== originalEditingContent) {
        // CRITICAL: Block the edited content IMMEDIATELY to prevent sentence detection
        recentlyEditedContentRef.current.add(originalEditingContent);
        recentlyEditedContentRef.current.add(editedContent);
        
        // Also block the normalized version
        const normalizedEditedContent = editedContent
          .toLowerCase()
          .replace(/[.!?]+$/, '')
          .replace(/\s+/g, ' ')
          .trim();
        recentlyEditedContentRef.current.add(normalizedEditedContent);
        
        updateSentenceNodeOnEdit(editingNodeId, originalEditingContent, editedContent);
        
        // Keep tracking the blocked content for a while to ensure no duplicate processing
        setTimeout(() => {
          recentlyEditedContentRef.current.delete(originalEditingContent);
          recentlyEditedContentRef.current.delete(editedContent);
          recentlyEditedContentRef.current.delete(normalizedEditedContent);
        }, 5000);
        
        // Notify parent to exit edit mode for the original content
        if (onExitEditMode) {
          onExitEditMode(originalEditingContent);
        }
      } else {
        // Content didn't change, still notify parent to exit edit mode
        if (onExitEditMode && originalEditingContent) {
          onExitEditMode(originalEditingContent);
        }
      }
      
      // Clear editing position, original content, and node ID
      setEditingPosition(null);
      setOriginalEditingContent(null);
      setEditingNodeId(null);
      
      // Clear timeout
      if (editingTimeoutRef.current) {
        clearTimeout(editingTimeoutRef.current);
        editingTimeoutRef.current = null;
      }
      
      // Re-mark completed sentences after a brief delay, but AFTER clearing editing state
      setTimeout(() => {
        // NOW clear the editing state after content update is complete
        isEditingRef.current = false;
        setIsEditingState(false);
        
        // Then do the re-marking
        markCompletedSentencesProactively(editor);
        // Also add insertion areas after re-marking
        setTimeout(() => {
          addInsertionAreasBetweenSentences(editor);
        }, 100);
      }, 200); // Longer delay to ensure content update is processed
    }
  }, [editor, editingPosition, originalEditingContent, markCompletedSentencesProactively, addInsertionAreasBetweenSentences, updateSentenceNodeOnEdit, onExitEditMode]);

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
      
    } catch (error) {
    }
  }, [editingPosition, editor]);

  // Helper function to clear all previously selected sentences
  const clearAllSelectedSentences = useCallback(() => {
    // Clear any existing selected sentence from state
    if (selectedSentence) {
      selectedSentence.element.removeAttribute('data-selected');
      setSelectedSentence(null);
      setDropdownPosition(null);
    }
    
    // Also clear any other sentences that might have data-selected="true" in the DOM
    const editorElement = document.querySelector('.narrative-editor-content');
    if (editorElement) {
      const allSelectedSentences = editorElement.querySelectorAll('.completed-sentence[data-selected="true"]');
      allSelectedSentences.forEach(sentence => {
        sentence.removeAttribute('data-selected');
      });
    }
    
    // console.log('🧹 Cleared all selected sentences to ensure only one can be selected at a time');
  }, [selectedSentence]);

  // Undo system functions
  const addToUndoStack = useCallback((action: {
    type: 'delete_sentence' | 'delete_branch';
    timestamp: number;
    deletedContent: string;
    deletedBranchId?: string; // For branch deletions
    context: any;
  }) => {
    setUndoStack(prev => [...prev, action]);
    setShowUndoButton(true);
    
    // Clear any existing timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    // Hide undo button after 10 seconds
    undoTimeoutRef.current = setTimeout(() => {
      setShowUndoButton(false);
    }, 10000);

  }, []);

  const handleUndoDeletion = useCallback(() => {
    if (undoStack.length === 0) return;
    
    const lastAction = undoStack[undoStack.length - 1];
    
    // For now, we'll show an alert. In a full implementation, we'd restore the tree state
    // This requires collaboration with the parent component to restore sentence nodes
    alert(`Undo feature will restore: "${lastAction.deletedContent}"\n\nThis feature needs to be implemented with parent component collaboration.`);
    
    // Remove the action from stack
    setUndoStack(prev => prev.slice(0, -1));
    
    // Hide undo button if stack is empty
    if (undoStack.length <= 1) {
      setShowUndoButton(false);
    }
  }, [undoStack]);

  // Enhanced branching functions
  const createBranchEditor = useCallback((content: string, elementId: string, isReadOnly: boolean = false) => {
    const branchEditor = new Editor({
      element: document.getElementById(elementId),
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
        Placeholder.configure({
          placeholder: isReadOnly ? 'This shows the full path content...' : 'Type your alternative...',
        }),
      ],
      content: content ? `<p>${content}</p>` : '<p></p>', // Use empty content if none provided
      editable: !isReadOnly, // Make read-only if specified
      // Removed onUpdate - no real-time tracking, only check when save button is clicked
      editorProps: {
        attributes: {
          class: `branch-editor-content ${isReadOnly ? 'read-only' : ''}`,
          'data-gramm': 'false',
          'data-gramm_editor': 'false',
          'data-enable-grammarly': 'false',
          spellcheck: 'false',
        },
      },
    });
    return branchEditor;
  }, []);

  const handleSelectBranch = useCallback((selectedBranch: any) => {
    
    if (selectedBranch.isNew) {
      // This is a new draft branch - get content from editor and create it
      const branchContent = selectedBranch.editor.getText().trim();
      
      // Check if content is empty or just placeholder text
      const hasActualContent = branchContent && 
        branchContent !== 'Type your alternative...' && 
        branchContent.length > 0;
      
      if (onCreateBranch && hasActualContent) {

        
        onCreateBranch(branchingMode.parentSentence, branchContent);
        
        
        // Add a delay to check tree state after branch creation
        setTimeout(() => {
          if (getBranchesForSentence) {
            const branches = getBranchesForSentence(branchingMode.parentSentence);
          }
        }, 500);
        
        // Note: handleCreateBranch now handles switching to the new branch and updating the editor
      } else if (!hasActualContent) {
        console.warn('⚠️ Cannot save empty branch content');
        return; // Don't proceed if content is empty or placeholder
      }
    } else {
      // This is an existing branch with full path content - just switch to it
      if (onSwitchToBranch) {
        onSwitchToBranch(selectedBranch.id);
      }
    }
    
    // Exit branching mode
    setBranchingMode(prev => ({ 
      ...prev, 
      isActive: false, 
      isDraft: false, 
      branches: [],
      position: undefined
    }));
    
    // Clear dropdown and sentence selection when exiting branching mode
    clearAllSelectedSentences();
  }, [onCreateBranch, onSwitchToBranch, branchingMode.parentSentence, selectedSentence]);

  const handleAddNewAlternative = useCallback(() => {
    const newBranchId = `draft-branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setBranchingMode(prev => ({
      ...prev,
      isDraft: true, // Enable draft mode when adding new alternatives
      branches: [
        ...prev.branches,
        {
          id: newBranchId,
          content: '',
          originalContent: '',
          type: 'alternative',
          editor: null, // Will be created after DOM update
          isNew: true // This is a new draft branch
        }
      ]
    }));
    
    // Create editor after DOM update
    setTimeout(() => {
      const editorElement = document.getElementById(`branch-editor-${newBranchId}`);
      if (editorElement) {
        // New alternatives should be editable, not read-only
        const newEditor = createBranchEditor('', `branch-editor-${newBranchId}`, false); // false = editable
        setBranchingMode(prev => ({
          ...prev,
          branches: prev.branches.map(branch => 
            branch.id === newBranchId 
              ? { ...branch, editor: newEditor }
              : branch
          )
        }));
      }
    }, 100);
  }, [createBranchEditor]);

  const initializeBranchingMode = useCallback((parentSentence: string, availableBranches: any[]) => {
    
    const branches = availableBranches.map((branch, index) => ({
      id: branch.id,
      content: branch.fullPathContent, // Use full path content instead of just immediate content
      originalContent: branch.fullPathContent, // Store original full path content for comparison when saving
      type: (branch.type === 'original_continuation' ? 'original' : 'alternative') as 'original' | 'alternative',
      editor: null, // Will be created after DOM update
      isNew: false // Existing branches are not new
    }));
    
    setBranchingMode({
      isActive: true,
      isDraft: false, // Existing branches are not drafts
      parentSentence,
      branches,
      insertPosition: 0, // Will be calculated based on sentence position
      position: undefined // Will be set when positioning is needed
    });
    
    // Create editors after DOM update
    setTimeout(() => {
      branches.forEach(branch => {
        const editorElement = document.getElementById(`branch-editor-${branch.id}`);
        if (editorElement) {
          // Existing branches with full path content should be read-only for preview
          const isReadOnly = !branch.isNew;
          const branchEditor = createBranchEditor(branch.content, `branch-editor-${branch.id}`, isReadOnly);
          setBranchingMode(prev => ({
            ...prev,
            branches: prev.branches.map(b => 
              b.id === branch.id 
                ? { ...b, editor: branchEditor }
                : b
            )
          }));
        }
      });
    }, 100);
  }, [createBranchEditor]);

  // Function to handle dropdown actions
  const handleDropdownAction = useCallback(async (action: string, event?: React.MouseEvent) => {
    // Prevent event bubbling to avoid clearing the dropdown
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    if (!selectedSentence) return;
    
    
    // Clear selection after action (except for branch action which keeps sentence highlighted)
    if (action !== 'branch') {
      clearAllSelectedSentences();
    }
    
    // Handle different actions
    switch (action) {
      case 'show-view':
        const validationSentenceText = selectedSentence.element.textContent?.trim() || '';
        
        // If we're in an example scenario, don't call LLM - just trigger the callback directly
        if (isExampleScenario) {
          console.log('🎯 Example scenario: Showing view for sentence without LLM validation');
          
          // Find sentence ID if possible (look for data attributes or other identifiers)
          const sentenceElement = selectedSentence.element;
          let sentenceId: string | undefined;
          
          // Try to extract sentence ID from various possible sources
          if (sentenceElement.hasAttribute('data-sentence-id')) {
            sentenceId = sentenceElement.getAttribute('data-sentence-id') || undefined;
          } else {
            // Try to extract from sentence content - look for sentence number patterns
            const sentenceMatch = validationSentenceText.match(/sentence\s*#?(\d+)/i);
            if (sentenceMatch) {
              sentenceId = sentenceMatch[1];
            } else {
              // Try to find the sentence index in the document
              const allSentences = Array.from(selectedSentence.element.parentElement?.querySelectorAll('.completed-sentence, p, .sentence') || []);
              const sentenceIndex = allSentences.indexOf(sentenceElement);
              if (sentenceIndex >= 0) {
                sentenceId = (sentenceIndex + 1).toString(); // 1-based indexing
              }
            }
          }
          
          // Call the callback with shouldGenerateIfMissing flag for example scenarios
          if (onShowViewForSentence) {
            onShowViewForSentence(validationSentenceText, sentenceId, true); // true = shouldGenerateIfMissing
          }
          
          break;
        }
        
        // Regular flow for non-example scenarios - validate domain scope for the selected sentence
        validateDomain(validationSentenceText)
          .then(domainValidationResult => {
            if (domainValidationResult.success && domainValidationResult.validation) {
              const validation = domainValidationResult.validation;
              
              // Use the callback to show validation in view canvas instead
              if (onGenerateVisualization) {
                onGenerateVisualization(validationSentenceText, validation);
              }
              
            } else {
              console.warn('⚠️ Domain validation failed:', domainValidationResult.error);
              // Show error through callback
              if (onGenerateVisualization) {
                onGenerateVisualization(validationSentenceText, {
                  is_data_driven_question: false,
                  inquiry_supported: false,
                  matched_dataset: [],
                  matched_columns: {},
                  explanation: 'Unable to validate this sentence. Please try again.'
                });
              }
            }
          })
          .catch(error => {
            console.error('❌ Domain validation error:', error);
            // Show error through callback
            if (onGenerateVisualization) {
              onGenerateVisualization(validationSentenceText, {
                is_data_driven_question: false,
                inquiry_supported: false,
                matched_dataset: [],
                matched_columns: {},
                explanation: 'Error validating sentence. Please try again.'
              });
            }
          });
        break;
      case 'branch':
        // console.log('🌿 Creating draft branch from sentence:', selectedSentence.element.textContent);
        
        if (selectedSentence.element.textContent) {
          const parentText = selectedSentence.element.textContent.trim();
          
          // Get existing branches to calculate correct numbering
          const existingBranches = getBranchesForSentence ? getBranchesForSentence(parentText) : [];
          
          // Create a draft branch that's not yet committed to tree structure
          const draftBranchId = `draft-branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Calculate position to show branch section right below the selected sentence
          const sentenceElement = selectedSentence.element;
          const sentenceRect = sentenceElement.getBoundingClientRect();
          const editorElement = document.querySelector('.narrative-editor');
          const editorRect = editorElement?.getBoundingClientRect();
          
          // Calculate position relative to the editor container
          const branchPosition = editorRect ? {
            left: sentenceRect.left - editorRect.left,
            top: sentenceRect.bottom - editorRect.top + 10 // 10px gap below sentence
          } : { left: 0, top: 0 };
          
          // Include existing branches for correct numbering, but mark only the new one as visible
          const draftBranches = [
            // Include existing branches (hidden during draft mode)
            ...existingBranches.map(branch => ({
              id: branch.id,
              content: branch.fullPathContent || branch.content,
              originalContent: branch.fullPathContent || branch.content,
              type: (branch.type === 'original_continuation' ? 'original' : 'alternative') as 'original' | 'alternative',
              editor: null,
              isNew: false
            })),
            // Add the new branch
            {
              id: draftBranchId,
              content: '',
              originalContent: '',
              type: 'alternative' as 'alternative',
              editor: null,
              isNew: true // This is a new draft branch
            }
          ];
          
          // Initialize draft branching mode with position
          setBranchingMode({
            isActive: true,
            isDraft: true, // This is draft mode
            parentSentence: parentText,
            branches: draftBranches,
            insertPosition: 0,
            position: branchPosition
          });
          
          // Keep the sentence highlighted and close only the dropdown
          setDropdownPosition(null); // Close dropdown but keep sentence selected
          
          // Create editors after DOM update (only for the new branch)
          setTimeout(() => {
            const newBranch = draftBranches.find(b => b.isNew);
            if (newBranch) {
              const editorElement = document.getElementById(`branch-editor-${newBranch.id}`);
              if (editorElement) {
                // New branches are editable
                const branchEditor = createBranchEditor(newBranch.content, `branch-editor-${newBranch.id}`, false);
                setBranchingMode(prev => ({
                  ...prev,
                  branches: prev.branches.map(b => 
                    b.id === newBranch.id 
                      ? { ...b, editor: branchEditor }
                      : b
                  )
                }));
              }
            }
          }, 100);
          
        }
        break;
      case 'add-next':
        // Insert a new sentence node after the selected sentence
        if (selectedSentence && onInsertNodeAfter) {
          const selectedSentenceContent = selectedSentence.element.textContent?.trim();
          
          if (!selectedSentenceContent) {
            console.error('❌ Cannot add next: no sentence content found');
            break;
          }
          
          // Set up the inline editor state for "add next" instead of immediately inserting
          
          // Get the sentence ID for the selected sentence
          const selectedSentenceId = findNodeIdByContent ? findNodeIdByContent(selectedSentenceContent) : null;
          
          setAddNextMode({
            isActive: true,
            afterSentenceContent: selectedSentenceContent,
            afterSentenceId: selectedSentenceId,
            position: dropdownPosition || { left: 0, top: 0 }
          });
          
          // console.log(`✏️ Showing inline editor to add sentence after "${selectedSentenceContent}"`);
          
          // Clear the dropdown
          clearAllSelectedSentences();
          
          // Don't insert into tree yet - wait for user input
          return; // Exit early so we don't execute the tree insertion below
        } else {
        }
        break;
      case 'delete':
        
        // Use the stored sentence ID instead of content matching
        const sentenceIdToDelete = selectedSentence.sentenceId;
        const sentenceContentForUndo = selectedSentence.element.textContent?.trim();
        
        
        if (sentenceIdToDelete && onDeleteSentence) {
          
          // Add to undo stack before deletion
          addToUndoStack({
            type: 'delete_sentence',
            timestamp: Date.now(),
            deletedContent: sentenceContentForUndo || '',
            context: {
              sentencePosition: selectedSentence.position,
              sentenceId: sentenceIdToDelete
            }
          });
          
          onDeleteSentence(sentenceIdToDelete);
          
        }
        break;
    }
  }, [selectedSentence, editor, onDeleteSentence]);
  
  // Handle suggestion acceptance
  const handleAcceptSuggestion = useCallback((suggestionText: string) => {
    if (!editor || !currentSuggestion) return;
    
    
    // Get current cursor position
    const cursorPos = editor.state.selection.from;
    
    // Insert the suggestion text at the cursor position
    editor.commands.focus();
    editor.commands.insertContent(' ' + suggestionText);
    
    // Clear the suggestion
    setCurrentSuggestion(null);
    setSuggestionPosition(null);
    
    // Notify parent that suggestion was resolved
    onSuggestionResolved?.();
    
    // Log the acceptance
  }, [editor, currentSuggestion, onSuggestionResolved]);
  
  // Handle suggestion denial
  const handleDenySuggestion = useCallback(() => {
    setCurrentSuggestion(null);
    setSuggestionPosition(null);
    
    // Notify parent that suggestion was resolved
    onSuggestionResolved?.();
  }, [onSuggestionResolved]);
  
  // Handle saving the "add next" inline editor content
  const handleSaveAddNext = useCallback((newSentenceContent: string) => {
    
    if (!addNextMode || !onInsertNodeAfter) {
      return;
    }
    
    const trimmedContent = newSentenceContent.trim();
    if (!trimmedContent) {
      return;
    }
    
    
    // Split content into sentences using a more robust approach
    const sentences: string[] = [];
    
    // Use regex to split but keep the delimiters
    const sentencePattern = /([.!?]+)/g;
    const parts = trimmedContent.split(sentencePattern);
    
    // Reconstruct sentences by combining text with their delimiters
    for (let i = 0; i < parts.length; i += 2) {
      const text = parts[i]?.trim();
      const delimiter = parts[i + 1] || '';
      
      if (text) {
        sentences.push(text + delimiter);
      }
    }
    
    // If no delimiters were found, treat the entire content as one sentence
    if (sentences.length === 0) {
      sentences.push(trimmedContent);
    }
    
    
    if (sentences.length === 0) {
      return;
    }
    
    // Insert sentences sequentially
    let currentParent = addNextMode.afterSentenceContent;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      
      // Use the sentence ID if available, fallback to content matching
      if (addNextMode.afterSentenceId && i === 0) {
        // For the first sentence, we have the ID of the original sentence
        onInsertNodeAfter(addNextMode.afterSentenceId, sentence, true); // true indicates ID-based call
      } else {
        // For subsequent sentences or if no ID available, use content matching
        onInsertNodeAfter(currentParent, sentence, false); // false indicates content-based call
      }
      
      
      // The next sentence will be inserted after this one
      currentParent = sentence;
    }
    
    // Clear the add next mode
    setAddNextMode(null);
    
  }, [addNextMode, onInsertNodeAfter]);
  
  // Handle canceling the "add next" inline editor
  const handleCancelAddNext = useCallback(() => {
    setAddNextMode(null);
  }, []);
  
  // Add global click listener to handle clicks outside the editor
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (target.closest('.completed-sentence')) {
        const sentenceElement = target.closest('.completed-sentence') as HTMLElement;
        const sentenceRect = sentenceElement.getBoundingClientRect();
        const clickX = event.clientX;
        const clickY = event.clientY;
        
        // Check if click is within the sentence bounds but excluding 10px margin from left and right
        const isWithinReducedArea = clickX >= sentenceRect.left + 10 && 
                                   clickX <= sentenceRect.right - 10 && 
                                   clickY >= sentenceRect.top && 
                                   clickY <= sentenceRect.bottom;
        
        
        if (isWithinReducedArea) {
          // Click is within the active area, don't clear selection
          return;
        } else {
        }
      }
      
      // Don't clear if clicking on dropdown
      if (target.closest('.sentence-dropdown')) {
        // console.log('🎯 Click on dropdown - keeping selection');
        return;
      }
      
      // Don't clear if clicking on add-next editor
      if (target.closest('.add-next-editor')) {
        // console.log('✏️ Click on add-next editor - keeping editor open');
        return;
      }
      
      // Don't clear if clicking on branch section
      if (target.closest('.branch-section')) {
        // console.log('🌿 Click on branch section - keeping sentence highlighted');
        return;
      }
      
      // Clear add-next editor if clicking outside
      if (addNextMode) {
        // console.log('❌ Global click clearing add-next editor');
        setAddNextMode(null);
      }
      
      // Clear dropdown and selection if clicked anywhere else (including sentence margins)
      if (selectedSentence) {
        // console.log('🧹 Global click clearing selection');
        clearAllSelectedSentences();
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
  }, [selectedSentence, addNextMode, clearAllSelectedSentences]);

  // Cleanup branch editors on unmount
  useEffect(() => {
    return () => {
      // Destroy all branch editors when component unmounts
      branchingMode.branches.forEach(branch => {
        if (branch.editor) {
          branch.editor.destroy();
        }
      });
    };
  }, [branchingMode.branches]);

  // Update main editor editable state when branching mode changes
  useEffect(() => {
    if (editor) {
      const shouldBeEditable = !branchingMode.isActive;
      editor.setEditable(shouldBeEditable);
    }
  }, [editor, branchingMode.isActive]);

  // Periodically check for sentence endings when user has paused
  useEffect(() => {
    if (!editor) return;
    
    const interval = setInterval(() => {
      // Skip periodic checks if user is actively editing
      if (isEditingRef.current) {
        return;
      }
      
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
    
    const previousState = editorHistory[historyIndex - 1];
    editor.commands.setContent(previousState);
    setHistoryIndex(prev => prev - 1);
  }, [editor, editorHistory, historyIndex]);

  const handleRedo = useCallback(() => {
    if (!editor || historyIndex >= editorHistory.length - 1) return;
    
    const nextState = editorHistory[historyIndex + 1];
    editor.commands.setContent(nextState);
    setHistoryIndex(prev => prev + 1);
  }, [editor, editorHistory, historyIndex]);

  const handleReset = useCallback(() => {
    if (!editor) return;
    
    // Show the confirmation modal
    setShowResetModal(true);
  }, [editor]);

  const handleConfirmReset = useCallback(() => {
    if (!editor) return;
    
    // Clear the editor content
    editor.commands.clearContent();
    setEditorHistory([]);
    setHistoryIndex(-1);
    processedSentencesRef.current.clear();
    lastProcessedCountRef.current = 0;
    setPreviousText('');
    setWordCount(0);
    setSentenceCount(0);
    
    // Call the parent component to clear the tree structure and timeline
    if (onResetPage) {
      onResetPage();
    }
    
    // Close the modal
    setShowResetModal(false);
  }, [editor, onResetPage]);

  const handleCancelReset = useCallback(() => {
    setShowResetModal(false);
  }, []);

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
        <div className={`main-editor-wrapper ${branchingMode.isActive ? 'disabled' : ''}`}>
          <EditorContent 
            editor={editor} 
            onClick={handleClick}
          />
        </div>
        
        {/* Enhanced branching interface - positioned inline with selected sentence */}
        {branchingMode.isActive && (
          <div 
            className="branch-section inline-branch-section"
            style={{
              position: 'absolute',
              left: `${branchingMode.position?.left || 0}px`,
              top: `${branchingMode.position?.top || 0}px`,
              zIndex: 999,
              backgroundColor: 'white',
              border: '2px solid #3b82f6',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              minWidth: '500px',
              maxWidth: '700px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {branchingMode.branches
              .filter(branch => {
                // If we're in draft mode (user clicked "Create New Branch"), only show new branches
                if (branchingMode.isDraft) {
                  return branch.isNew;
                }
                // Otherwise, show all alternatives as before
                return branch.type === 'alternative';
              })
              .map((branch, index) => {
              // Calculate the correct alternative number based on all alternatives, not just filtered ones
              const allAlternatives = branchingMode.branches.filter(b => b.type === 'alternative');
              const alternativeNumber = allAlternatives.findIndex(b => b.id === branch.id) + 1;
              
              return (
                <div key={branch.id} className="branch-option">
                  <div className="branch-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div className="branch-label">
                      Alternative {alternativeNumber}
                      {branch.isNew && <span className="draft-indicator"> (Draft)</span>}
                    </div>
                    {branch.isNew && branchingMode.isDraft && (
                      <button 
                        className="branch-action-btn cancel-btn"
                        onClick={() => {
                          
                          // Destroy any branch editors before clearing
                          branchingMode.branches.forEach(branch => {
                            if (branch.editor) {
                              branch.editor.destroy();
                            }
                          });
                          
                          // Exit branching mode without saving any draft branches
                          setBranchingMode({
                            isActive: false,
                            isDraft: false,
                            parentSentence: '',
                            branches: [],
                            insertPosition: 0,
                            position: undefined
                          });
                          
                          // Clear sentence selection when canceling
                          clearAllSelectedSentences();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#ef4444';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                          e.currentTarget.style.color = '#6b7280';
                        }}
                      >
                        <MdCancel size={14} />
                        Cancel
                      </button>
                    )}
                  </div>
                  <div className="branch-editor-wrapper">
                    <div 
                      id={`branch-editor-${branch.id}`}
                      className="branch-editor"
                    />
                  </div>
                  <div className="branch-actions">
                    <button 
                      className="branch-action-btn select-btn"
                      onClick={() => handleSelectBranch(branch)}
                    >
                      {branch.isNew 
                        ? 'Save & Select This Path' 
                        : 'Switch to This Path'
                      }
                    </button>
                  </div>
                </div>
              );
            })}
            
          </div>
        )}
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
        
        {/* Simplified dropdown menu for sentence actions */}
        {selectedSentence && dropdownPosition && (() => {
          const sentenceText = selectedSentence.element.textContent?.trim() || '';
          
          // Get branches for this sentence from parent component
          const availableBranches = getBranchesForSentence ? getBranchesForSentence(sentenceText) : [];
          
          
          if (availableBranches.length === 0) {
            // console.log(`🔍 DROPDOWN DEBUG: No branches found - will not show "Existing Alternatives" section`);
          } else {
            // console.log(`🔍 DROPDOWN DEBUG: Found ${availableBranches.length} branches - will show "Existing Alternatives" section`);
          }
          
          return (
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
                onClick={(e) => !disableInteractions && handleDropdownAction('show-view', e)}
                title={disableInteractions ? "Close info nodes before using this feature" : "See the data or view that supported this sentence"}
                disabled={disableInteractions}
                style={{
                  opacity: disableInteractions ? 0.5 : 1,
                  cursor: disableInteractions ? 'not-allowed' : 'pointer',
                  backgroundColor: disableInteractions ? '#f3f4f6' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <HiOutlineChartBar size={16} />
                Show View
              </button>
              
              <button
                className="dropdown-item"
                onClick={(e) => !disableInteractions && handleDropdownAction('add-next', e)}
                title={disableInteractions ? "Close info nodes before using this feature" : "Position cursor after this sentence to continue writing"}
                disabled={disableInteractions}
                style={{
                  opacity: disableInteractions ? 0.5 : 1,
                  cursor: disableInteractions ? 'not-allowed' : 'pointer',
                  backgroundColor: disableInteractions ? '#f3f4f6' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <HiOutlinePlus size={16} />
                Add Next
              </button>
              
              {/* Show existing branches if any */}
              {availableBranches.length > 0 && (
                <>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-section-header">
                    Existing Alternatives ({availableBranches.length}):
                  </div>
                  {availableBranches.map((branch, index) => {

                    
                    // Calculate alternative number for non-active branches
                    const alternativeNumber = branch.type === 'branch' 
                      ? availableBranches.filter((b, i) => i < index && b.type === 'branch').length + 1
                      : null;
                    
                    return (
                      <div key={branch.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <button
                          className={`dropdown-item ${branch.type === 'original_continuation' ? 'original-continuation' : 'branch-option'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            
                            
                            // Directly switch to this branch instead of showing branch-section
                            if (onSwitchToBranch) {
                              // console.log('🔄 Switching directly to branch:', branch.id);
                              onSwitchToBranch(branch.id);
                            }
                            
                            // Clear selection
                            clearAllSelectedSentences();
                          }}
                          title={`View and choose between ${availableBranches.length} alternatives for this sentence`}
                          style={{
                            ...(branch.type === 'original_continuation' ? {
                              backgroundColor: 'rgba(168, 85, 247, 0.1)',
                              color: '#7c3aed',
                              fontStyle: 'italic'
                            } : {
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              color: '#2563eb'
                            }),
                            textAlign: 'left',
                            padding: '8px 12px',
                            display: 'block',
                            width: 'calc(100% - 30px)', // Make room for delete button
                            marginRight: '4px'
                          }}
                        >
                          <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '2px' }}>
                            {branch.type === 'original_continuation' ? 'Active Path' : `Alternative ${alternativeNumber}`}
                          </div>
                          <div style={{ fontSize: '12px', opacity: 0.8 }}>
                            "{(branch.fullPathContent || branch.content).length > 40 ? (branch.fullPathContent || branch.content).substring(0, 40) + '...' : (branch.fullPathContent || branch.content)}"
                          </div>
                        </button>
                        
                        {/* Delete button for alternatives only (disabled for active branch) */}
                        {branch.type !== 'original_continuation' && (
                          <button
                            className="dropdown-item-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              
                    
                              
                              // Add to undo stack before deletion
                              addToUndoStack({
                                type: 'delete_branch',
                                timestamp: Date.now(),
                                deletedBranchId: branch.id,
                                deletedContent: branch.fullPathContent || branch.content,
                                context: {
                                  branchType: branch.type,
                                  alternativeNumber
                                }
                              });
                              
                              // TODO: Implement branch deletion in parent component
                              if (onDeleteBranch) {
                                onDeleteBranch(branch.id);
                              } else {
                                console.warn('⚠️ onDeleteBranch not implemented yet');
                              }
                            }}
                            title="Delete this alternative branch"
                            style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              width: '24px',
                              height: '24px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginLeft: '2px'
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
              
              <div className="dropdown-divider"></div>
              
              {/* Branch Management Section */}
              <div className="dropdown-section-header">Branch Management:</div>
              
              {/* Quick Create Button (as fallback) */}
              <button
                className="dropdown-item"
                onClick={(e) => !disableInteractions && handleDropdownAction('branch', e)}
                title={disableInteractions ? "Close info nodes before using this feature" : "Create a quick branch with placeholder text"}
                disabled={disableInteractions}
                style={{
                  opacity: disableInteractions ? 0.5 : 1,
                  cursor: disableInteractions ? 'not-allowed' : 'pointer',
                  backgroundColor: disableInteractions ? '#f3f4f6' : '#e0f2fe',
                  color: disableInteractions ? '#9ca3af' : '#0369a1',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  border: '1px solid #bae6fd',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!disableInteractions) {
                    e.currentTarget.style.backgroundColor = '#0284c7';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!disableInteractions) {
                    e.currentTarget.style.backgroundColor = '#e0f2fe';
                    e.currentTarget.style.color = '#0369a1';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <HiOutlineDocumentDuplicate size={14} />
                Create New Branch
              </button>
              
              {/* Delete Sentence Button */}
              <button
                className="dropdown-item"
                onClick={(e) => !disableInteractions && handleDropdownAction('delete', e)}
                title={disableInteractions ? "Close info nodes before using this feature" : "Delete this sentence and reconnect the tree structure"}
                disabled={disableInteractions}
                style={{
                  opacity: disableInteractions ? 0.5 : 1,
                  cursor: disableInteractions ? 'not-allowed' : 'pointer',
                  backgroundColor: disableInteractions ? '#fef2f2' : '#fef2f2',
                  color: disableInteractions ? '#9ca3af' : '#dc2626',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  border: '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!disableInteractions) {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!disableInteractions) {
                    e.currentTarget.style.backgroundColor = '#fef2f2';
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <HiOutlineTrash size={14} />
                Delete Sentence
              </button>
            </div>
          );
        })()}
        
        {/* Add Next inline editor */}
        {addNextMode && (
          <AddNextEditor
            position={addNextMode.position}
            onSave={handleSaveAddNext}
            onCancel={handleCancelAddNext}
          />
        )}
        
        {/* Narrative suggestion box */}
        {(currentSuggestion || isLoadingSuggestion) && (
          <NarrativeSuggestionBox
            suggestion={currentSuggestion || { narrative_suggestion: '', source_elementId: '', source_view_title: '', explanation: '' }}
            onAccept={handleAcceptSuggestion}
            onDeny={handleDenySuggestion}
            position={suggestionPosition || undefined}
            isLoading={isLoadingSuggestion}
          />
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

      {/* Reset confirmation modal */}
      <ConfirmationModal
        isOpen={showResetModal}
        title="Reset Page Content"
        message="Are you sure you want to reset the entire narrative for this page? This will remove all content, tree structure, and timeline data. This action cannot be undone."
        confirmText="Reset Page"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmReset}
        onCancel={handleCancelReset}
      />
    </div>
  );
});

// AddNextEditor component for inline sentence creation
const AddNextEditor: React.FC<{
  position: { left: number; top: number };
  onSave: (content: string) => void;
  onCancel: () => void;
}> = ({ position, onSave, onCancel }) => {
  const [hasContent, setHasContent] = useState(false);
  
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
      HardBreak.configure({
        keepMarks: false,
        HTMLAttributes: {
          class: 'tiptap-hard-break',
        },
      }),
      Placeholder.configure({
        placeholder: 'Type your next sentence(s) here. Use Shift+Enter for new lines.',
      }),
    ],
    content: '<p></p>',
    immediatelyRender: false,
    editable: true,
    onUpdate: ({ editor }) => {
      const text = editor.getText().trim();
      setHasContent(text.length > 0);
    },
    editorProps: {
      attributes: {
        class: 'add-next-editor-content',
        'data-gramm': 'false',
        'data-gramm_editor': 'false',
        'data-enable-grammarly': 'false',
        spellcheck: 'false'
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          handleSave();
          return true;
        } else if (event.key === 'Escape') {
          event.preventDefault();
          onCancel();
          return true;
        }
        return false;
      },
    },
  });
  
  // Auto-focus on mount
  useEffect(() => {
    if (editor) {
      editor.commands.focus();
    }
  }, [editor]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };
  
  const handleSave = () => {
    if (!editor) {
      console.error('❌ No editor available in AddNextEditor');
      return;
    }
    
    const trimmedContent = editor.getText().trim();
    
    if (trimmedContent) {
      onSave(trimmedContent);
    } else {
      console.warn('⚠️ AddNextEditor: No content to save');
    }
  };
  
  return (
    <div
      className="add-next-editor"
      style={{
        position: 'fixed',
        left: `${position.left}px`,
        top: `${position.top + 10}px`, // Slightly below the dropdown position
        zIndex: 1001, // Higher than dropdown
        backgroundColor: 'white',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: '300px',
        maxWidth: '500px'
      }}
    >
      <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', color: '#6b7280' }}>
        Add Next Sentence:
      </div>
      <div style={{ 
        border: '1px solid #d1d5db', 
        borderRadius: '4px',
        minHeight: '60px',
        padding: '8px'
      }}>
        <EditorContent 
          editor={editor} 
          style={{
            fontSize: 'inherit',
            fontFamily: 'inherit',
            outline: 'none'
          }}
        />
      </div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '8px', 
        marginTop: '8px' 
      }}>
        <button
          onClick={onCancel}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: '#f3f4f6',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasContent}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: hasContent ? '#3b82f6' : '#e5e7eb',
            color: hasContent ? 'white' : '#9ca3af',
            border: '1px solid',
            borderColor: hasContent ? '#3b82f6' : '#d1d5db',
            borderRadius: '4px',
            cursor: hasContent ? 'pointer' : 'not-allowed'
          }}
        >
          Add Sentence
        </button>
      </div>
    </div>
  );
};

// Add display name for debugging
NarrativeLayer.displayName = 'NarrativeLayer';

export default NarrativeLayer;
