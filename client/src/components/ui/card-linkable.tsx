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
  
  // Get the note linking mode function from context
  let activateNoteLinkingMode: (() => void) | undefined; 
  try {
    const context = useDashboardPlayground();
    activateNoteLinkingMode = context.activateNoteLinkingMode;
  } catch {
    // Context not available, component used outside of DashboardPlayground
    activateNoteLinkingMode = undefined;
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
  };

  const handleAddNoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activateNoteLinkingMode) {
      activateNoteLinkingMode();
    }
  };

  return (
    <div
      className={cn(
        "transition-all duration-200 rounded-xl relative group",
        className
      )}
      style={{
        boxShadow: isPlaygroundMode && isHovered ? "0 0 20px 0 rgb(30, 199, 255)" : "none",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-element-id={elementId}
    >
      {children}
      {/* Note indicator */}
      {isPlaygroundMode && hasNotes && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-sky-500" ></div>
      )}

      {/* Add Note Button - appears on hover */}
      {isPlaygroundMode && isHovered && activateNoteLinkingMode && (
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
    </div>
  );
}
