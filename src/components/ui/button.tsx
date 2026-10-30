import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// One filled (primary, near-black) button per screen; everything else is
// outlined, ghost or a text link. 6px radius, no shadow.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-control border border-transparent text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-negative [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary font-semibold text-on-primary hover:bg-primary/85",
        outline: "border-control bg-surface text-ink hover:bg-raised aria-expanded:bg-raised",
        secondary: "bg-raised text-ink hover:bg-border",
        ghost: "text-ink hover:bg-raised aria-expanded:bg-raised",
        destructive: "text-negative-ink hover:bg-negative-soft",
        link: "h-auto px-0 text-accent-ink hover:text-accent",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3.5",
        lg: "h-13 px-5 text-base",
        icon: "size-10",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
