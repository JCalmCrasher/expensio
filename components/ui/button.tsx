import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        brand:
          "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500/50 dark:bg-green-600 dark:hover:bg-green-700",
        toolbar:
          "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-green-500/50",
        "toolbar-muted":
          "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:ring-green-500/50",
        "link-brand":
          "h-auto px-0 text-green-600 hover:bg-transparent hover:text-green-800 hover:underline",
        "destructive-solid":
          "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400/50",
        "destructive-outline":
          "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 focus-visible:ring-red-400/50",
        segment:
          "h-auto border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700",
        "segment-active":
          "h-auto border-green-300 bg-green-50 text-green-700 ring-2 ring-green-300 ring-offset-1",
        sidebar:
          "h-auto w-full justify-start gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white focus-visible:ring-violet-500/50",
        "sidebar-active":
          "h-auto w-full justify-start gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium bg-white/8 text-white focus-visible:ring-violet-500/50",
        rollover:
          "h-auto gap-1.5 border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:border-green-300 hover:bg-green-100 focus-visible:ring-green-500/50",
        pay: "h-auto border-green-200 bg-green-50 text-[11px] font-semibold text-green-600 hover:bg-green-100 focus-visible:ring-green-500/50",
        "pay-muted":
          "h-auto border-zinc-200 bg-zinc-100 text-[11px] font-semibold text-zinc-500 focus-visible:ring-green-500/50",
        pill: "h-auto gap-1 rounded-lg border-0 px-2 py-1 text-[11px] font-semibold text-zinc-400 shadow-none hover:text-zinc-600",
        "pill-active":
          "h-auto gap-1 rounded-lg border-0 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-900 shadow-sm",
        "ghost-danger":
          "text-zinc-400 hover:bg-red-50 hover:text-red-500 focus-visible:ring-red-400/50",
        "ghost-edit":
          "text-zinc-400 hover:bg-green-50 hover:text-green-500 focus-visible:ring-green-500/50",
        "ghost-pay":
          "text-green-600 hover:bg-green-50 hover:text-green-800 focus-visible:ring-green-500/50",
        chip:
          "h-auto shrink-0 rounded-full border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700 focus-visible:ring-green-500/50",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
        modal: "h-auto flex-1 rounded-xl py-2.5 text-sm",
        compact: "h-7 rounded-lg px-2 text-[10px]",
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
