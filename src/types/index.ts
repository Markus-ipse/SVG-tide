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

export type SvgItem = {
  id: number;
  type: SvgShapeElements;
  attr: React.SVGProps<SVGElement>;
};
