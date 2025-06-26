'use client';

import React from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { FiMove } from 'react-icons/fi';
import styles from '../DashboardPlayground.module.css';
import InteractiveGrid from '../../../components/ui/interactive-grid';
import StickyNote from '../../../components/ui/sticky-note';
import ConnectionLines from '../../../components/ui/connection-lines';
import DroppedElement from '../../../components/ui/dropped-element';
import { CELL_SIZE, DASHBOARD_WIDTH } from './DashboardPlaygroundUtils';
import { DroppedElement as DroppedElementType, ElementDragData } from '../../../components/context/DashboardPlaygroundContext';

interface DashboardPlaygroundCanvasProps {
  children: React.ReactNode;
  transformRef: React.RefObject<ReactZoomPanPinchRef | null>;
  dashboardRef: React.RefObject<HTMLDivElement | null>;
  dashboardPositionRef: React.MutableRefObject<{ x: number; y: number }>;
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  isPanning: boolean;
  setIsPanning: (panning: boolean) => void;
  isElementDragging: boolean;
  canvasWidth: number;
  canvasHeight: number;
  showGrid: boolean;
  isAnnotationMode: boolean;
  isResizing: boolean;
  isMoving: boolean;
  mousePosition: { x: number; y: number };
  hoveredCell: string | null;
  elementDragPosition: { x: number; y: number } | null;
  elementDragData: ElementDragData | null;
  // Grid props
  occupiedCells: Set<string>;
  dashboardGridInfo: any;
  onCellHover: (cell: any) => void;
  onCellClick: (cell: any) => void;
  onCanvasMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onCanvasClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  // Notes props
  stickyNotes: any[];
  updateStickyNote: (id: string, updates: any) => void;
  deleteStickyNote: (id: string) => void;
  selectNote: (id: string | null) => void;
  onResizeStart: () => void;
  onResizeEnd: () => void;
  onMoveStart: () => void;
  onMoveEnd: () => void;
  getAllOccupiedCells: () => Set<string>;
  onConnectionDragStart: (elementId: string, type: 'element' | 'note', position: 'top' | 'right' | 'bottom' | 'left', x: number, y: number) => void;
  isDragging: boolean;
  isValidDropTarget: (elementId: string, type: 'element' | 'note') => boolean;
  // Connection props
  hoveredElementId: string | null;
  removeConnection: (noteId: string) => void;
  manualConnections: any[];
  handleAddManualConnection: (connection: any) => void;
  handleRemoveManualConnection: (connectionId: string) => void;
  dragStart: any;
  dragPreview: { x: number; y: number } | null;
  // Dropped elements props
  droppedElements: DroppedElementType[];
  setDroppedElements: React.Dispatch<React.SetStateAction<DroppedElementType[]>>;
  handleDroppedElementMove: (elementId: string, newPosition: { x: number; y: number }, newGridPosition: { row: number; col: number }) => void;
  handleDroppedElementMoveStart: () => void;
  handleDroppedElementMoveEnd: () => void;
  isValidDropTargetForConnections: (elementId: string, type: 'element' | 'note') => boolean;
  hrData: any[];
}

