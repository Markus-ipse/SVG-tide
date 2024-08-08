import { Coord } from "../types";

export const getCoordFromEvent = (e: React.MouseEvent): Coord => ({
  x: e.nativeEvent.offsetX,
  y: e.nativeEvent.offsetY,
});
