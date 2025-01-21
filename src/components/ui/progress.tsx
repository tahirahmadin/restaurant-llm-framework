import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value = 0, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full bg-orange-500 transition-transform duration-300 ease-linear"
      style={{
        transform: `translateX(${value - 100}%)`, // Corrected for visual progression
        width: `${value}%`, // Ensures the bar fills up
      }}
    />
  </ProgressPrimitive.Root>
));

// Set the display name for debugging and tools
Progress.displayName = ProgressPrimitive.Root.displayName;

// Export the Progress component
export { Progress };
