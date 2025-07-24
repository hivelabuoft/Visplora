import React from 'react';
import { NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';

const SentenceView: React.FC<NodeViewProps> = ({ 
  node, 
  getPos, 
  editor 
}) => {
  const handleSentenceClick = () => {
    const pos = getPos();
    // Select the node if pos is defined
    if (typeof pos === 'number') {
      editor.commands.setNodeSelection(pos);
    }
    
    // You could emit a custom event here for more complex interactions
    // editor.emit('sentenceClicked', { sentence: node.textContent, position: pos });
  };
  
  return (
    <NodeViewWrapper className="narrative-sentence-wrapper">
      <span 
        className="narrative-sentence" 
        onClick={handleSentenceClick}
        data-status="complete"
      >
        {node.textContent}
      </span>
    </NodeViewWrapper>
  );
};

export default SentenceView;
