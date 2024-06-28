import { SvgElement } from "../types";
import { ShapeIcon } from "./icons/Shapes";

interface Props {
  elements: SvgElement[];
}

export const ElementList = ({ elements }: Props) => {
  return (
    <div className="p-2">
      {elements.map((element, index) => {
        return <Element key={index} element={element} />;
      })}
    </div>
  );
};

const Element = ({ element: el }: { element: SvgElement }) => {
  return (
    <div className="flex items-center p-1 border-b">
      <ShapeIcon shape={el.type} />
      <span className="ml-1"> {el.type + el.id}</span>
    </div>
  );
};
