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
  const handleZoom = (zoomIn: boolean) => {
    const scaleFactor = 0.01;
    const zoomAmount = zoomIn ? 1 - scaleFactor : 1 + scaleFactor;
    setViewBox((prevViewBox) => ({
      ...prevViewBox,
      width: prevViewBox.width * zoomAmount,
      height: prevViewBox.height * zoomAmount,
    }));
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

  return {
    viewBox,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleZoom,
    reset,
  };
};
