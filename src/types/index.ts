export type SvgShapeElements =
  | "rect"
  | "circle"
  | "ellipse"
  | "line"
  | "polyline"
  | "polygon"
  | "path";

export type SvgElement = {
  id: number;
  type: SvgShapeElements;
  attr: React.SVGProps<SVGElement>;
};
