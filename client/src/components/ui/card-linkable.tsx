import * as React from "react"
import { cn } from "@/lib/utils"
import { useDashboardPlayground } from "@/app/components/DashboardPlayground"
import { FiPlus, FiLink } from 'react-icons/fi'
import { ConnectionNodes } from './connection-nodes'

interface LinkableCardProps {
  children: React.ReactNode;
  elementId?: string;
  className?: string;
  tooltip?: string;
  hasNotes?: boolean;
}

export function LinkableCard({
  children,
  elementId,
  className,
  hasNotes = false,
}: LinkableCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [showConnectionNodes, setShowConnectionNodes] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  let activateLinkedNoteMode: ((elementId?: string) => void) | undefined;
  let isElementSelectionMode = false;
  let noteToLink: string | null = null;
  let linkNoteToElement: ((noteId: string, elementId: string) => void) | undefined;
  let isElementLinked: ((elementId: string) => boolean) | undefined;
  let setHoveredElementId: ((elementId: string | null) => void) | undefined;
  let onConnectionDragStart: ((elementId: string, type: 'element' | 'note', position: 'top' | 'right' | 'bottom' | 'left', x: number, y: number) => void) | undefined;
  let isDragging = false;
  let isValidDropTarget: ((elementId: string, type: 'element' | 'note') => boolean) | undefined;
  
  try {
    const context = useDashboardPlayground();
    activateLinkedNoteMode = context.activateLinkedNoteMode;
    isElementSelectionMode = context.isElementSelectionMode;
    noteToLink = context.noteToLink;
    linkNoteToElement = context.linkNoteToElement;
    isElementLinked = context.isElementLinked;
    setHoveredElementId = context.setHoveredElementId;
    onConnectionDragStart = context.onConnectionDragStart;
    isDragging = context.isDragging;
    isValidDropTarget = context.isValidDropTarget;
  } catch {
    // Context not available, component used outside of DashboardPlayground
    activateLinkedNoteMode = undefined;
    isElementSelectionMode = false;
    noteToLink = null;
    linkNoteToElement = undefined;
    isElementLinked = undefined;
    setHoveredElementId = undefined;
    onConnectionDragStart = undefined;
    isDragging = false;
    isValidDropTarget = undefined;
  }

  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowConnectionNodes(true);
    if (setHoveredElementId && elementId) {
      setHoveredElementId(elementId);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowConnectionNodes(false);
    if (setHoveredElementId) {
      setHoveredElementId(null);
    }
  };
  
  const handleAddNoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activateLinkedNoteMode) {
      activateLinkedNoteMode(elementId);
    }
  };

  const handleElementClick = (e: React.MouseEvent) => {
    if (isElementSelectionMode && noteToLink && linkNoteToElement && elementId) {
      e.preventDefault();
      e.stopPropagation();
      linkNoteToElement(noteToLink, elementId);
    }
  };

  // Check if this element is currently linked to any note
  const isLinked = elementId && isElementLinked ? isElementLinked(elementId) : false;
  
  return (
    <div
      ref={cardRef}
      className={cn(
        "transition-all duration-200 rounded-xl relative group",
        isElementSelectionMode ? "cursor-pointer" : "",
        className
      )}
      style={{
        boxShadow: isElementSelectionMode ? "0 0 15px 0px rgb(155, 4, 230)"
          : isLinked ? "0 0 12px 2px rgba(155, 4, 230, 0.4)"
            : isHovered ? "0 0 20px 0 rgb(30, 199, 255)" : "none",
        border: isElementSelectionMode ? "1px solid rgb(155, 4, 230)" 
          : isLinked ? "1px solid rgba(155, 4, 230, 0.6)" : "none"
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleElementClick}
      data-element-id={elementId}
    >
      {children}
      {/* Connection Nodes */}
      <ConnectionNodes
        elementId={elementId || ''}
        isVisible={showConnectionNodes || isDragging}
        isLinked={isLinked}
        onDragStart={onConnectionDragStart}
        isNote={false}
        isDragging={isDragging}
        isDragTarget={elementId && isValidDropTarget ? isValidDropTarget(elementId, 'element') : false}
      />

      {/* Linked indicator badge */}
      {isLinked && (
        <div className="absolute top-1 right-1 w-6 h-6 bg-purple-600 text-white rounded-full 
                        flex items-center justify-center z-10 shadow-lg"
             title="This element has linked notes">
          <FiLink size={12} />
        </div>
      )}
      
      {/* Add Note Button - appears on hover */}
      {isHovered && !isElementSelectionMode && (
        <button
          onClick={handleAddNoteClick}
          className={`absolute w-6 h-6 bg-sky-500 hover:bg-sky-600 text-white rounded-full 
                     flex items-center justify-center shadow-lg transition-all duration-200 z-10 transform 
                     hover:scale-110 ${isLinked || hasNotes ? 'top-1 right-8' : 'top-1 right-1'}`}
          title="Add note for this element"
        >
          <FiPlus size={12} />
        </button>
      )}

      {/* Element selection mode indicator */}
      {isElementSelectionMode && isHovered && (
        <div className="absolute top-2 left-2 bg-purple-600 text-white px-4 py-1 rounded-full text-lg font-semibold">
          Click to Link
        </div>
      )}
    </div>
  );
}
