import { SvgBasicShape } from "../../types";

const Square = () => {
  const size = 16;
  const borderWidth = 2;
  return (
    <svg width="1em" height="1em" viewBox={`0 0 ${size} ${size}`}>
      <rect
        x={borderWidth}
        y={borderWidth}
        width={size - borderWidth * 2}
        height={size - borderWidth * 2}
        stroke="black"
        strokeWidth={borderWidth}
        fill="none"
      />
    </svg>
  );
};

const Circle = () => {
  const size = 16;
  const borderWidth = 2;
  return (
    <svg width="1em" height="1em" viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - borderWidth / 2}
        stroke="black"
        strokeWidth={borderWidth}
        fill="none"
      />
    </svg>
  );
};

export const ShapeIcon = ({ shape }: { shape: SvgBasicShape }) => {
  switch (shape) {
    case "rect":
      return <Square />;
    case "circle":
      return <Circle />;
    default:
      return "x";
  }
};
