import * as React from "react"
import { cn } from "@/lib/utils"

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
  tooltip = "Link note with this element",
  hasNotes = false,
}: LinkableCardProps) {  const [isHovered, setIsHovered] = React.useState(false);

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
        <div className="absolute top-2 right-2 w-2 h-2 bg-sky-400 " />
      )}
        {/* Hover tooltip */}
      {isPlaygroundMode && isHovered && (
        <div 
          className="absolute z-50 left-1/2 -top-10 bg-sky-400 text-slate-100 px-3 py-1 rounded-md text-sm shadow-xl pointer-events-none transform -translate-x-1/2 flex items-center gap-2 whitespace-nowrap"
        >
          {tooltip}
          {hasNotes && (
            <span className="text-xs bg-sky-400 px-1.5 py-0.5 rounded">
              Has Notes
            </span>
          )}
          {/* Tooltip arrow */}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-sky-400 rotate-45" />
        </div>
      )}
    </div>
  );
}
