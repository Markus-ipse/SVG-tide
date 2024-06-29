import { SvgElement } from "../types";

interface Props {
  element: SvgElement | null;
  onChange: (id: number, key: string, value: string) => void;
}

export const AttributeEditor = ({ element: el, onChange }: Props) => {
  return (
    <div>
      <h4 className="text-l font-semibold">Attributes</h4>
      <div className="p-2 border-2 border-slate-200">
        {el &&
          Object.entries(el.attr).map(([key, value]) => {
            return (
              <div key={key} className="flex items-center p-1 border-b">
                <span className="font-semibold">{key}</span>
                <input
                  type="text"
                  className="ml-auto w-20 border-2 border-slate-200 p-1"
                  value={value}
                  onChange={(e) => onChange(el.id, key, e.target.value)}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};