export const DashboardPlaygroundCanvas: React.FC<DashboardPlaygroundCanvasProps> = ({
  children,
  transformRef,
  dashboardRef,
  dashboardPositionRef,
  zoomLevel,
  setZoomLevel,
  isPanning,
  setIsPanning,
  isElementDragging,
  canvasWidth,
  canvasHeight,
  showGrid,
  isAnnotationMode,
  isResizing,
  isMoving,
  mousePosition,
  hoveredCell,
  elementDragPosition,
  elementDragData,
  occupiedCells,
  dashboardGridInfo,
  onCellHover,
  onCellClick,
  onCanvasMouseMove,
  onCanvasClick,
  stickyNotes,
  updateStickyNote,
  deleteStickyNote,
  selectNote,
  onResizeStart,
  onResizeEnd,
  onMoveStart,
  onMoveEnd,
  getAllOccupiedCells,
  onConnectionDragStart,
  isDragging,
  isValidDropTarget,
  hoveredElementId,
  removeConnection,
  manualConnections,
  handleAddManualConnection,
  handleRemoveManualConnection,
  dragStart,
  dragPreview,
  droppedElements,
  setDroppedElements,
  handleDroppedElementMove,
  handleDroppedElementMoveStart,
  handleDroppedElementMoveEnd,
  isValidDropTargetForConnections,
  hrData
}) => {
  return (
    <div className={styles.canvasContainer}>
      <TransformWrapper
        ref={transformRef}
        initialScale={0.8}
        initialPositionX={-dashboardGridInfo.position.x}
        initialPositionY={-dashboardGridInfo.position.y}
        minScale={0.15}
        maxScale={2}
        centerOnInit={true}
        limitToBounds={false}
        smooth={true}
        disabled={isElementDragging}
        wheel={{
          disabled: isElementDragging,
          step: 0.001,
          smoothStep: 0.0005
        }}
        doubleClick={{
          disabled: isElementDragging,
          step: 0.5
        }}
        onTransformed={(ref) => {
          const newZoom = ref.state.scale * 100;
          dashboardPositionRef.current.x = ref.state.positionX;
          dashboardPositionRef.current.y = ref.state.positionY;
          setZoomLevel(Math.round(newZoom));
        }}
        onPanning={(ref) => {
          setIsPanning(true);
        }}
        onPanningStop={(ref) => {
          setTimeout(() => setIsPanning(false), 100);
        }}>
        <React.Fragment>
          <TransformComponent>
            <div 
              className={`${styles.canvasBackground} ${
                isPanning ? styles.panning : 
                isAnnotationMode ? styles.annotationMode : 
                styles.default
              }`}
              style={{
                  width: `${canvasWidth}px`,
                  height: `${canvasHeight}px`
              }}
              onClick={onCanvasClick}
              onMouseMove={onCanvasMouseMove}
            >
              {/* Interactive Grid */}
              <InteractiveGrid
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                cellSize={CELL_SIZE}
                showGrid={showGrid || isResizing || isMoving}
                dashboardBounds={dashboardGridInfo.bounds}
                occupiedCells={occupiedCells}
                onCellHover={onCellHover}
                onCellClick={onCellClick}
                isMoving={isMoving}
                isPanning={isPanning}
              />
              
              {/* Center the dashboard in the grid */}
              <div 
                ref={dashboardRef}
                className={styles.dashboardContainer}
                style={{ 
                  width: `${DASHBOARD_WIDTH}px`,
                  left: `${dashboardGridInfo.position.x}px`,
                  top: `${dashboardGridInfo.position.y}px`
                }}
                onClick={onCanvasClick}
                data-dashboard-container
              >
                {children}
              </div>
              
              {/* Connection Lines - between linked notes and dashboard elements */}
              <ConnectionLines
                stickyNotes={stickyNotes}
                cellSize={CELL_SIZE}
                dashboardPosition={dashboardGridInfo.position}
                dashboardWidth={DASHBOARD_WIDTH}
                hoveredElementId={hoveredElementId}
                onRemoveConnection={removeConnection}
                manualConnections={manualConnections}
                onAddManualConnection={handleAddManualConnection}
                onRemoveManualConnection={handleRemoveManualConnection}
                onConnectionDragStart={onConnectionDragStart}
                isDragging={isDragging}
                dragStart={dragStart}
                dragPreview={dragPreview}
                droppedElements={droppedElements}
              />
              
              {/* Sticky Notes */}
              {stickyNotes.map((note) => (
                <StickyNote
                  key={note.id}
                  note={note}
                  cellSize={CELL_SIZE}
                  onUpdate={updateStickyNote}
                  onDelete={deleteStickyNote}
                  onSelect={selectNote}
                  isResizing={isResizing}
                  onResizeStart={onResizeStart}
                  onResizeEnd={onResizeEnd}
                  onMoveStart={onMoveStart}
                  onMoveEnd={onMoveEnd}
                  getOccupiedCells={getAllOccupiedCells}
                  zoomLevel={zoomLevel}
                  onConnectionDragStart={onConnectionDragStart}
                  isDragging={isDragging}
                  isDragTarget={isValidDropTarget(note.id, 'note')}
                />
              ))}
              
              {/* Dropped Elements */}
              {droppedElements.map((element) => (
                <DroppedElement
                  key={element.id}
                  element={element}
                  cellSize={CELL_SIZE}
                  hrData={hrData}
                  zoomLevel={zoomLevel}
                  onRemove={(id) => setDroppedElements(prev => prev.filter(el => el.id !== id))}
                  onMove={handleDroppedElementMove}
                  onMoveStart={handleDroppedElementMoveStart}
                  onMoveEnd={handleDroppedElementMoveEnd}
                  onConnectionDragStart={onConnectionDragStart}
                  isDragging={isDragging}
                  isDragTarget={isValidDropTargetForConnections(element.id, 'element')}
                />
              ))}
              
              {/* Note Preview - follows cursor in annotation mode */}
              {isAnnotationMode && !isPanning && !isMoving && (
                <div
                  className={styles.notePreview}
                  style={{
                    left: `${mousePosition.x}px`,
                    top: `${mousePosition.y}px`,
                    width: `${CELL_SIZE * 50}px`,
                    height: `${CELL_SIZE * 50}px`,
                    opacity: hoveredCell ? '0.75' : '0.25'
                  }}
                >
                  <div className={styles.notePreviewContent}>
                    <div className={styles.notePreviewHeader}>
                      <div className={styles.notePreviewTitle}>
                        📝 New Note
                      </div>
                      <div className={styles.notePreviewDot}></div>
                    </div>
                    <div className={styles.notePreviewBody}>
                      <div className={styles.notePreviewText}>
                        Click to place
                      </div>
                      {hoveredCell && (
                        <div className={styles.notePreviewPosition}>
                          {hoveredCell}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Element Drag Preview - follows cursor during element dragging */}
              {isElementDragging && elementDragPosition && elementDragData && (
                <div
                  className="fixed bg-white border-2 border-orange-400 rounded-lg shadow-xl opacity-75 pointer-events-none z-50"
                  style={{
                    left: `${elementDragPosition.x - 200}px`,
                    top: `${elementDragPosition.y - 150}px`,
                    width: `400px`,
                    height: `300px`,
                  }}
                >
                  <div className="bg-orange-100 px-3 py-2 border-b border-orange-200 flex items-center">
                    <FiMove size={12} className="text-orange-600 mr-2" />
                    <div className="text-xl font-medium text-orange-800 truncate">
                      {elementDragData.elementName}
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-center text-center">
                    <div>
                      <div className="text-2xl mb-2">📊</div>
                      <div className="text-lg text-gray-600">Dragging {elementDragData.elementType}</div>
                      <div className="text-lg text-gray-500 mt-2">Drop anywhere to copy</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TransformComponent>
        </React.Fragment>
      </TransformWrapper>
    </div>
  );
};
