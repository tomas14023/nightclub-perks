import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-[0.18em] uppercase ring-offset-background transition-[background,color,border,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-secondary text-foreground border border-border hover:border-primary/40 hover:text-primary",
        gold:
          "bg-gradient-gold text-primary-foreground hover:shadow-gold border border-primary/30 font-semibold",
        outline:
          "border border-primary/40 bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
        ghost: "hover:bg-secondary text-foreground/80 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline normal-case tracking-normal",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive/40",
        success:
          "bg-success text-success-foreground hover:bg-success/90 border border-success/40",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-muted border border-border",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
