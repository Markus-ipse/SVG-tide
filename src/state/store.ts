import { create } from "zustand";
import { canvasSize } from "../canvasSize";
import { Coord } from "../types";

interface AppState {
  selectedTool: Tool;
  toolIsActive: boolean;
  viewBox: ViewBox;
  interactionStart: Coord | null;
  setSelectedTool: (tool: Tool) => void;
  setToolIsActive: (isActive: boolean) => void;
  setInteractionStart: (coord: Coord) => void;
  clearInteractionStart: () => void;
  panCanvas: (newX: number, newY: number) => void;
  zoomCanvas: (zoomAmount: number, mouse: Coord) => void;
  resetPanZoom: () => void;
}

const initialViewBox: ViewBox = {
  minX: 0,
  minY: 0,
  width: canvasSize.width,
  height: canvasSize.height,
};

export const useStore = create<AppState>()((set) => ({
  selectedTool: null,
  toolIsActive: false,
  viewBox: initialViewBox,
  interactionStart: null,
  setInteractionStart: (coord) => set({ interactionStart: coord }),
  clearInteractionStart: () => set({ interactionStart: null }),
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setToolIsActive: (isActive) => set({ toolIsActive: isActive }),
  panCanvas: (newX, newY) =>
    set((appState) => {
      const current = appState.viewBox;

      return {
        viewBox: {
          ...current,
          minX: newX,
          minY: newY,
        },
      };
    }),
  zoomCanvas: (zoomAmount, mouse) =>
    set((appState) => {
      console.log("zooming", appState.viewBox);

      const prevViewBox = appState.viewBox;

      // Calculate the mouse position relative to the SVG content
      const svgPointBeforeZoom = {
        x: (mouse.x / canvasSize.width) * prevViewBox.width + prevViewBox.minX,
        y:
          (mouse.y / canvasSize.height) * prevViewBox.height + prevViewBox.minY,
      };

      // Calculate the new viewBox size
      const newWidth = prevViewBox.width * zoomAmount;
      const newHeight = prevViewBox.height * zoomAmount;

      // Calculate how much the viewBox needs to shift to keep the mouse position fixed
      const dx = (svgPointBeforeZoom.x - prevViewBox.minX) * (1 - zoomAmount);
      const dy = (svgPointBeforeZoom.y - prevViewBox.minY) * (1 - zoomAmount);

      return {
        viewBox: {
          ...prevViewBox,
          minX: prevViewBox.minX + dx,
          minY: prevViewBox.minY + dy,
          width: newWidth,
          height: newHeight,
        },
      };
    }),
  resetPanZoom: () => set({ viewBox: initialViewBox }),
}));

export type Tool = "rectangle" | "circle" | "polygon" | "grab" | "scale" | null;

export type ViewBox = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};
