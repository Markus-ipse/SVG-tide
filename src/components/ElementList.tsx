import { AiOutlineDelete } from "react-icons/ai";
import { SvgElement } from "../types";
import { ShapeIcon } from "./icons/Shapes";

interface Props {
  elements: SvgElement[];
  selectedElementId: number | null;
  className?: string;
  onSelect: (elementId: number) => void;
  onRemove: (id: number) => void;
}

export const ElementList = ({
  elements,
  selectedElementId,
  onRemove,
  onSelect,
  className = "",
}: Props) => {
  return (
    <div>
      <h4 className="text-l font-semibold">Elements</h4>
      <div className={"p-2 border-2 border-slate-200 " + className}>
        {elements.map((element, index) => {
          return (
            <Element
              key={index}
              element={element}
              isSelected={selectedElementId === element.id}
              onRemove={onRemove}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
};

type Elementprops = {
  element: SvgElement;
  isSelected: boolean;
  onSelect: (elementId: number) => void;
  onRemove: (id: number) => void;
};

const Element = ({
  element: el,
  isSelected,
  onRemove,
  onSelect,
}: Elementprops) => {
  return (
    <div
      className="flex items-center p-1 border-b group"
      onClick={() => {
        onSelect(el.id);
      }}
    >
      <ShapeIcon shape={el.type} fill={isSelected && "#fab"} />
      <span className="ml-1"> {el.type + el.id}</span>
      <span
        className="ml-auto invisible group-hover:visible"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(el.id);
        }}
      >
        <AiOutlineDelete />
      </span>
    </div>
  );
};
