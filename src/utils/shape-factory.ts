import { Circle, Polygon, Rect, Shared } from "../types";

let idCounter = 0;

export const createRect = (
  rectInput: Omit<Rect["attr"], keyof Shared> & Partial<Shared>
): Rect => {
  return {
    id: idCounter++,
    type: "rect",
    attr: { ...defaults, ...rectInput },
  };
};

export const createCircle = (
  circleInput: Omit<Circle["attr"], keyof Shared> & Partial<Shared>
): Circle => {
  return {
    id: idCounter++,
    type: "circle",
    attr: { ...defaults, ...circleInput },
  };
};

export const createPolygon = (
  polygonInput: Omit<Polygon["attr"], keyof Shared> & Partial<Shared>
): Polygon => {
  return {
    id: idCounter++,
    type: "polygon",
    attr: { ...defaults, ...polygonInput },
  };
};

const defaults = {
  fill: "#000000",
  fillOpacity: 0,
  stroke: "#000000",
  strokeWidth: 2,
};
