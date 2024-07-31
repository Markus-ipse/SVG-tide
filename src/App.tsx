import React, {
  createElement,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Circle, Coord, Polygon, SvgItem } from "./types";
import "./App.css";
import { ElementList } from "./components/ElementList";
import { AttributeEditor } from "./components/AttributeEditor";
import { Button } from "./components/Button";
import { canvasSize } from "./canvasSize";
import { usePanAndZoom } from "./hooks/pan-and-zoom";
import { useWheelEventOverrides } from "./hooks/browser-zoom-prevention";
import { assertNever, assertOk } from "./utils/assert";
import { produce } from "immer";
import { createCircle, createPolygon, createRect } from "./utils/shape-factory";
import { SelectionMarker } from "./components/SelectionMarker";
import { ShapeIcon } from "./components/icons/Shapes";
import { CursorArrowRaysIcon } from "@heroicons/react/24/outline";
import {
  calculateDistance,
  getCoords,
  getPolygonPath,
} from "./utils/shape-utils";

type Tool = "rectangle" | "circle" | "polygon" | "grab" | null;

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
    }),
  ]);

  const [selectedElementId, setSelectedElementId] = useState<number | null>(1);
  const [selectionBounds, setSelectionBounds] = useState<DOMRect | null>(null);

  const selectedElement = useMemo(
    () => svgItems.find((el) => el.id === selectedElementId) ?? null,
    [svgItems, selectedElementId]
  );

  const [activeTool, setActiveTool] = useState<Tool>(null);

  const isDraggingRef = useRef<
    | false
    | {
        startX: number;
        startY: number;
        draggedItem: DraggedItem | null;
      }
  >(false);

  const paz = usePanAndZoom();

  const startDragInteraction = (e: React.MouseEvent, svgItem?: SvgItem) => {
    const startX = e.nativeEvent.offsetX / paz.zoomLevel + paz.viewBox.minX;
    const startY = e.nativeEvent.offsetY / paz.zoomLevel + paz.viewBox.minY;

    let itemPos: DraggedItem | null = null;

    if (svgItem?.type === "rect") {
      itemPos = {
        type: svgItem.type,
        x: +svgItem.attr.x,
        y: +svgItem.attr.y,
      };
    } else if (svgItem?.type === "circle") {
      itemPos = {
        type: svgItem.type,
        x: +svgItem.attr.cx,
        y: +svgItem.attr.cy,
      };
    } else if (svgItem?.type === "polygon") {
      itemPos = {
        type: svgItem.type,
        x: +svgItem.attr.cx,
        y: +svgItem.attr.cy,
      };
    }

    isDraggingRef.current = {
      startX,
      startY,
      draggedItem: itemPos,
    };

    return isDraggingRef.current;
  };

  const handleStartDrawing = (e: React.MouseEvent) => {
    if (!activeTool) return;

    startDragInteraction(e);
    assertOk(isDraggingRef.current);

    switch (activeTool) {
      case "rectangle":
        addElement(
          createRect({
            x: isDraggingRef.current.startX,
            y: isDraggingRef.current.startY,
            width: 0,
            height: 0,
          })
        );

        break;

      case "circle":
        addElement(
          createCircle({
            cx: isDraggingRef.current.startX,
            cy: isDraggingRef.current.startY,
            r: 0,
          })
        );
        break;
      case "polygon":
        addElement(
          createPolygon({
            cx: isDraggingRef.current.startX,
            cy: isDraggingRef.current.startY,
            r: 0,
            sides: 5,
            points: [],
          })
        );
        break;
      case "grab":
        break;
      default:
        assertNever(activeTool);
    }
  };

  const handleDrawing = (e: React.MouseEvent) => {
    if (!activeTool || svgItems.length === 0 || isDraggingRef.current === false)
      return;

    const newX = e.nativeEvent.offsetX / paz.zoomLevel + paz.viewBox.minX;
    const newY = e.nativeEvent.offsetY / paz.zoomLevel + paz.viewBox.minY;

    const deltaX = newX - isDraggingRef.current.startX;
    const deltaY = newY - isDraggingRef.current.startY;

    const latestSvgItem = svgItems[svgItems.length - 1];

    switch (activeTool) {
      case "rectangle": {
        assertOk(isDraggingRef.current);
        assertOk(latestSvgItem.type === "rect");

        // Calculate new position and size
        const newWidth = Math.abs(deltaX);
        const newHeight = Math.abs(deltaY);
        const minX = Math.min(newX, isDraggingRef.current.startX);
        const minY = Math.min(newY, isDraggingRef.current.startY);

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
        assertOk(isDraggingRef.current);
        assertOk(latestSvgItem.type === "circle");

        // Calculate new radius
        const newRadius = calculateDistance(getCoords(latestSvgItem), {
          x: newX,
          y: newY,
        });

        // Update the circle's attributes
        setAttributes(latestSvgItem, { r: newRadius });

        break;
      }

      case "polygon": {
        assertOk(isDraggingRef.current);
        assertOk(latestSvgItem.type === "polygon");

        // Calculate new radius
        const newRadius = calculateDistance(getCoords(latestSvgItem), {
          x: newX,
          y: newY,
        });

        setAttributes(latestSvgItem, {
          r: newRadius,
        });

        break;
      }

      case "grab": {
        if (selectedElement) {
          const preDragPos = isDraggingRef.current.draggedItem;
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

      default:
        assertNever(activeTool);
    }
  };

  const stopDrawing = () => {
    isDraggingRef.current = false;
    setActiveTool(null); // Stop drawing
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
    paz.viewBox.minX,
    paz.viewBox.minY,
    paz.viewBox.width,
    paz.viewBox.height,
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
            <Button
              className="border p-2 rounded-md "
              toggled={activeTool === null}
              onClick={() => setActiveTool(null)}
            >
              <CursorArrowRaysIcon className="size-4" />
            </Button>
            <Button
              className="border p-2 rounded-md"
              toggled={activeTool === "rectangle"}
              onClick={() => setActiveTool("rectangle")}
            >
              <ShapeIcon shape="rect" />
            </Button>
            <Button
              className="border p-2 rounded-md"
              toggled={activeTool === "circle"}
              onClick={() => setActiveTool("circle")}
            >
              <ShapeIcon shape="circle" />
            </Button>
            <Button
              className="border p-2 rounded-md"
              toggled={activeTool === "polygon"}
              onClick={() => setActiveTool("polygon")}
            >
              <ShapeIcon shape="polygon" />
            </Button>
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
            onMouseDown={(e) =>
              activeTool ? handleStartDrawing(e) : paz.handleMouseDown(e)
            }
            onMouseMove={(e) =>
              activeTool ? handleDrawing(e) : paz.handleMouseMove(e)
            }
            onMouseUp={() => (activeTool ? stopDrawing() : paz.handleMouseUp())}
            onMouseLeave={paz.handleMouseUp} // Handle case where mouse leaves the SVG area
            onWheel={(e) =>
              paz.handleZoom(
                e.deltaY < 0,
                e.nativeEvent.offsetX,
                e.nativeEvent.offsetY
              )
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
                      e.stopPropagation(); // Prevent canvas click event from firing (deselecting)
                    },
                    onMouseDown: (e) => {
                      if (e.button !== 0) return; // Only handle left mouse button
                      if (activeTool) return; // Don't start dragging if we're drawing a shape (or already dragging)
                      setSelectedElementId(element.id);
                      startDragInteraction(e, element);
                      setActiveTool("grab");
                    },
                    onMouseUp: (e) => {
                      if (e.button !== 0) return; // Only handle left mouse button
                      setActiveTool(null);
                    },
                    key: element.id,
                    ...toSvgElementAttr(element),
                  })}
                </g>
              );
            })}
            {selectionBounds && (
              <SelectionMarker
                selectionBounds={selectionBounds}
                zoomLevel={paz.zoomLevel}
              />
            )}
          </svg>
          <div className="pt-2">
            <span className="font-semibold mr-1">Zoom:</span>
            {Math.round(paz.zoomLevel * 100)}%
            <span className="font-semibold ml-4 mr-1">X/Y offset:</span>
            {Math.round(paz.viewBox.minX)}, {Math.round(paz.viewBox.minY)}
            <Button className="border p-1 rounded-md ml-6" onClick={paz.reset}>
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
    default:
      assertNever(activeTool);
  }
};
