"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const AccordionContext = React.createContext<{
  value?: string;
  onValueChange?: (val: string) => void;
  collapsible?: boolean;
} | null>(null);

export function Accordion({
  children,
  type = "single",
  collapsible = true,
  className,
}: {
  children: React.ReactNode;
  type?: "single";
  collapsible?: boolean;
  className?: string;
}) {
  const [value, setValue] = React.useState<string>("");

  const onValueChange = React.useCallback(
    (val: string) => {
      setValue((prev) => {
        if (prev === val) {
          return collapsible ? "" : prev;
        }
        return val;
      });
    },
    [collapsible]
  );

  return (
    <AccordionContext.Provider value={{ value, onValueChange, collapsible }}>
      <div className={cn("space-y-1", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

const AccordionItemContext = React.createContext<{
  value: string;
} | null>(null);

export function AccordionItem({
  children,
  value,
  className,
}: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className={cn("border-b border-border", className)}>{children}</div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(AccordionContext);
  const itemCtx = React.useContext(AccordionItemContext);
  if (!ctx || !itemCtx) {
    throw new Error(
      "Accordion components must be wrapped in Accordion and AccordionItem"
    );
  }

  const isOpen = ctx.value === itemCtx.value;

  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange?.(itemCtx.value)}
      className={cn(
        "flex w-full items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left",
        className
      )}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );
}

export function AccordionContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(AccordionContext);
  const itemCtx = React.useContext(AccordionItemContext);
  if (!ctx || !itemCtx) {
    throw new Error(
      "Accordion components must be wrapped in Accordion and AccordionItem"
    );
  }

  const isOpen = ctx.value === itemCtx.value;

  return (
    <div
      className={cn(
        "overflow-hidden text-sm transition-all duration-200 ease-in-out",
        isOpen ? "max-h-40 pb-4 opacity-100" : "max-h-0 opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}
