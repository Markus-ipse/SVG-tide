import { SvgItem } from "../types";
import { ElementListItem } from "./ElementListItem";
import {
  DragDropContext,
  Droppable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";

interface Props {
  elements: SvgItem[];
  selectedSvgItem: SvgItem | null;
  className?: string;
  onSelect: (svgItem: SvgItem) => void;
  onRemove: (id: number) => void;
  onReorder: (currentIndex: number, newIndex: number) => void;
}

export const ElementList = ({
  elements,
  selectedSvgItem,
  onRemove,
  onReorder,
  onSelect,
  className = "",
}: Props) => {
  const onDragEnd: OnDragEndResponder = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }
    onReorder(result.source.index, result.destination.index);
  };

  return (
    <div>
      <h4 className="text-l font-semibold">Elements</h4>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={"p-2 border-2 border-slate-200 " + className}
            >
              {elements.map((element, index) => (
                <ElementListItem
                  key={element.id}
                  index={index}
                  element={element}
                  isSelected={selectedSvgItem?.id === element.id}
                  onRemove={onRemove}
                  onSelect={onSelect}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
