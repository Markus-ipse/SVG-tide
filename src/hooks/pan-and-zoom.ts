import { useRef, useState } from "react";
import { canvasSize } from "../canvasSize";
import { Coord } from "../types";
import { assertOk } from "../utils/assert";

type viewBox = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

const initialViewBox: viewBox = {
  minX: 0,
  minY: 0,
  width: canvasSize.width,
  height: canvasSize.height,
};

export const useCanvas = () => {
  const dragInteractionRef = useRef<Coord | null>(null);

  // Initialize viewBox state
  const [viewBox, setViewBox] = useState<viewBox>(initialViewBox);
  const [prevViewBox, setPrevViewBox] = useState<viewBox | null>(null);

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
    setPrevViewBox(viewBox);

    dragInteraction.setStartPos(
      { x: e.clientX, y: e.clientY },
      { ignoreZoom: true }
    );
  };

  // Handle mouse up event
  const handleMouseUp = () => {
    console.log("mouse up");

    dragInteraction.reset();
    setPrevViewBox(null);
  };

  // Handle mouse move event
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (dragInteraction.startPos) {
      const dx = e.clientX - dragInteraction.startPos.x;
      const dy = e.clientY - dragInteraction.startPos.y;

      // Convert dx and dy to SVG space
      const svgDx = dx / zoomLevel;
      const svgDy = dy / zoomLevel;

      handlePan(-svgDx, -svgDy);
    }
  };

  // Handle zoom
  const handleZoom = (zoomIn: boolean, mouseX: number, mouseY: number) => {
    const scaleFactor = 0.1;
    const zoomAmount = zoomIn ? 1 - scaleFactor : 1 + scaleFactor;

    setViewBox((prevViewBox) => {
      // Calculate the mouse position relative to the SVG content
      const svgPointBeforeZoom = {
        x: (mouseX / canvasSize.width) * prevViewBox.width + prevViewBox.minX,
        y: (mouseY / canvasSize.height) * prevViewBox.height + prevViewBox.minY,
      };

      // Calculate the new viewBox size
      const newWidth = prevViewBox.width * zoomAmount;
      const newHeight = prevViewBox.height * zoomAmount;

      // Calculate how much the viewBox needs to shift to keep the mouse position fixed
      const dx = (svgPointBeforeZoom.x - prevViewBox.minX) * (1 - zoomAmount);
      const dy = (svgPointBeforeZoom.y - prevViewBox.minY) * (1 - zoomAmount);

      return {
        ...prevViewBox,
        minX: prevViewBox.minX + dx,
        minY: prevViewBox.minY + dy,
        width: newWidth,
        height: newHeight,
      };
    });
  };

  // Handle pan
  const handlePan = (dx: number, dy: number) => {
    assertOk(prevViewBox !== null);
    setViewBox((current) => ({
      ...current,
      minX: prevViewBox.minX + dx,
      minY: prevViewBox.minY + dy,
    }));
  };

  // reset pan and zoom
  const reset = () => setViewBox(initialViewBox);

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
