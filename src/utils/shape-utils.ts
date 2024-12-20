import { Coord, SvgItem } from "../types";
import { assertNever } from "./assert";

export const getPolygonPath = ({
  cx,
  cy,
  sides,
  r,
}: {
  cx: number;
  cy: number;
  sides: number;
  r: number;
}) => {
  const step = (2 * Math.PI) / sides; //Precalculate step value
  const shift = (Math.PI / 180.0) * (180 / sides + 90);

  const points: { x: number; y: number }[] = [];

  for (let i = 0; i <= sides; i++) {
    const curStep = i * step + shift;
    points.push({
      x: cx + r * Math.cos(curStep),
      y: cy + r * Math.sin(curStep),
    });
  }

  return points;
};

export const getCoords = (shape: SvgItem) => {
  switch (shape.type) {
    case "rect":
      return {
        x: shape.attr.x,
        y: shape.attr.y,
      };
    case "circle":
      return {
        x: shape.attr.cx,
        y: shape.attr.cy,
      };
    case "polygon":
      return {
        x: shape.attr.cx,
        y: shape.attr.cy,
      };
    default:
      assertNever(shape);
  }
};

export const calculateDistance = (p1: Coord, p2: Coord) =>
  Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

export type ScaleHandle =
  | "top-left"
  | "top-right"
  | "middle-left"
  | "middle-right"
  | "bottom-left"
  | "bottom-right";

export const calculateScale = (
  bounds: DOMRect,
  handle: ScaleHandle,
  mousePos: Coord,
  initialBounds: DOMRect
): { scaleX: number; scaleY: number; originX: number; originY: number } => {
  // Determine the scaling origin based on the handle
  const originX = handle.includes("right") ? bounds.x : bounds.x + bounds.width;
  const originY = handle.includes("bottom")
    ? bounds.y
    : bounds.y + bounds.height;

  // Calculate the distances from origin to mouse
  const currentDistX = Math.abs(mousePos.x - originX);
  const currentDistY = Math.abs(mousePos.y - originY);

  // Calculate initial distances from origin to handle
  const initialWidth = handle.includes("middle")
    ? initialBounds.width / 2
    : initialBounds.width;
  const initialHeight = handle.includes("middle")
    ? initialBounds.height
    : initialBounds.height;

  // Calculate scale factors
  const scaleX = handle.includes("middle") ? 1 : currentDistX / initialWidth;
  const scaleY = handle.includes("middle") ? 1 : currentDistY / initialHeight;

  return { scaleX, scaleY, originX, originY };
};
