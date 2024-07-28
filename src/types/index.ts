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

export type Rect = {
  id: number;
  type: "rect";
  attr: {
    x: number;
    y: number;
    width: number;
    height: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
};

export type Circle = {
  id: number;
  type: "circle";
  attr: {
    cx: number;
    cy: number;
    r: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
};

export type Polygon = {
  id: number;
  type: "polygon";
  attr: {
    points: Point[];
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
};

type Point = {
  x: number;
  y: number;
};

export type MappedOmit<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};
