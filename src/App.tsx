import {
  createElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SvgElement } from "./types";
import "./App.css";
import { ElementList } from "./components/ElementList";
import { AttributeEditor } from "./components/AttributeEditor";

let idCounter = 2;

export function App() {
  const elementsRef = useRef<Map<SvgElement, SVGGElement> | null>(null);

  const [svgElements, setSvgElements] = useState<SvgElement[]>([
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
    () => svgElements.find((el) => el.id === selectedElementId) ?? null,
    [svgElements, selectedElementId]
  );

  useLayoutEffect(() => {
    const domNode = selectedElement && getMap().get(selectedElement);
    if (!domNode) {
      setSelectionBounds(null);
      return;
    }

    setSelectionBounds(domNode.getBBox());
  }, [selectedElement]);

  const addElement = (elem: Omit<SvgElement, "id">) => {
    setSvgElements((elements) => [...elements, { id: idCounter++, ...elem }]);
  };

  const removeElement = (id: number) => {
    setSvgElements((elements) => elements.filter((el) => el.id !== id));
  };

  const setAttribute = (id: number, key: string, value: string) => {
    setSvgElements((elements) =>
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
    if (newIndex < 0 || newIndex >= svgElements.length) return;

    setSvgElements((elements) => {
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

  return (
    <div className="flex m-8">
      <svg
        width="900"
        height="600"
        className="border-2 border-slate-200"
        onClick={() => {
          setSelectedElementId(null);
        }}
      >
        {svgElements.toReversed().map((element) => {
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
      <div className="ml-2 w-[24rem]">
        <ElementList
          elements={svgElements}
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
