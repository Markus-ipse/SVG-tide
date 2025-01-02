import React, {
  createElement,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Coord, SvgItem } from "./types";
import "./App.css";
import { ElementList } from "./components/ElementList";
import { AttributeEditor } from "./components/AttributeEditor";
import { Button } from "./components/Button";
import { canvasSize } from "./canvasSize";
import { useCanvas } from "./hooks/pan-and-zoom";
import { useWheelEventOverrides } from "./hooks/browser-zoom-prevention";
import { assertNever, assertOk } from "./utils/assert";
import { produce } from "immer";
import { createCircle, createPolygon, createRect } from "./utils/shape-factory";
import { SelectionMarker } from "./components/SelectionMarker";
import {
  calculateDistance,
  getCoords,
  getPolygonPath,
} from "./utils/shape-utils";
import { getCoordFromEvent } from "./utils/get-coord-from-event";
import { useStore } from "./state/store";
import type { Tool } from "./state/store";
import { Toolbar } from "./components/Toolbar";
import { isLeftButton, isMiddleButton } from "./utils/mouse-button";
import type { ScaleHandle } from "./utils/shape-utils";

export function App() {
  const elementsRef = useRef<Map<SvgItem, SVGGElement> | null>(null);
  const canvasRef = useRef<SVGSVGElement | null>(null);

  const svgItems = useStore((state) => state.svgItems);
  const selectedElementId = useStore((state) => state.selectedSvgItemId);
  const [selectionBounds, setSelectionBounds] = useState<DOMRect | null>(null);

  const selectedSvgItem = useMemo(
    () => svgItems.find((el) => el.id === selectedElementId) ?? null,
    [svgItems, selectedElementId]
  );

  const selectedTool = useStore((state) => state.selectedTool);
  const setSelectedTool = useStore((state) => state.setSelectedTool);

  const setSelectedSvgItem = useStore((state) => state.setSelectedSvgItem);
  const addSvgItem = useStore((state) => state.addSvgItem);
  const removeSvgItem = useStore((state) => state.removeSvgItem);
  const reorderSvgItem = useStore((state) => state.reorderSvgItem);

  const setAttributes = useStore((state) => state.setAttributes);

  const preInteractionItemState = useRef<SvgItem | null>(null);

  const canvas = useCanvas();

  const startDragInteraction = (mouseCoord: Coord, svgItem?: SvgItem) => {
    const startPos = canvas.dragInteraction.setStartPos(mouseCoord);

    preInteractionItemState.current =
      (svgItem && cloneElement(svgItem)) ?? null;
    console.log("startDragInteraction", preInteractionItemState.current);

    return startPos;
  };

  const handleScaleStart = (
    e: React.MouseEvent,
    handle: ScaleHandle,
    bounds: DOMRect
  ) => {
    assertOk(selectedSvgItem);
    const startPos = startDragInteraction(
      getCoordFromEvent(e),
      selectedSvgItem
    );
    console.log(
      `selectBox > scale-handle click - scale from: ${handle}`,
      startPos,
      bounds
    );
    e.stopPropagation();
  };
  console.log("SVG => render", selectedSvgItem?.attr);

  // mouse down on SVG canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectedTool) return;
    console.log(`SVG => handleMouseDown [${selectedTool}]`);
    const startPos = startDragInteraction(getCoordFromEvent(e));

    assertOk(startPos);

    switch (selectedTool) {
      case "rectangle":
        addSvgItem(
          createRect({
            x: startPos.x,
            y: startPos.y,
            width: 0,
            height: 0,
            rx: 0,
          })
        );

        break;

      case "circle":
        addSvgItem(
          createCircle({
            cx: startPos.x,
            cy: startPos.y,
            r: 0,
          })
        );
        break;
      case "polygon":
        addSvgItem(
          createPolygon({
            cx: startPos.x,
            cy: startPos.y,
            r: 0,
            sides: 5,
            points: [],
          })
        );
        break;
      case "scale":
      case "grab":
        break;
      default:
        assertNever(selectedTool);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (
      !selectedTool ||
      // svgItems.length === 0 ||
      canvas.dragInteraction.startPos.current === null
    ) {
      return;
    }

    const newPos = canvas.takeZoomIntoAccount(getCoordFromEvent(e));

    const deltaX = newPos.x - canvas.dragInteraction.startPos.current.x;
    const deltaY = newPos.y - canvas.dragInteraction.startPos.current.y;

    const latestSvgItem = svgItems[svgItems.length - 1];

    switch (selectedTool) {
      case "rectangle": {
        assertOk(latestSvgItem.type === "rect");

        // Calculate new position and size
        const newWidth = Math.abs(deltaX);
        const newHeight = Math.abs(deltaY);

        // if dragging to the right or down, the rectangle will start at the initial position and just get wider/taller
        // if dragging to the left or up, the rectangle will get wider/taller AND move its starting position to the cursor position
        const minX = Math.min(
          newPos.x,
          canvas.dragInteraction.startPos.current.x
        );
        const minY = Math.min(
          newPos.y,
          canvas.dragInteraction.startPos.current.y
        );

        // Update the rectangle's attributes
        setAttributes(latestSvgItem, {
          x: minX,
          y: minY,
          width: newWidth,
          height: newHeight,
        });

        break;
      }

      case "circle": {
        assertOk(latestSvgItem.type === "circle");

        // Calculate new radius
        const newRadius = calculateDistance(getCoords(latestSvgItem), newPos);

        // Update the circle's attributes
        setAttributes(latestSvgItem, { r: newRadius });

        break;
      }

      case "polygon": {
        assertOk(latestSvgItem.type === "polygon");

        // Calculate new radius
        const newRadius = calculateDistance(getCoords(latestSvgItem), newPos);

        setAttributes(latestSvgItem, {
          r: newRadius,
        });

        break;
      }

      case "grab": {
        if (selectedSvgItem) {
          const preDragPos = preInteractionItemState.current;
          assertOk(preDragPos);
          assertOk(selectedSvgItem.type === preDragPos.type);

          if (preDragPos.type == "rect") {
            setAttributes(selectedSvgItem, {
              x: preDragPos.attr.x + deltaX,
              y: preDragPos.attr.y + deltaY,
            });
          } else if (preDragPos.type == "circle") {
            setAttributes(selectedSvgItem, {
              cx: preDragPos.attr.cx + deltaX,
              cy: preDragPos.attr.cy + deltaY,
            });
          } else if (preDragPos.type == "polygon") {
            setAttributes(selectedSvgItem, {
              cx: preDragPos.attr.cx + deltaX,
              cy: preDragPos.attr.cy + deltaY,
            });
          }
        }
        break;
      }

      case "scale": {
        console.log(
          "SVG => handleMouseMove > scale",
          selectedSvgItem,
          preInteractionItemState.current
        );
        if (!selectedSvgItem || !preInteractionItemState.current) break;
        switch (preInteractionItemState.current.type) {
          case "rect": {
            // Define the calculateScaleRect function or replace with the correct function name
            // Calculate new position and size
            const newWidth =
              preInteractionItemState.current.attr.width + deltaX;
            const newHeight =
              preInteractionItemState.current.attr.height + deltaY;

            const minX = preInteractionItemState.current.attr.x;
            const minY = preInteractionItemState.current.attr.y;

            // Update the rectangle's attributes
            setAttributes(selectedSvgItem, {
              x: minX,
              y: minY,
              width: newWidth,
              height: newHeight,
            });
          }
        }

        break;
      }

      default:
        assertNever(selectedTool);
    }
  };

  const stopDrawing = () => {
    console.log("SVG => mouseUp (stopDrawing)");
    preInteractionItemState.current = null;
    canvas.dragInteraction.reset();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!selectedSvgItem) return;

    if (e.key === "Delete" || e.key === "x") {
      removeSvgItem(selectedSvgItem.id);
      setSelectedSvgItem(null);
      return;
    }

    if (e.key === "f" || e.key === "b") {
      const delta = e.key === "b" ? 1 : -1;
      const currentIndex = svgItems.findIndex(
        (el) => el.id === selectedSvgItem.id
      );
      const newIndex = currentIndex + delta;

      if (newIndex < 0 || newIndex >= svgItems.length) return;

      reorderSvgItem(currentIndex, newIndex);
    }
  };

  // Prevent browser zoom when scrolling/pinching on canvas
  useWheelEventOverrides(canvasRef);

  useLayoutEffect(() => {
    const domNode = selectedSvgItem && getMap().get(selectedSvgItem);
    console.log("useLayoutEffect", selectedSvgItem, domNode);

    if (!domNode) {
      setSelectionBounds(null);
      return;
    }

    setSelectionBounds(domNode.getBBox());
  }, [selectedSvgItem, svgItems]);

  // Clone SvgItem
  const cloneElement = <T extends SvgItem>(svgItem: T): T => {
    return { ...svgItem, attr: { ...svgItem.attr } };
  };

  function getMap() {
    if (!elementsRef.current) {
      // Initialize the Map on first usage.
      elementsRef.current = new Map();
    }
    return elementsRef.current;
  }

  const viewBoxStr = [
    canvas.viewBox.minX,
    canvas.viewBox.minY,
    canvas.viewBox.width,
    canvas.viewBox.height,
  ].join(" ");

  return (
    <div>
      <div className="flex m-8 ">
        <h1 className="text-xl font-semibold">SVG TidE </h1>
        <a
          className="ml-auto"
          href="https://github.com/Markus-ipse/SVG-tide"
          target="_blank"
          aria-label="view source on GitHub"
          title="View source on GitHub"
        >
          <svg
            height="24"
            aria-hidden="true"
            viewBox="0 0 16 16"
            version="1.1"
            width="24"
            data-view-component="true"
          >
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
          </svg>
        </a>
      </div>
      <div className="flex m-8">
        <div>
          <h4 className="text-l font-semibold">Tools</h4>
          <div className="flex flex-wrap gap-2 mr-2 p-2 border-2 border-slate-200">
            <Toolbar />
          </div>
        </div>
        <div>
          <svg
            style={{
              backgroundColor: "#EEE",
              touchAction: "none",
              cursor: getCursor(selectedTool),
            }}
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="border-2 border-slate-200"
            viewBox={viewBoxStr}
            tabIndex={-1}
            onKeyDown={handleKeyPress}
            onMouseDown={(e) => {
              if (isLeftButton(e)) {
                handleMouseDown(e);
              } else if (isMiddleButton(e)) {
                canvas.startPanning(e);
              }
            }}
            onMouseMove={(e) =>
              selectedTool ? handleMouseMove(e) : canvas.handlePan(e)
            }
            onMouseUp={() =>
              selectedTool ? stopDrawing() : canvas.stopPanning()
            }
            onMouseLeave={canvas.stopPanning} // Handle case where mouse leaves the SVG area
            onWheel={(e) =>
              canvas.handleZoom(e.deltaY < 0, getCoordFromEvent(e))
            }
            onClick={() => {
              setSelectedSvgItem(null);
            }}
          >
            <rect
              id="canvas-bg"
              x={0}
              y={0}
              width={canvasSize.width}
              height={canvasSize.height}
              fill="#FFF"
            />

            {svgItems.toReversed().map((svgItem) => {
              const { type } = svgItem;

              return (
                <g
                  id={svgItem.id.toString()}
                  key={svgItem.id}
                  ref={(node) => {
                    const map = getMap();
                    if (node) {
                      map.set(svgItem, node);
                    } else {
                      map.delete(svgItem);
                    }
                  }}
                >
                  <title>{`${type} ${svgItem.id}`}</title>
                  {createElement(type, {
                    onClick: (e) => {
                      console.log(
                        "elem clicked",
                        svgItem.type,
                        svgItem.id,
                        "Stopping propagation"
                      );

                      e.stopPropagation(); // Prevent canvas click event from firing (deselecting)
                    },
                    onMouseDown: (e) => {
                      if (!isLeftButton(e)) return; // Only handle left mouse button
                      if (selectedTool) return; // Don't start dragging if we're drawing a shape (or already dragging)
                      setSelectedSvgItem(svgItem);
                      startDragInteraction(getCoordFromEvent(e), svgItem);
                      setSelectedTool("grab");
                    },
                    onMouseUp: (e) => {
                      if (!isLeftButton(e)) return; // Only handle left mouse button
                      if (selectedTool === "grab") {
                        setSelectedTool(null);
                      }
                    },
                    key: svgItem.id,
                    ...toSvgElementAttr(svgItem),
                  })}
                </g>
              );
            })}
            {selectionBounds && (
              <SelectionMarker
                type={selectedTool === "scale" ? "scale" : "default"}
                selectionBounds={selectionBounds}
                zoomLevel={canvas.zoomLevel}
                onHandleMouseDown={(e, handle) => {
                  if (selectedTool === "scale") {
                    handleScaleStart(e, handle, selectionBounds);
                  }
                }}
              />
            )}
          </svg>
          <div className="pt-2">
            <span className="font-semibold mr-1">Zoom:</span>
            {Math.round(canvas.zoomLevel * 100)}%
            <span className="font-semibold ml-4 mr-1">X/Y offset:</span>
            {Math.round(canvas.viewBox.minX)}, {Math.round(canvas.viewBox.minY)}
            <Button
              className="border p-1 rounded-md ml-6"
              onClick={canvas.resetPanZoom}
            >
              Reset pan & zoom
            </Button>
          </div>
        </div>
        <div className="ml-2 w-[24rem]">
          <ElementList
            elements={svgItems}
            onRemove={removeSvgItem}
            onReorder={reorderSvgItem}
            onSelect={setSelectedSvgItem}
            className="mb-2"
            selectedSvgItem={selectedSvgItem}
          />
          <AttributeEditor svgItem={selectedSvgItem} onChange={setAttributes} />
        </div>
      </div>
    </div>
  );
}

const toSvgElementAttr = (item: SvgItem): React.SVGProps<SVGElement> => {
  switch (item.type) {
    case "rect":
      return item.attr;
    case "circle":
      return item.attr;
    case "polygon": {
      const path = getPolygonPath({
        cx: item.attr.cx,
        cy: item.attr.cy,
        sides: item.attr.sides,
        r: item.attr.r,
      });

      return {
        ...item.attr,
        points: path.map((p) => `${p.x},${p.y}`).join(" "),
      };
    }
    default:
      assertNever(item);
  }
};

const getCursor = (selectedTool: Tool) => {
  switch (selectedTool) {
    case null:
      return "default";
    case "grab":
      return "grab";
    case "rectangle":
    case "circle":
    case "polygon":
      return "crosshair";
    case "scale":
      return "nwse-resize";
    default:
      assertNever(selectedTool);
  }
};
