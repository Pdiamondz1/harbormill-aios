import { Button, type ButtonProps } from "@/components/ui/button";
import { CALENDLY_URL } from "@/config/site";
import { openCalendlyPopup } from "@/lib/calendly";

/** Button that opens the Calendly 30-min intro in a popup. Any passed onClick still fires. */
export function CalendlyButton({
  children = "Book a free 30-min intro",
  onClick,
  ...props
}: ButtonProps) {
  return (
    <Button
      onClick={(e) => {
        onClick?.(e);
        openCalendlyPopup(CALENDLY_URL);
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
