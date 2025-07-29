import { Mark, mergeAttributes } from '@tiptap/core';
import { detectNumbers, NumberMatch } from '../utils/numberDetector';

export interface NumberHighlightOptions {
  HTMLAttributes: Record<string, any>;
  enableAutoHighlight: boolean;
  highlightDecimalNumbers: boolean;
  highlightIntegerNumbers: boolean;
  highlightPercentages: boolean;
  highlightCurrency: boolean;
  highlightScientific: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    numberHighlight: {
      /**
       * Set number highlight mark
       */
      setNumberHighlight: (attributes?: { value: number; type: string }) => ReturnType;
      /**
       * Toggle number highlight mark
       */
      toggleNumberHighlight: (attributes?: { value: number; type: string }) => ReturnType;
      /**
       * Unset number highlight mark
       */
      unsetNumberHighlight: () => ReturnType;
      /**
       * Auto-highlight all numbers in the document
       */
      autoHighlightNumbers: () => ReturnType;
    };
  }
}

export const NumberHighlight = Mark.create<NumberHighlightOptions>({
  name: 'numberHighlight',

  addOptions() {
    return {
      HTMLAttributes: {},
      enableAutoHighlight: true,
      highlightDecimalNumbers: true,
      highlightIntegerNumbers: true,
      highlightPercentages: true,
      highlightCurrency: true,
      highlightScientific: true,
    };
  },

  addAttributes() {
    return {
      value: {
        default: null,
        parseHTML: element => parseFloat(element.getAttribute('data-value') || '0'),
        renderHTML: attributes => {
          if (!attributes.value) {
            return {};
          }
          return {
            'data-value': attributes.value,
          };
        },
      },
      type: {
        default: 'decimal',
        parseHTML: element => element.getAttribute('data-type') || 'decimal',
        renderHTML: attributes => {
          if (!attributes.type) {
            return {};
          }
          return {
            'data-type': attributes.type,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-number-highlight]',
      },
      {
        tag: 'span.number-highlight',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        {
          'data-number-highlight': '',
          class: 'number-highlight',
        },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      0,
    ];
  },

  addCommands() {
    const extension = this;
    
    return {
      setNumberHighlight:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(extension.name, attributes);
        },
      toggleNumberHighlight:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(extension.name, attributes);
        },
      unsetNumberHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(extension.name);
        },
      autoHighlightNumbers:
        () =>
        ({ editor, tr }) => {
          const { doc } = editor.state;
          let modified = false;

          // Helper function to check if a number type should be highlighted
          const shouldHighlightType = (type: NumberMatch['type']): boolean => {
            switch (type) {
              case 'decimal':
                return extension.options.highlightDecimalNumbers;
              case 'integer':
                return extension.options.highlightIntegerNumbers;
              case 'percentage':
                return extension.options.highlightPercentages;
              case 'currency':
                return extension.options.highlightCurrency;
              case 'scientific':
                return extension.options.highlightScientific;
              default:
                return true;
            }
          };

          // Walk through all text nodes in the document
          doc.descendants((node, pos) => {
            if (node.isText && node.text) {
              const result = detectNumbers(node.text);
              
              if (result.hasNumbers) {
                result.numbers.forEach((numberMatch: NumberMatch) => {
                  // Check if this number type should be highlighted
                  const shouldHighlight = shouldHighlightType(numberMatch.type);
                  
                  if (shouldHighlight) {
                    const from = pos + numberMatch.start;
                    const to = pos + numberMatch.end;
                    
                    // Check if this range is already highlighted
                    const hasHighlight = tr.doc.rangeHasMark(from, to, extension.type);
                    
                    if (!hasHighlight) {
                      tr.addMark(from, to, extension.type.create({
                        value: numberMatch.value,
                        type: numberMatch.type,
                      }));
                      modified = true;
                    }
                  }
                });
              }
            }
            return true; // Continue traversing
          });

          return modified;
        },
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.enableAutoHighlight) {
      return [];
    }

    return [
      // Auto-highlight plugin that runs on document updates
      // Note: This would be implemented with a proper ProseMirror plugin
      // For now, we'll rely on manual triggering
    ];
  },
});

export default NumberHighlight;
