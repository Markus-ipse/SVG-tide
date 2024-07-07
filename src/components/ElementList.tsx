import { SvgItem } from "../types";
import { ElementListItem } from "./ElementListItem";

interface Props {
  elements: SvgItem[];
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
            <ElementListItem
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
