import {
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

let idCounter = 1;

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

  const paz = usePanAndZoom();

  useEffect(() => {
    const svgElement = canvasRef.current;
    if (!svgElement) throw new Error("SVG element not found");

    const preventBrowserZoomOnPinch = (event: WheelEvent) => {
      const { ctrlKey } = event;
      if (ctrlKey) {
        event.preventDefault();
        return;
      }
    };

    svgElement.addEventListener("wheel", preventBrowserZoomOnPinch, {
      passive: false,
    });

    return () => {
      svgElement.removeEventListener("wheel", preventBrowserZoomOnPinch);
    };
  }, []);

  useLayoutEffect(() => {
    const domNode = selectedElement && getMap().get(selectedElement);
    if (!domNode) {
      setSelectionBounds(null);
      return;
    }

    setSelectionBounds(domNode.getBBox());
  }, [selectedElement]);

  const addElement = (elem: Omit<SvgItem, "id">) => {
    setSvgItems((elements) => [...elements, { id: idCounter++, ...elem }]);
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

  const zoomLevel = canvasSize.width / paz.viewBox.width;

  return (
    <div className="flex m-8">
      <div>
        <svg
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border-2 border-slate-200"
          viewBox={viewBoxStr}
          onMouseDown={paz.handleMouseDown}
          onMouseMove={paz.handleMouseMove}
          onMouseUp={paz.handleMouseUp}
          onMouseLeave={paz.handleMouseUp} // Handle case where mouse leaves the SVG area
          onWheel={(e) => paz.handleZoom(e.deltaY < 0)}
          onTouchStart={paz.handleTouchStart}
          onTouchMove={paz.handleTouchMove}
          onTouchEnd={paz.handleTouchEnd}
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
