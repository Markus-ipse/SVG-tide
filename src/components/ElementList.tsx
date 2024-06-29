import {
  AiOutlineArrowDown,
  AiOutlineArrowUp,
  AiOutlineDelete,
} from "react-icons/ai";
import { SvgElement } from "../types";
import { ShapeIcon } from "./icons/Shapes";
import { Button } from "./Button";

interface Props {
  elements: SvgElement[];
  selectedElementId: number | null;
  className?: string;
  onSelect: (elementId: number) => void;
  onRemove: (id: number) => void;
  onReorder: (currentIndex: number, newIndex: number) => void;
}

export const ElementList = ({
  elements,
  selectedElementId,
  onRemove,
  onReorder,
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
              index={index}
              element={element}
              isSelected={selectedElementId === element.id}
              canMove={{
                up: index > 0,
                down: index < elements.length - 1,
              }}
              onReorder={onReorder}
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
  index: number;
  isSelected: boolean;
  canMove: { up: boolean; down: boolean };
  onSelect: (elementId: number) => void;
  onRemove: (id: number) => void;
  onReorder: (currentIndex: number, newIndex: number) => void;
};

const Element = ({
  element: el,
  index,
  isSelected,
  canMove,
  onReorder,
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
      <span className="flex ml-auto invisible group-hover:visible">
        <Button
          disabled={!canMove.up}
          onClick={(e) => {
            e.stopPropagation();
            onReorder(index, index - 1);
          }}
        >
          <AiOutlineArrowUp />
        </Button>
        <Button
          disabled={!canMove.down}
          onClick={(e) => {
            e.stopPropagation();
            onReorder(index, index + 1);
          }}
        >
          <AiOutlineArrowDown />
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(el.id);
          }}
        >
          <AiOutlineDelete />
        </Button>
      </span>
    </div>
  );
};
