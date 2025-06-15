import * as React from "react"
import { cn } from "@/lib/utils"
import { useDashboardPlayground } from "@/app/components/DashboardPlayground"
import { FiPlus, FiLink } from 'react-icons/fi'

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
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const cardRef = React.useRef<HTMLDivElement>(null);
  
  let activateLinkedNoteMode: ((elementId?: string) => void) | undefined;
  let isElementSelectionMode = false;
  let noteToLink: string | null = null;
  let linkNoteToElement: ((noteId: string, elementId: string) => void) | undefined;
  let isElementLinked: ((elementId: string) => boolean) | undefined;
  
  try {
    const context = useDashboardPlayground();
    activateLinkedNoteMode = context.activateLinkedNoteMode;
    isElementSelectionMode = context.isElementSelectionMode;
    noteToLink = context.noteToLink;
    linkNoteToElement = context.linkNoteToElement;
    isElementLinked = context.isElementLinked;
  } catch {
    // Context not available, component used outside of DashboardPlayground
    activateLinkedNoteMode = undefined;
    isElementSelectionMode = false;
    noteToLink = null;
    linkNoteToElement = undefined;
    isElementLinked = undefined;
  }
  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowConnectionNodes(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowConnectionNodes(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
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
  // Simple connection node component
  const ConnectionNode = ({ position }: { position: 'top' | 'right' | 'bottom' | 'left' }) => {
    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`Connection node clicked: ${position} on element ${elementId}`);
      // TODO: Implement connection logic here
    };

    const getPositionStyles = () => {
      const baseStyles = {
        position: 'absolute' as const,
        zIndex: 50,
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        cursor: 'crosshair',
      };

      switch (position) {
        case 'top':
          return { 
            ...baseStyles, 
            top: '-4px', 
            left: '50%', 
            transform: 'translateX(-50%)',
          };
        case 'right':
          return { 
            ...baseStyles, 
            right: '-4px', 
            top: '50%', 
            transform: 'translateY(-50%)',
          };
        case 'bottom':
          return { 
            ...baseStyles, 
            bottom: '-4px', 
            left: '50%', 
            transform: 'translateX(-50%)',
          };
        case 'left':
          return { 
            ...baseStyles, 
            left: '-4px', 
            top: '50%', 
            transform: 'translateY(-50%)',
          };
      }
    };    return (
      <div
        style={getPositionStyles()}
        className="bg-gray-400 border-1 border-white hover:bg-sky-500 cursor-pointer"
        onMouseDown={handleMouseDown}
        title={`Connect from ${position}`}
      >
      </div>
    );
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
      )}      style={{
        boxShadow: isElementSelectionMode ? "0 0 15px 0px rgb(155, 4, 230)"
          : isLinked ? "0 0 12px 2px rgba(155, 4, 230, 0.4)"
            : isHovered ? "0 0 20px 0 rgb(30, 199, 255)" : "none",
        border: isElementSelectionMode ? "1px solid rgb(155, 4, 230)" 
          : isLinked ? "1px solid rgba(155, 4, 230, 0.6)" : "none"
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onClick={handleElementClick}
      data-element-id={elementId}
    >
      {children}
      
      {/* Connection Nodes - 4 draggable points */}
      {showConnectionNodes && elementId && (
        <>
          <ConnectionNode position="top" />
          <ConnectionNode position="right" />
          <ConnectionNode position="bottom" />
          <ConnectionNode position="left" />
        </>
      )}

      {/* Linked indicator badge */}
      {isLinked && (
        <div className="absolute top-1 right-1 w-6 h-6 bg-purple-600 text-white rounded-full 
                        flex items-center justify-center z-10 shadow-lg"
             title="This element has linked notes">
          <FiLink size={14} />
        </div>
      )}
      
      {/* Add Note Button - appears on hover */}
      {isHovered && !isElementSelectionMode && (
        <button
          onClick={handleAddNoteClick}
          className={`absolute w-6 h-6 bg-sky-500 hover:bg-sky-600 text-white rounded-full 
                     flex items-center justify-center shadow-lg transition-all duration-200 z-10 transform 
                     hover:scale-110 ${isLinked || hasNotes ? 'top-1 right-10' : 'top-1 right-1'}`}
          title="Add note for this element"
        >
          <FiPlus size={14} />
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
