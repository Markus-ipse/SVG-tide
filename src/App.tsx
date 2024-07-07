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

let idCounter = 1;

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

const initialViewBox = {
  minX: 0,
  minY: 0,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
};
export function App() {
  const elementsRef = useRef<Map<SvgItem, SVGGElement> | null>(null);

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

  // Initialize viewBox state
  const [viewBox, setViewBox] = useState(initialViewBox);

  // Convert viewBox object to string
  const viewBoxStr = `${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`;

  const [selectedElementId, setSelectedElementId] = useState<number | null>(1);
  const [selectionBounds, setSelectionBounds] = useState<DOMRect | null>(null);

  const selectedElement = useMemo(
    () => svgItems.find((el) => el.id === selectedElementId) ?? null,
    [svgItems, selectedElementId]
  );

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

  // State to track if the mouse is pressed down
  const [isMouseDown, setIsMouseDown] = useState(false);
  // State to store the initial mouse position
  const [initialMousePosition, setInitialMousePosition] = useState({
    x: 0,
    y: 0,
  });

  // Function to handle mouse down event
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    setIsMouseDown(true);
    setInitialMousePosition({ x: e.clientX, y: e.clientY });
  };

  // Function to handle mouse move event
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (isMouseDown) {
      const dx = e.clientX - initialMousePosition.x;
      const dy = e.clientY - initialMousePosition.y;

      // Convert dx and dy to SVG space
      const svgDx = dx * (viewBox.width / CANVAS_WIDTH);
      const svgDy = dy * (viewBox.height / CANVAS_HEIGHT);

      handlePan(-svgDx, -svgDy);

      // Update initial position for smooth panning
      setInitialMousePosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Function to handle mouse up event
  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  // Handle zoom
  const handleZoom = (zoomIn: boolean) => {
    const scaleFactor = 0.01;
    const zoomAmount = zoomIn ? 1 - scaleFactor : 1 + scaleFactor;
    setViewBox((prevViewBox) => ({
      ...prevViewBox,
      width: prevViewBox.width * zoomAmount,
      height: prevViewBox.height * zoomAmount,
    }));
  };

  // Handle pan
  const handlePan = (dx: number, dy: number) => {
    setViewBox((prevViewBox) => ({
      ...prevViewBox,
      minX: prevViewBox.minX + dx,
      minY: prevViewBox.minY + dy,
    }));
  };

  return (
    <div className="flex m-8">
      <div>
        <svg
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-slate-200"
          viewBox={viewBoxStr}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp} // Handle case where mouse leaves the SVG area
          onWheel={(e) => handleZoom(e.deltaY < 0)}
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
            <SelectionMarker selectionBounds={selectionBounds} />
          )}
        </svg>
        <div className="pt-2">
          <Button
            className="border p-1 rounded-md"
            onClick={() => setViewBox(initialViewBox)}
          >
            1:1
          </Button>{" "}
          Zoom: {(CANVAS_WIDTH / viewBox.width).toFixed(2)}
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

const SelectionMarker = ({ selectionBounds }: { selectionBounds: DOMRect }) => {
  const [dashOffset, setDashOffset] = useState(9);

  useEffect(() => {
    const timerId = setInterval(() => {
      setDashOffset((prev) => (prev === 0 ? 9 : prev - 1));
    }, 30);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  return (
    <rect
      strokeWidth="2"
      stroke="black"
      strokeDasharray="5"
      strokeDashoffset={dashOffset}
      fill="none"
      x={selectionBounds?.x}
      y={selectionBounds?.y}
      width={selectionBounds?.width}
      height={selectionBounds?.height}
    />
  );
};
