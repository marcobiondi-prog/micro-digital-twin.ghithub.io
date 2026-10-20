"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useBackClose } from "@/hooks/use-back-close";

const Dialog = ({ modal, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) => {
  const [isPhone, setIsPhone] = React.useState(true);
  const [internalOpen, setInternalOpen] = React.useState(props.defaultOpen ?? false);
  const open = props.open ?? internalOpen;

  React.useEffect(() => {
    const phoneQuery = window.matchMedia("(max-width: 639px)");
    const syncViewport = () => setIsPhone(phoneQuery.matches);
    syncViewport();
    phoneQuery.addEventListener("change", syncViewport);
    return () => phoneQuery.removeEventListener("change", syncViewport);
  }, []);

  React.useEffect(() => {
    if (!isPhone || !open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPhone, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    setInternalOpen(nextOpen);
    props.onOpenChange?.(nextOpen);
  };

  // Every dialog closes on the back gesture instead of leaving the page.
  useBackClose(open, () => handleOpenChange(false));

  return <DialogPrimitive.Root {...props} open={open} onOpenChange={handleOpenChange} modal={modal ?? isPhone} />;
};

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, forwardedRef) => {
  const overlayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const syncPageHeight = () => {
      overlay.style.setProperty("--dialog-page-height", `${document.documentElement.scrollHeight}px`);
    };
    syncPageHeight();

    const observer = new ResizeObserver(syncPageHeight);
    observer.observe(document.documentElement);
    window.addEventListener("resize", syncPageHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncPageHeight);
    };
  }, []);

  const setRef = (node: HTMLDivElement | null) => {
    overlayRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  return (
    <div
      data-dialog-overlay=""
      ref={setRef}
      className={cn(
        "fixed inset-0 z-[1000000000] bg-black/80 sm:absolute sm:bottom-auto sm:h-[var(--dialog-page-height)] sm:min-h-dvh",
        className,
      )}
      {...props}
    />
  );
});
DialogOverlay.displayName = "DialogOverlay";

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { overlayClassName?: string }
>(({ className, overlayClassName, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay className={overlayClassName} />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[1000000001] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-h-[calc(100dvh-3rem)] sm:overflow-y-auto sm:overscroll-contain sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close aria-label="Chiudi" className="absolute right-3 top-3 z-10 grid size-10 cursor-pointer place-items-center rounded-full border bg-background text-foreground shadow-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none sm:right-4 sm:top-4">
        <X className="size-5" />
        <span className="sr-only">Chiudi</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
