import { create } from "zustand";
import { canvasSize } from "../canvasSize";
import { Coord, SvgItem } from "../types";
import {
  createCircle,
  createPolygon,
  createRect,
} from "../utils/shape-factory";
import { produce } from "immer";

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
  svgItems: SvgItem[];
  selectedSvgItemId: number | null;
  addSvgItem: (elem: SvgItem) => void;
  removeSvgItem: (id: number) => void;
  setSelectedSvgItem: (svgItem: SvgItem | null) => void;
  setAttributes: <
    T extends SvgItem["type"],
    U extends Extract<SvgItem, { type: T }>,
  >(
    svgItem: { id: number; type: T },
    newAttr: Partial<U["attr"]>
  ) => void;
  reorderSvgItem: (currentIndex: number, newIndex: number) => void;
}

const initialViewBox: ViewBox = {
  minX: 0,
  minY: 0,
  width: canvasSize.width,
  height: canvasSize.height,
};

const initialSvgItems: SvgItem[] = [
  createPolygon({
    cx: 150,
    cy: 150,
    r: 30,
    sides: 6,
    points: [],
    fill: "#00dd00",
    fillOpacity: 1,
    stroke: "#800080",
  }),
  createCircle({ cx: 150, cy: 150, r: 50, fill: "#FF0000", fillOpacity: 1 }),
  createRect({
    x: 50,
    y: 50,
    width: 200,
    height: 100,
    fill: "#BBC42A",
    fillOpacity: 1,
    strokeWidth: 0,
    rx: 10,
  }),
];

export const useStore = create<AppState>()((set, get) => ({
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
  svgItems: initialSvgItems,
  selectedSvgItemId: null,
  addSvgItem: (elem) =>
    set((state) => ({ svgItems: [...state.svgItems, elem] })),
  removeSvgItem: (id) =>
    set((state) => ({
      svgItems: state.svgItems.filter((el) => el.id !== id),
      selectedSvgItemId:
        state.selectedSvgItemId === id ? null : state.selectedSvgItemId,
    })),
  setSelectedSvgItem: (svgItem) =>
    set({ selectedSvgItemId: svgItem?.id ?? null }),
  setAttributes: (svgItem, newAttr) =>
    set((state) => ({
      svgItems: state.svgItems.map((el) => {
        if (el.id === svgItem.id) {
          return produce(el, (draft) => {
            draft.attr = { ...draft.attr, ...newAttr };
          });
        }
        return el;
      }),
    })),
  reorderSvgItem: (currentIndex, newIndex) =>
    set((state) => {
      const result = Array.from(state.svgItems);
      const [removed] = result.splice(currentIndex, 1);
      result.splice(newIndex, 0, removed);
      return { svgItems: result };
    }),
}));

export type Tool = "rectangle" | "circle" | "polygon" | "grab" | "scale" | null;

export type ViewBox = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};
