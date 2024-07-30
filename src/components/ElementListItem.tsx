import { TrashIcon } from "@heroicons/react/24/outline";
import { SvgItem } from "../types";
import { Button } from "./Button";
import { ShapeIcon } from "./icons/Shapes";
import { cx } from "class-variance-authority";
import { Draggable } from "@hello-pangea/dnd";

type Elementprops = {
  element: SvgItem;
  index: number;
  isSelected: boolean;
  onSelect: (elementId: number) => void;
  onRemove: (id: number) => void;
};

export const ElementListItem = ({
  element: el,
  index,
  isSelected,
  onRemove,
  onSelect,
}: Elementprops) => {
  return (
    <Draggable key={el.id} draggableId={el.id.toString()} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
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
              onClick={(e) => {
                e.stopPropagation();
                onRemove(el.id);
              }}
            >
              <TrashIcon className="size-4" />
            </Button>
          </span>
        </div>
      )}
    </Draggable>
  );
};
