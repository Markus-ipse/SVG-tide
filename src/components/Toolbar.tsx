import { CursorArrowRaysIcon } from "@heroicons/react/16/solid";
import { Button } from "./Button";
import { ShapeIcon } from "./icons/Shapes";
import { useStore } from "../state/store";
import { ResizeIcon } from "./icons/Tools";

export const Toolbar = () => {
  const activeTool = useStore((state) => state.activeTool);
  const setActiveTool = useStore((state) => state.setActiveTool);

  return (
    <>
      <Button
        className="border p-2 rounded-md "
        toggled={activeTool === null}
        onClick={() => setActiveTool(null)}
      >
        <CursorArrowRaysIcon className="size-4" />
      </Button>
      <Button
        className="border p-2 rounded-md"
        toggled={activeTool === "rectangle"}
        onClick={() => setActiveTool("rectangle")}
      >
        <ShapeIcon shape="rect" />
      </Button>
      <Button
        className="border p-2 rounded-md"
        toggled={activeTool === "circle"}
        onClick={() => setActiveTool("circle")}
      >
        <ShapeIcon shape="circle" />
      </Button>
      <Button
        className="border p-2 rounded-md"
        toggled={activeTool === "polygon"}
        onClick={() => setActiveTool("polygon")}
      >
        <ShapeIcon shape="polygon" />
      </Button>
      <Button
        className="border p-2 rounded-md"
        toggled={activeTool === "scale"}
        onClick={() => setActiveTool("scale")}
      >
        <ResizeIcon />
      </Button>
    </>
  );
};
