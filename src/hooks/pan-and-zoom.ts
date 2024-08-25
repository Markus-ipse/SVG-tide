import { useRef, useState } from "react";
import { canvasSize } from "../canvasSize";
import { Coord } from "../types";
import { assertOk } from "../utils/assert";
import { useStore, type ViewBox } from "../state/store";

export const useCanvas = () => {
  const dragInteractionRef = useRef<Coord | null>(null);

  const [prePanViewBox, setPrePanViewBox] = useState<ViewBox | null>(null);

  const zoomCanvas = useStore((state) => state.zoomCanvas);
  const panCanvas = useStore((state) => state.panCanvas);
  const resetPanZoom = useStore((state) => state.resetPanZoom);
  const viewBox = useStore((state) => state.viewBox);

  const zoomLevel = canvasSize.width / viewBox.width;

  const dragInteraction = {
    startPos: dragInteractionRef.current,
    setStartPos: (
      startFrom: Coord,
      opts: { ignoreZoom: boolean } = { ignoreZoom: false }
    ) => {
      dragInteractionRef.current = opts.ignoreZoom
        ? startFrom
        : takeZoomIntoAccount(startFrom);
      return dragInteractionRef.current;
    },
    reset: () => {
      dragInteractionRef.current = null;
    },
  };

  const takeZoomIntoAccount = (coord: Coord) => ({
    x: coord.x / zoomLevel + viewBox.minX,
    y: coord.y / zoomLevel + viewBox.minY,
  });

  // Handle mouse down event
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (e.button !== 1) return; // Only handle middle mouse button

    // save the start position of the canvas
    setPrePanViewBox(viewBox);

    dragInteraction.setStartPos(
      { x: e.clientX, y: e.clientY },
      { ignoreZoom: true }
    );
  };

  // Handle mouse up event
  const handleMouseUp = () => {
    console.log("mouse up");

    dragInteraction.reset();
    setPrePanViewBox(null);
  };

  // Handle mouse move event
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (dragInteraction.startPos) {
      assertOk(prePanViewBox !== null);

      const dx = e.clientX - dragInteraction.startPos.x;
      const dy = e.clientY - dragInteraction.startPos.y;

      // Convert dx and dy to SVG space
      const svgDx = dx / zoomLevel;
      const svgDy = dy / zoomLevel;

      panCanvas(prePanViewBox.minX - svgDx, prePanViewBox.minY - svgDy);
    }
  };

  // Handle zoom
  const handleZoom = (zoomIn: boolean, mouse: Coord) => {
    const scaleFactor = 0.1;
    const zoomAmount = zoomIn ? 1 - scaleFactor : 1 + scaleFactor;

    zoomCanvas(zoomAmount, mouse);
  };

  // reset pan and zoom
  const reset = () => resetPanZoom();

  return {
    viewBox,
    zoomLevel,
    dragInteraction,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleZoom,
    takeZoomIntoAccount,
    reset,
  };
};
