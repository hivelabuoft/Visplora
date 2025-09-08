import { Mark } from '@tiptap/core';

export interface CompletedSentenceOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    completedSentence: {
      /**
       * Mark text as a completed sentence
       */
      markAsCompletedSentence: (options?: { class?: string }) => ReturnType;
      /**
       * Remove completed sentence mark
       */
      unmarkCompletedSentence: () => ReturnType;
    };
  }
}

export const CompletedSentence = Mark.create<CompletedSentenceOptions>({
  name: 'completedSentence',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'completed-sentence',
        'data-completed-sentence': 'true',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-completed-sentence="true"]',
        getAttrs: () => ({}),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Use custom class if provided, otherwise use default
    const className = HTMLAttributes.class || this.options.HTMLAttributes.class;
    return [
      'span',
      {
        ...this.options.HTMLAttributes,
        ...HTMLAttributes,
        class: className,
      },
      0,
    ];
  },

  addCommands() {
    return {
      markAsCompletedSentence:
        (options?: { class?: string }) =>
        ({ commands, state, dispatch }) => {
          // Set attributes including custom class if provided
          const attrs = options?.class ? { class: options.class } : {};
          
          const result = commands.setMark(this.name, attrs);
          
          // Force a re-render to see the changes
          if (dispatch) {
            dispatch(state.tr);
          }
          
          return result;
        },
      unmarkCompletedSentence:
        () =>
        ({ commands }) => {
        //   console.log('🔍 CompletedSentence: unmarkCompletedSentence command called');
          const result = commands.unsetMark(this.name);
        //   console.log('🔍 CompletedSentence: unsetMark result:', result);
          return result;
        },
    };
  },
});
