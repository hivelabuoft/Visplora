import * as React from "react"
import { cn } from "@/lib/utils"
import { useDashboardPlayground } from "@/app/components/DashboardPlayground"
import { FiPlus } from 'react-icons/fi'

interface LinkableCardProps {
  children: React.ReactNode;
  isPlaygroundMode: boolean;
  elementId?: string;
  className?: string;
  tooltip?: string;
  hasNotes?: boolean;
}

export function LinkableCard({
  children,
  isPlaygroundMode,
  elementId,
  className,
  hasNotes = false,
}: LinkableCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  let activateLinkedNoteMode: ((elementId?: string) => void) | undefined;
  let isElementSelectionMode = false;
  let noteToLink: string | null = null;
  let linkNoteToElement: ((noteId: string, elementId: string) => void) | undefined;
  
  try {
    const context = useDashboardPlayground();
    activateLinkedNoteMode = context.activateLinkedNoteMode;
    isElementSelectionMode = context.isElementSelectionMode;
    noteToLink = context.noteToLink;
    linkNoteToElement = context.linkNoteToElement;
  } catch {
    // Context not available, component used outside of DashboardPlayground
    activateLinkedNoteMode = undefined;
    isElementSelectionMode = false;
    noteToLink = null;
    linkNoteToElement = undefined;
  }

  const handleMouseEnter = () => {
    if (isPlaygroundMode) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaygroundMode) {
      setIsHovered(false);
    }
  };  const handleAddNoteClick = (e: React.MouseEvent) => {
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
  return (
    <div
      className={cn(
        "transition-all duration-200 rounded-xl relative group",
        isElementSelectionMode ? "cursor-pointer" : "",
        className
      )}      style={{
        boxShadow: isPlaygroundMode ? (
          isElementSelectionMode ? "0 0 15px 0px rgb(155, 4, 230)"
            : isHovered ? "0 0 20px 0 rgb(30, 199, 255)" 
              : "none"
        ) : "none",
        border: isElementSelectionMode ? "3px solid rgb(155, 4, 230)" : "none"
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleElementClick}
      data-element-id={elementId}
    >
      {children}
      {/* Note indicator */}
      {isPlaygroundMode && hasNotes && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-sky-500" ></div>
      )}

      {/* Add Note Button - appears on hover */}
      {isPlaygroundMode && isHovered && !isElementSelectionMode && activateLinkedNoteMode && (
        <button
          onClick={handleAddNoteClick}
          className="absolute top-2 right-2 w-8 h-8 bg-sky-500 hover:bg-sky-600 text-white rounded-full 
                     flex items-center justify-center shadow-lg transition-all duration-200 z-10
                     transform hover:scale-110"
          title="Add note for this element"
        >
          <FiPlus size={14} />
        </button>
      )}

      {/* Element selection mode indicator */}
      {isPlaygroundMode && isElementSelectionMode && isHovered && (
        <div className="absolute top-2 left-2 bg-purple-600 text-white px-4 py-1 rounded-full text-lg font-semibold">
          Click to Link
        </div>
      )}
    </div>
  );
}
