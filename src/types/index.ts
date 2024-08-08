export const shapeElements = [
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "path",
] as const;

export type SvgShapeElements = (typeof shapeElements)[number];

export type SvgItem = Rect | Circle | Polygon;

export type Shared = {
  stroke: string;
  strokeWidth: number;
  fill: string;
  fillOpacity: number;
};

export type Rect = {
  id: number;
  type: "rect";
  attr: {
    x: number;
    y: number;
    width: number;
    height: number;
    rx: number;
  } & Shared;
};

export type Circle = {
  id: number;
  type: "circle";
  attr: {
    cx: number;
    cy: number;
    r: number;
  } & Shared;
};

export type Polygon = {
  id: number;
  type: "polygon";
  attr: {
    points: Coord[];
    sides: number;
    cx: number;
    cy: number;
    r: number;
  } & Shared;
};

export type Coord = {
  x: number;
  y: number;
};
