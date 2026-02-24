import { cn } from "@/lib/utils";

export default function PrimaryButton({ children, className, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center h-10 px-6 rounded-full font-display font-medium transition-opacity hover:opacity-90",
        className
      )}
      style={{ backgroundColor: '#FFBF00', color: '#333', fontSize: '13px', lineHeight: '113%', letterSpacing: '-0.26px' }}
      {...props}
    >
      {children}
    </button>
  );
}
