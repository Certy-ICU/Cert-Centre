import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CourseProgressProps {
  value: number;
  variant?: "default" | "success",
  size?: "default" | "sm" | "xs";
};

const colorByVariant = {
  default: "text-sky-700",
  success: "text-emerald-700",
}

const sizeByVariant = {
  default: "text-sm",
  sm: "text-xs",
  xs: "text-[10px]"
}

export const CourseProgress = ({
  value,
  variant,
  size,
}: CourseProgressProps) => {
  return (
    <div>
      <Progress
        className={cn(
          "h-1 xs:h-1.5 sm:h-2",
          variant === "success" ? "bg-emerald-100" : "bg-sky-100"
        )}
        value={value}
        variant={variant}
      />
      <p className={cn(
        "font-medium mt-1 xs:mt-1 sm:mt-2",
        colorByVariant[variant || "default"],
        sizeByVariant[size || "default"],
      )}>
        {Math.round(value)}% Complete
      </p>
    </div>
  )
}