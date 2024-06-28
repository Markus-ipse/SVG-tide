export type SvgBasicShape =
  | "rect"
  | "circle"
  | "ellipse"
  | "line"
  | "polyline"
  | "polygon"
  | "path";

export type SvgElement = {
  id: number;
  type: SvgBasicShape;
  attr: React.SVGProps<SVGElement>;
};
