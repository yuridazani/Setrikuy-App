import { cn } from "@/lib/utils"

export const Card = ({ className, children, ...props }) => (
  <div className={cn("rounded-[24px] border border-border/50 bg-white text-text-main shadow-sm", className)} {...props}>
    {children}
  </div>
)

export const CardHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1 p-5", className)} {...props} />
)

export const CardContent = ({ className, ...props }) => (
  <div className={cn("p-5 pt-0", className)} {...props} />
)