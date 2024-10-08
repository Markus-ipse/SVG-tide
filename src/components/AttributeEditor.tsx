import { SvgItem } from "../types";

interface Props {
  svgItem: SvgItem | null;
  onChange: <
    T extends SvgItem["type"],
    U extends Extract<SvgItem, { type: T }>,
  >(
    svgItem: { id: number; type: T },
    newAttr: Partial<U["attr"]>
  ) => void;
}

export const AttributeEditor = ({ svgItem, onChange }: Props) => {
  return (
    <div>
      <h4 className="text-l font-semibold">
        Attributes
        {svgItem && (
          <span className="ml-1 text-sm text-slate-500">
            ({`${svgItem?.type} ${svgItem?.id}`})
          </span>
        )}
      </h4>
      <div className="p-2 pb-1 pt-1 border-2 border-slate-200 ">
        {!svgItem && <div className="text-slate-500">No element selected</div>}
        {svgItem && (
          <>
            <div className="flex items-center p-1 border-b last-of-type:border-0">
              <span className="font-semibold">Fill</span>
              <input
                type="color"
                className="ml-auto w-20 p-1 h-9"
                value={svgItem.attr.fill}
                onChange={(e) => onChange(svgItem, { fill: e.target.value })}
              />
            </div>
            <div className="flex items-center p-1 border-b last-of-type:border-0">
              <span className="font-semibold">Fill opacity</span>

              <input
                className="ml-auto mr-4"
                type="range"
                min="0"
                max="1"
                step={0.01}
                value={svgItem.attr.fillOpacity.toString()}
                onChange={(e) =>
                  onChange(svgItem, { fillOpacity: parseFloat(e.target.value) })
                }
              />

              <input
                type="number"
                min={0}
                step={0.1}
                className="w-20 border-2 border-slate-200 p-1"
                value={svgItem.attr.fillOpacity.toString()}
                onChange={(e) =>
                  onChange(svgItem, { fillOpacity: parseFloat(e.target.value) })
                }
              />
            </div>
            <div className="flex items-center p-1 border-b last-of-type:border-0">
              <span className="font-semibold">Stroke width</span>
              <input
                type="number"
                min={0}
                className="ml-auto w-20 border-2 border-slate-200 p-1"
                value={svgItem.attr.strokeWidth}
                onChange={(e) =>
                  onChange(svgItem, {
                    strokeWidth: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex items-center p-1 border-b last-of-type:border-0">
              <span className="font-semibold">Stroke color</span>
              <input
                type="color"
                className="ml-auto w-20 p-1 h-9"
                value={svgItem.attr.stroke}
                onChange={(e) => onChange(svgItem, { stroke: e.target.value })}
              />
            </div>

            {svgItem.type === "polygon" && (
              <div className="flex items-center p-1 border-b last-of-type:border-0">
                <span className="font-semibold"># sides</span>
                <input
                  type="number"
                  className="ml-auto w-20 border-2 border-slate-200 p-1"
                  value={svgItem.attr.sides}
                  onChange={(e) =>
                    onChange(svgItem, { sides: parseInt(e.target.value) })
                  }
                />
              </div>
            )}

            {svgItem.type === "rect" && (
              <div className="flex items-center p-1 border-b last-of-type:border-0">
                <span className="font-semibold">Corner radius</span>
                <input
                  type="number"
                  className="ml-auto w-20 border-2 border-slate-200 p-1"
                  value={svgItem.attr.rx}
                  onChange={(e) =>
                    onChange(svgItem, { rx: parseFloat(e.target.value) })
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const colorAttributes = ["fill", "stroke"];
