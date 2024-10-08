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

type DraggedItem =
  | ({ type: "rect" } & Coord)
  | ({ type: "circle" } & Coord)
  | ({ type: "polygon" } & Coord);

export function App() {
  const elementsRef = useRef<Map<SvgItem, SVGGElement> | null>(null);
  const canvasRef = useRef<SVGSVGElement | null>(null);

  const [svgItems, setSvgItems] = useState<SvgItem[]>(() => [
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
  ]);

  const [selectedElementId, setSelectedElementId] = useState<number | null>(1);
  const [selectionBounds, setSelectionBounds] = useState<DOMRect | null>(null);

  const selectedElement = useMemo(
    () => svgItems.find((el) => el.id === selectedElementId) ?? null,
    [svgItems, selectedElementId]
  );

  const activeTool = useStore((state) => state.activeTool);
  const setActiveTool = useStore((state) => state.setActiveTool);

  const dragItemStateRef = useRef<DraggedItem | null>(null);

  const canvas = useCanvas();

  const startDragInteraction = (mouseCoord: Coord, svgItem?: SvgItem) => {
    const startPos = canvas.dragInteraction.setStartPos(mouseCoord);

    let itemPos: DraggedItem | null = null;

    if (svgItem?.type === "rect") {
      itemPos = {
        type: svgItem.type,
        x: svgItem.attr.x,
        y: svgItem.attr.y,
      };
    } else if (svgItem?.type === "circle") {
      itemPos = {
        type: svgItem.type,
        x: svgItem.attr.cx,
        y: svgItem.attr.cy,
      };
    } else if (svgItem?.type === "polygon") {
      itemPos = {
        type: svgItem.type,
        x: svgItem.attr.cx,
        y: svgItem.attr.cy,
      };
    }

    dragItemStateRef.current = itemPos;

    return startPos;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!activeTool) return;

    const startPos = startDragInteraction(getCoordFromEvent(e));

    assertOk(startPos);

    switch (activeTool) {
      case "rectangle":
        addElement(
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
        addElement(
          createCircle({
            cx: startPos.x,
            cy: startPos.y,
            r: 0,
          })
        );
        break;
      case "polygon":
        addElement(
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
        assertNever(activeTool);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (
      !activeTool ||
      svgItems.length === 0 ||
      canvas.dragInteraction.startPos === null
    ) {
      return;
    }

    const newPos = canvas.takeZoomIntoAccount(getCoordFromEvent(e));

    const deltaX = newPos.x - canvas.dragInteraction.startPos.x;
    const deltaY = newPos.y - canvas.dragInteraction.startPos.y;

    const latestSvgItem = svgItems[svgItems.length - 1];

    switch (activeTool) {
      case "rectangle": {
        assertOk(latestSvgItem.type === "rect");

        // Calculate new position and size
        const newWidth = Math.abs(deltaX);
        const newHeight = Math.abs(deltaY);

        // if dragging to the right or down, the rectangle will start at the initial position and just get wider/taller
        // if dragging to the left or up, the rectangle will get wider/taller AND move its starting position to the cursor position
        const minX = Math.min(newPos.x, canvas.dragInteraction.startPos.x);
        const minY = Math.min(newPos.y, canvas.dragInteraction.startPos.y);

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
        if (selectedElement) {
          const preDragPos = dragItemStateRef.current;
          assertOk(preDragPos);
          assertOk(selectedElement.type === preDragPos.type);

          if (preDragPos.type == "rect") {
            setAttributes(selectedElement, {
              x: preDragPos.x + deltaX,
              y: preDragPos.y + deltaY,
            });
          } else if (preDragPos.type == "circle") {
            setAttributes(selectedElement, {
              cx: preDragPos.x + deltaX,
              cy: preDragPos.y + deltaY,
            });
          } else if (preDragPos.type == "polygon") {
            setAttributes(selectedElement, {
              cx: preDragPos.x + deltaX,
              cy: preDragPos.y + deltaY,
            });
          }
        }
        break;
      }

      case "scale": {
        // todo: implement scaling
        break;
      }

      default:
        assertNever(activeTool);
    }
  };

  const stopDrawing = () => {
    console.log("stopDrawing");
    dragItemStateRef.current = null;
    canvas.dragInteraction.reset();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!selectedElement) return;

    if (e.key === "Delete" || e.key === "x") {
      removeElement(selectedElement.id);
      setSelectedElementId(null);
      return;
    }

    if (e.key === "f" || e.key === "b") {
      const delta = e.key === "b" ? 1 : -1;
      const currentIndex = svgItems.findIndex(
        (el) => el.id === selectedElement.id
      );
      const newIndex = currentIndex + delta;

      if (newIndex < 0 || newIndex >= svgItems.length) return;

      reorderElement(currentIndex, newIndex);
    }
  };

  // Prevent browser zoom when scrolling/pinching on canvas
  useWheelEventOverrides(canvasRef);

  useLayoutEffect(() => {
    const domNode = selectedElement && getMap().get(selectedElement);
    if (!domNode) {
      setSelectionBounds(null);
      return;
    }

    setSelectionBounds(domNode.getBBox());
  }, [selectedElement]);

  const addElement = (elem: SvgItem) => {
    setSvgItems((elements) => [...elements, elem]);
    return elem;
  };

  const removeElement = (id: number) => {
    setSvgItems((elements) => elements.filter((el) => el.id !== id));
  };

  const setAttributes = <
    T extends SvgItem["type"],
    U extends Extract<SvgItem, { type: T }>,
  >(
    svgItem: { id: number; type: T },
    newAttr: Partial<U["attr"]>
  ) => {
    setSvgItems((elements) =>
      elements.map((el) => {
        if (el.id === svgItem.id) {
          return produce(el, (draft) => {
            draft.attr = { ...draft.attr, ...newAttr };
          });
        }

        return el;
      })
    );
  };

  const reorderElement = (currentIndex: number, newIndex: number) => {
    const result = Array.from(svgItems);
    const [removed] = result.splice(currentIndex, 1);
    result.splice(newIndex, 0, removed);

    setSvgItems(result);
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
              cursor: getCursor(activeTool),
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
              activeTool ? handleMouseMove(e) : canvas.handlePan(e)
            }
            onMouseUp={() =>
              activeTool ? stopDrawing() : canvas.stopPanning()
            }
            onMouseLeave={canvas.stopPanning} // Handle case where mouse leaves the SVG area
            onWheel={(e) =>
              canvas.handleZoom(e.deltaY < 0, getCoordFromEvent(e))
            }
            onClick={() => {
              setSelectedElementId(null);
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

            {svgItems.toReversed().map((element) => {
              const { type } = element;

              return (
                <g
                  id={element.id.toString()}
                  key={element.id}
                  ref={(node) => {
                    const map = getMap();
                    if (node) {
                      map.set(element, node);
                    } else {
                      map.delete(element);
                    }
                  }}
                >
                  <title>{`${type} ${element.id}`}</title>
                  {createElement(type, {
                    onClick: (e) => {
                      console.log(
                        "clicked",
                        element.type,
                        element.id,
                        "Stopping propagation"
                      );

                      e.stopPropagation(); // Prevent canvas click event from firing (deselecting)
                    },
                    onMouseDown: (e) => {
                      if (!isLeftButton(e)) return; // Only handle left mouse button
                      if (activeTool) return; // Don't start dragging if we're drawing a shape (or already dragging)
                      setSelectedElementId(element.id);
                      startDragInteraction(getCoordFromEvent(e), element);
                      setActiveTool("grab");
                    },
                    onMouseUp: (e) => {
                      if (!isLeftButton(e)) return; // Only handle left mouse button
                      if (activeTool === "grab") {
                        setActiveTool(null);
                      }
                    },
                    key: element.id,
                    ...toSvgElementAttr(element),
                  })}
                </g>
              );
            })}
            {selectionBounds && (
              <SelectionMarker
                type={activeTool === "scale" ? "scale" : "default"}
                selectionBounds={selectionBounds}
                zoomLevel={canvas.zoomLevel}
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
            onRemove={removeElement}
            onReorder={reorderElement}
            onSelect={setSelectedElementId}
            className="mb-2"
            selectedElementId={selectedElementId}
          />
          <AttributeEditor svgItem={selectedElement} onChange={setAttributes} />
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

const getCursor = (activeTool: Tool) => {
  switch (activeTool) {
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
      assertNever(activeTool);
  }
};
