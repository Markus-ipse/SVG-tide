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
    startPos: dragInteractionRef,
    setStartPos: (
      startFrom: Coord,
      opts: { ignoreZoom: boolean } = { ignoreZoom: false }
    ) => {
      console.log("useCanvas > set StartPos", startFrom, opts);

      dragInteractionRef.current = opts.ignoreZoom
        ? startFrom
        : takeZoomIntoAccount(startFrom);
      return dragInteractionRef.current;
    },
    reset: () => {
      console.log("useCanvas > reset StartPos");

      dragInteractionRef.current = null;
    },
  };

  const takeZoomIntoAccount = (coord: Coord) => ({
    x: coord.x / zoomLevel + viewBox.minX,
    y: coord.y / zoomLevel + viewBox.minY,
  });

  // Handle mouse down event
  const startPanning = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    // save the start position of the canvas
    setPrePanViewBox(viewBox);

    dragInteraction.setStartPos(
      { x: e.clientX, y: e.clientY },
      { ignoreZoom: true }
    );
  };

  // Handle mouse up event
  const stopPanning = () => {
    dragInteraction.reset();
    setPrePanViewBox(null);
  };

  const handlePan = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (dragInteraction.startPos.current) {
      assertOk(prePanViewBox !== null);

      const deltaX =
        (dragInteraction.startPos.current.x - e.clientX) / zoomLevel;
      const deltaY =
        (dragInteraction.startPos.current.y - e.clientY) / zoomLevel;

      const { minX: originalX, minY: originalY } = prePanViewBox;

      panCanvas(originalX + deltaX, originalY + deltaY);
    }
  };

  // Handle zoom
  const handleZoom = (zoomIn: boolean, mouse: Coord) => {
    const scaleFactor = 0.1;
    const zoomAmount = zoomIn ? 1 - scaleFactor : 1 + scaleFactor;

    zoomCanvas(zoomAmount, mouse);
  };

  return {
    viewBox,
    zoomLevel,
    dragInteraction,
    startPanning,
    handlePan,
    stopPanning,
    handleZoom,
    takeZoomIntoAccount,
    resetPanZoom,
  };
};
