import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@shared/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-yellow-500 text-primary-background  hover:bg-yellow-400",
        destructive: "bg-destructive text-white  hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        tertiary: "bg-primary text-primary-foreground  hover:bg-primary/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Enya Custom Variants
        enya_neutral:
          "rounded-xl border-2 border-[hsl(var(--button-neutral-border))] bg-[hsl(var(--button-neutral))] text-[hsl(var(--button-neutral-text))] font-bold shadow-[0_4px_0_0_hsl(var(--button-neutral-shadow))] active:shadow-none active:translate-y-[4px] motion-reduce:hover:transform-none motion-reduce:active:transform-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--button-selected-border))] focus-visible:ring-offset-2 disabled:shadow-[0_4px_0_0_hsl(var(--button-neutral-shadow))] disabled:opacity-50 disabled:hover:translate-y-0",
        enya_secondary:
          "rounded-xl border-2 border-[hsl(var(--button-secondary-border))] bg-[hsl(var(--button-secondary))] text-[hsl(var(--button-secondary-text))] font-bold shadow-[0_4px_0_0_hsl(var(--button-secondary-shadow))] active:shadow-none active:translate-y-[4px] motion-reduce:hover:transform-none motion-reduce:active:transform-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--button-selected-border))] focus-visible:ring-offset-2 disabled:shadow-[0_4px_0_0_hsl(var(--button-secondary-shadow))] disabled:opacity-50 disabled:hover:translate-y-0",
        enya_primary:
          "rounded-xl border-2 border-[hsl(var(--button-primary-border))] bg-[hsl(var(--button-primary))] text-[hsl(var(--button-primary-text))] font-bold shadow-[0_4px_0_0_hsl(var(--button-primary-shadow))] active:shadow-none active:translate-y-[4px] motion-reduce:hover:transform-none motion-reduce:active:transform-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--button-selected-border))] focus-visible:ring-offset-2 disabled:shadow-[0_4px_0_0_hsl(var(--button-primary-shadow))] disabled:opacity-50 disabled:hover:translate-y-0",
        enya_success:
          "rounded-xl border-2 border-[hsl(var(--button-success-border))] bg-[hsl(var(--button-success))] text-[hsl(var(--button-success-text))] font-bold shadow-[0_4px_0_0_hsl(var(--button-success-shadow))] active:shadow-none active:translate-y-[4px] motion-reduce:hover:transform-none motion-reduce:active:transform-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--button-selected-border))] focus-visible:ring-offset-2 disabled:shadow-[0_4px_0_0_hsl(var(--button-success-shadow))] disabled:opacity-50 disabled:hover:translate-y-0",
        enya_error:
          "rounded-xl border-2 border-[hsl(var(--button-error-border))] bg-[hsl(var(--button-error))] text-[hsl(var(--button-error-text))] font-bold shadow-[0_4px_0_0_hsl(var(--button-error-shadow))] active:shadow-none active:translate-y-[4px] motion-reduce:hover:transform-none motion-reduce:active:transform-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--button-selected-border))] focus-visible:ring-offset-2 disabled:shadow-[0_4px_0_0_hsl(var(--button-error-shadow))] disabled:opacity-50 disabled:hover:translate-y-0",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8  px-3 text-xs",
        lg: "h-10  px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
