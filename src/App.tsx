import { createElement, useState } from "react";
import { SvgElement } from "./types";
import "./App.css";
import { ElementList } from "./components/ElementList";

let idCounter = 2;

export function App() {
  const [svgElements, setSvgElements] = useState<SvgElement[]>([
    {
      id: 1,
      type: "rect",
      attr: {
        width: 200,
        height: 100,
        fill: "#BBC42A",
      },
    },
    { id: 2, type: "circle", attr: { cx: 50, cy: 50, r: 50, fill: "#FF0000" } },
  ]);

  const addElement = (elem: Omit<SvgElement, "id">) => {
    setSvgElements((elements) => [...elements, { id: idCounter++, ...elem }]);
  };

  return (
    <div className="flex m-8">
      <svg width="400px" height="200px" className="border-2 border-slate-200">
        <rect width="200" height="100" fill="#BBC42A" />
        {svgElements.map((element, index) => {
          const { type, attr } = element;
          return createElement(type, { key: index, ...attr });
        })}
      </svg>
      <div>
        <ElementList elements={svgElements} />
      </div>
    </div>
  );
}
