import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <div className={`card p-6 ${className}`} {...rest}>
      {children}
    </div>
  );
}
