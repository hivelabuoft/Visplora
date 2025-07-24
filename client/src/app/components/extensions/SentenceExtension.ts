import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import SentenceView from '../views/SentenceView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sentence: {
      /**
       * Add a sentence node
       */
      addSentence: (text: string) => ReturnType;
    };
  }
}

export interface SentenceOptions {
  HTMLAttributes: Record<string, any>;
}

export const Sentence = Node.create<SentenceOptions>({
  name: 'sentence',
  
  group: 'block',
  
  content: 'inline*',
  
  defining: true,
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      { 
        tag: 'div[data-type="sentence"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div', 
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'sentence' }),
      0
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SentenceView);
  },

  addCommands() {
    return {
      addSentence: (text: string) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          content: [
            {
              type: 'text',
              text: text,
            },
          ],
        });
      },
    };
  },
});

export default Sentence;
