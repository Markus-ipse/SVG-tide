import { createElement, useMemo, useState } from "react";
import { SvgElement } from "./types";
import "./App.css";
import { ElementList } from "./components/ElementList";
import { AttributeEditor } from "./components/AttributeEditor";

let idCounter = 2;

export function App() {
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
        fill: "lime",
        stroke: "purple",
        strokeWidth: 3,
      },
    },
  ]);

  const [selectedElementId, setSelectedElementId] = useState<number | null>(1);

  const selectedElement = useMemo(
    () => svgElements.find((el) => el.id === selectedElementId) ?? null,
    [svgElements, selectedElementId]
  );

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

  return (
    <div className="flex m-8">
      <svg width="900" height="600" className="border-2 border-slate-200">
        {svgElements.map((element, index) => {
          const { type, attr } = element;
          return createElement(type, { key: index, ...attr });
        })}
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
