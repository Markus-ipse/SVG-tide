import React, {
  createElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SvgItem } from "./types";
import "./App.css";
import { ElementList } from "./components/ElementList";
import { AttributeEditor } from "./components/AttributeEditor";
import { Button } from "./components/Button";
import { canvasSize } from "./canvasSize";
import { usePanAndZoom } from "./hooks/pan-and-zoom";
import { useBrowserZoomPrevention } from "./hooks/browser-zoom-prevention";
import { assertOk } from "./utils/assert";

let idCounter = 4;

export function App() {
  const elementsRef = useRef<Map<SvgItem, SVGGElement> | null>(null);
  const canvasRef = useRef<SVGSVGElement | null>(null);

  const [svgItems, setSvgItems] = useState<SvgItem[]>([
    {
      id: 1,
      type: "rect",
      attr: {
        x: 50,
        y: 50,
        width: 200,
        height: 100,
        fill: "#BBC42A",
      },
    },
    {
      id: 2,
      type: "circle",
      attr: { cx: 150, cy: 150, r: 50, fill: "#FF0000" },
    },
    {
      id: 3,
      type: "polygon",
      attr: {
        points: "100,10 150,190 50,190",
        fill: "#00dd00",
        stroke: "#800080",
        strokeWidth: 2,
      },
    },
  ]);

  const [selectedElementId, setSelectedElementId] = useState<number | null>(1);
  const [selectionBounds, setSelectionBounds] = useState<DOMRect | null>(null);

  const selectedElement = useMemo(
    () => svgItems.find((el) => el.id === selectedElementId) ?? null,
    [svgItems, selectedElementId]
  );

  const [drawingMode, setDrawingMode] = useState<"rectangle" | "circle" | null>(
    null
  );

  const isDrawingRef = useRef<false | { startX: number; startY: number }>(
    false
  );
  const paz = usePanAndZoom();
  const zoomLevel = canvasSize.width / paz.viewBox.width;

  const handleStartDrawing = (e: React.MouseEvent) => {
    if (!drawingMode) return;

    const startX = e.nativeEvent.offsetX / zoomLevel + paz.viewBox.minX;
    const startY = e.nativeEvent.offsetY / zoomLevel + paz.viewBox.minY;

    isDrawingRef.current = { startX, startY };

    let newElement;
    switch (drawingMode) {
      case "rectangle":
        newElement = addElement({
          type: "rect",
          attr: { x: startX, y: startY, width: 0, height: 0 },
        });
        break;

      case "circle":
        newElement = addElement({
          type: "circle",
          attr: { cx: startX, cy: startY, r: 0 },
        });
        break;

      default:
        break;
    }
  };

  const handleDrawing = (e: React.MouseEvent) => {
    if (!drawingMode || svgItems.length === 0 || isDrawingRef.current === false)
      return;

    const newX = e.nativeEvent.offsetX / zoomLevel + paz.viewBox.minX;
    const newY = e.nativeEvent.offsetY / zoomLevel + paz.viewBox.minY;

    const latestSvgItem = svgItems[svgItems.length - 1];

    if (latestSvgItem.type === "rect") {
      assertOk(typeof latestSvgItem.attr.x === "number");
      assertOk(typeof latestSvgItem.attr.y === "number");

      // Calculate new position and size
      const newWidth = Math.abs(newX - isDrawingRef.current.startX);
      const newHeight = Math.abs(newY - isDrawingRef.current.startY);
      const minX = Math.min(newX, isDrawingRef.current.startX);
      const minY = Math.min(newY, isDrawingRef.current.startY);

      // Update the rectangle's attributes
      setAttributes(latestSvgItem.id, {
        x: minX,
        y: minY,
        width: newWidth,
        height: newHeight,
      });
    } else if (latestSvgItem.type === "circle") {
      assertOk(typeof latestSvgItem.attr.cx === "number");
      assertOk(typeof latestSvgItem.attr.cy === "number");

      // Calculate new radius
      const newRadius = Math.sqrt(
        Math.pow(newX - latestSvgItem.attr.cx, 2) +
          Math.pow(newY - latestSvgItem.attr.cy, 2)
      );

      // Update the circle's attributes
      setAttributes(latestSvgItem.id, { r: newRadius });
    }
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    setDrawingMode(null); // Stop drawing
    console.log("mouse up");
  };

  // Prevent browser zoom when scrolling/pinching on canvas
  useBrowserZoomPrevention(canvasRef);

  useLayoutEffect(() => {
    const domNode = selectedElement && getMap().get(selectedElement);
    if (!domNode) {
      setSelectionBounds(null);
      return;
    }

    setSelectionBounds(domNode.getBBox());
  }, [selectedElement]);

  const addElement = (elem: Omit<SvgItem, "id">) => {
    const addedItem = { id: idCounter++, ...elem };
    setSvgItems((elements) => [...elements, addedItem]);
    return addedItem;
  };

  const removeElement = (id: number) => {
    setSvgItems((elements) => elements.filter((el) => el.id !== id));
  };

  const setAttribute = (id: number, key: string, value: string) => {
    setSvgItems((elements) =>
      elements.map((el) => {
        if (el.id === id) {
          return {
            ...el,
            attr: { ...el.attr, [key]: value },
          };
        }
        return el;
      })
    );
  };

  const setAttributes = (id: number, newAttr: SvgItem["attr"]) => {
    setSvgItems((elements) =>
      elements.map((el) => {
        if (el.id === id) {
          return {
            ...el,
            attr: { ...el.attr, ...newAttr },
          };
        }
        return el;
      })
    );
  };

  const reorderElement = (currentIndex: number, newIndex: number) => {
    if (newIndex < 0 || newIndex >= svgItems.length) return;

    setSvgItems((elements) => {
      const newElements = [...elements];
      [newElements[currentIndex], newElements[newIndex]] = [
        newElements[newIndex],
        newElements[currentIndex],
      ];
      return newElements;
    });
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
    <div className="flex m-8">
      <div>
        <h4 className="text-l font-semibold">Shapes</h4>
        <div className="flex flex-wrap">
          <Button
            className="border p-1 rounded-md m-1"
            onClick={() => setDrawingMode("rectangle")}
          >
            Rectangle
          </Button>
          <Button
            className="border p-1 rounded-md m-1"
            onClick={() => setDrawingMode("circle")}
          >
            Circle
          </Button>
        </div>
      </div>
      <div>
        <svg
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border-2 border-slate-200"
          viewBox={viewBoxStr}
          onMouseDown={(e) =>
            drawingMode ? handleStartDrawing(e) : paz.handleMouseDown(e)
          }
          onMouseMove={(e) =>
            drawingMode ? handleDrawing(e) : paz.handleMouseMove(e)
          }
          onMouseUp={() => (drawingMode ? stopDrawing() : paz.handleMouseUp())}
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
          {svgItems.toReversed().map((element) => {
            const { type, attr } = element;
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
                    e.stopPropagation();
                    setSelectedElementId(element.id);
                  },
                  key: element.id,
                  ...attr,
                })}
              </g>
            );
          })}
          {selectionBounds && (
            <SelectionMarker
              selectionBounds={selectionBounds}
              zoomLevel={zoomLevel}
            />
          )}
        </svg>
        <div className="pt-2">
          <Button className="border p-1 rounded-md" onClick={paz.reset}>
            1:1
          </Button>{" "}
          Zoom: {zoomLevel.toFixed(2)}
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
        <AttributeEditor element={selectedElement} onChange={setAttribute} />
      </div>
    </div>
  );
}

const SelectionMarker = ({
  selectionBounds,
  zoomLevel,
}: {
  selectionBounds: DOMRect;
  zoomLevel: number;
}) => {
  const [dashOffset, setDashOffset] = useState(9);

  useEffect(() => {
    const timerId = setInterval(() => {
      setDashOffset((prev) => (prev <= 0 ? 9 : prev - 1));
    }, 30);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  return (
    <rect
      strokeWidth={2 / zoomLevel}
      stroke="black"
      strokeDasharray={5 / zoomLevel}
      strokeDashoffset={dashOffset / zoomLevel}
      fill="none"
      x={selectionBounds?.x}
      y={selectionBounds?.y}
      width={selectionBounds?.width}
      height={selectionBounds?.height}
    />
  );
};
