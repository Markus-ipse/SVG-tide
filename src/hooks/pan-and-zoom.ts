import { useState } from "react";
import { canvasSize } from "../canvasSize";

const initialViewBox = {
  minX: 0,
  minY: 0,
  width: canvasSize.width,
  height: canvasSize.height,
};

export const usePanAndZoom = () => {
  // Initialize viewBox state
  const [viewBox, setViewBox] = useState(initialViewBox);

  // State to track if the mouse is pressed down
  const [isMouseDown, setIsMouseDown] = useState(false);
  // State to store the initial mouse position
  const [initialMousePosition, setInitialMousePosition] = useState({
    x: 0,
    y: 0,
  });

  // Handle mouse down event
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (e.button !== 1) return; // Only handle middle mouse button

    setIsMouseDown(true);
    setInitialMousePosition({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse up event
  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  // Handle mouse move event
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (isMouseDown) {
      const dx = e.clientX - initialMousePosition.x;
      const dy = e.clientY - initialMousePosition.y;

      // Convert dx and dy to SVG space
      const svgDx = dx * (viewBox.width / canvasSize.width);
      const svgDy = dy * (viewBox.height / canvasSize.height);

      handlePan(-svgDx, -svgDy);

      // Update initial position for smooth panning
      setInitialMousePosition({ x: e.clientX, y: e.clientY });
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
    setViewBox((prevViewBox) => ({
      ...prevViewBox,
      minX: prevViewBox.minX + dx,
      minY: prevViewBox.minY + dy,
    }));
  };

  // reset pan and zoom
  const reset = () => setViewBox(initialViewBox);

  const zoomLevel = canvasSize.width / viewBox.width;

  return {
    viewBox,
    zoomLevel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleZoom,
    reset,
  };
};
