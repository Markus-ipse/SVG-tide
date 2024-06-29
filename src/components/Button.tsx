interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export const Button = ({ children, ...props }: Props) => {
  return (
    <button className="disabled:opacity-30" {...props}>
      {children}
    </button>
  );
};
