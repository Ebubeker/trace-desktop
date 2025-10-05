import * as React from "react"
import { cn } from "../../lib/utils"

const Popover = ({ children }) => {
  return <div className="relative">{children}</div>
}

const PopoverTrigger = React.forwardRef(({ children, asChild, ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef(
  ({ className, align = "center", sideOffset = 4, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 w-auto min-w-[320px] rounded-lg border border-gray-200 bg-white shadow-lg outline-none",
          align === "start" && "left-0",
          align === "end" && "right-0",
          align === "center" && "left-1/2 -translate-x-1/2",
          className
        )}
        style={{ top: `calc(100% + ${sideOffset}px)` }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }

