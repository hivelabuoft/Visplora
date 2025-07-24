import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface AutoCompleteSentenceOptions {
  chars: string[];
}

export const AutoCompleteSentence = Extension.create<AutoCompleteSentenceOptions>({
  name: 'autoCompleteSentence',

  addOptions() {
    return {
      chars: ['.', ',', ';'],
    };
  },

  addProseMirrorPlugins() {
    const { chars } = this.options;

    return [
      new Plugin({
        key: new PluginKey('autoCompleteSentence'),
        props: {
          handleKeyDown: (view, event) => {
            // Check if the pressed key is one of our sentence-ending characters
            if (chars.includes(event.key) && !event.shiftKey) {
              const { state, dispatch } = view;
              
              // Insert the character at the current position
              const tr = state.tr.insertText(event.key);
              
              // Apply the transaction
              dispatch(tr);
              
              // Split the paragraph to create a new sentence node
              this.editor.commands.createParagraphNear();
              
              // Prevent the default action for the key
              return true;
            }
            
            // If it's the Enter key, also create a new paragraph
            if (event.key === 'Enter' && !event.shiftKey) {
              const { state } = view;
              const { selection } = state;
              const { empty, $head } = selection;
              
              // Only handle this if we're at the end of a text node
              if (empty && $head.parent.type.name === 'paragraph') {
                const endPos = $head.end();
                
                // If we're not at the end of the paragraph, don't handle
                if ($head.pos < endPos) {
                  return false;
                }
                
                // Add a period if there isn't one already
                const textBefore = $head.parent.textContent;
                if (!textBefore.endsWith('.') && 
                    !textBefore.endsWith(',') && 
                    !textBefore.endsWith(';')) {
                  this.editor.commands.insertContent('.');
                }
                
                // Create a new paragraph
                this.editor.commands.createParagraphNear();
                
                return true;
              }
            }
            
            return false;
          },
        },
      }),
    ];
  },
});
