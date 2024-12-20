import { CursorArrowRaysIcon } from "@heroicons/react/16/solid";
import { Button } from "./Button";
import { ShapeIcon } from "./icons/Shapes";
import { useStore } from "../state/store";
import { ResizeIcon } from "./icons/Tools";

export const Toolbar = () => {
  const selectedTool = useStore((state) => state.selectedTool);
  const setSelectedTool = useStore((state) => state.setSelectedTool);

  return (
    <>
      <Button
        className="border p-2 rounded-md "
        toggled={selectedTool === null}
        onClick={() => setSelectedTool(null)}
      >
        <CursorArrowRaysIcon className="size-4" />
      </Button>
      <Button
        className="border p-2 rounded-md"
        toggled={selectedTool === "rectangle"}
        onClick={() => setSelectedTool("rectangle")}
      >
        <ShapeIcon shape="rect" />
      </Button>
      <Button
        className="border p-2 rounded-md"
        toggled={selectedTool === "circle"}
        onClick={() => setSelectedTool("circle")}
      >
        <ShapeIcon shape="circle" />
      </Button>
      <Button
        className="border p-2 rounded-md"
        toggled={selectedTool === "polygon"}
        onClick={() => setSelectedTool("polygon")}
      >
        <ShapeIcon shape="polygon" />
      </Button>
      <Button
        className="border p-2 rounded-md"
        toggled={selectedTool === "scale"}
        onClick={() => setSelectedTool("scale")}
      >
        <ResizeIcon />
      </Button>
    </>
  );
};
