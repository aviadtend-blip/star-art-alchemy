import { cn } from "@/lib/utils";

export default function PrimaryButton({ children, className, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center h-12 px-6 rounded-full text-a5 transition-opacity hover:opacity-90 w-full md:w-auto",
        className
      )}
      style={{ backgroundColor: '#FFBF00', color: '#333' }}
      {...props}
    >
      {children}
    </button>
  );
}
