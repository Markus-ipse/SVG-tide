interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export const Button = ({ children, className = "", ...props }: Props) => {
  return (
    <button className={`disabled:opacity-20 ${className}`} {...props}>
      {children}
    </button>
  );
};
