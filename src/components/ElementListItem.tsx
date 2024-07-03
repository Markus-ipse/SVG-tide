import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { SvgElement } from "../types";
import { Button } from "./Button";
import { ShapeIcon } from "./icons/Shapes";
import { cx } from "class-variance-authority";

type Elementprops = {
  element: SvgElement;
  index: number;
  isSelected: boolean;
  canMove: { up: boolean; down: boolean };
  onSelect: (elementId: number) => void;
  onRemove: (id: number) => void;
  onReorder: (currentIndex: number, newIndex: number) => void;
};

export const ElementListItem = ({
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
      className={cx(
        "flex",
        "items-center",
        "p-1",
        "border-b",
        "last-of-type:border-b-0",
        "group",
        isSelected && "bg-slate-100"
      )}
      onClick={() => {
        onSelect(el.id);
      }}
    >
      <ShapeIcon shape={el.type} fill={isSelected && "#fab"} />
      <span className="ml-1"> {el.type + el.id}</span>
      <span className="flex ml-auto invisible group-hover:visible">
        <Button
          className="enabled:hover:scale-125"
          disabled={!canMove.up}
          onClick={(e) => {
            e.stopPropagation();
            onReorder(index, index - 1);
          }}
        >
          <ArrowUpIcon className="size-4" />
        </Button>
        <Button
          className="hover:scale-125"
          disabled={!canMove.down}
          onClick={(e) => {
            e.stopPropagation();
            onReorder(index, index + 1);
          }}
        >
          <ArrowDownIcon className="size-4" />
        </Button>
        <Button
          className="enabled:hover:scale-125"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(el.id);
          }}
        >
          <TrashIcon className="size-4" />
        </Button>
      </span>
    </div>
  );
};
