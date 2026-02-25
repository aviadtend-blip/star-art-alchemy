import { cn } from "@/lib/utils";

export default function PrimaryButton({ children, className, ...props }) {
  return (
    <button
      className={cn("btn-base btn-primary", className)}
      {...props}
    >
      {children}
    </button>
  );
}
