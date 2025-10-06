
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Button } from "./button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { ScrollArea } from "./scroll-area"

function CopyButton({ text }: { text: React.ReactNode }) {
    const { toast } = useToast();
    const [hasCopied, setHasCopied] = useState(false);

    const onCopy = () => {
        // Create a temporary element to extract text content
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = text as string;
        const textToCopy = tempDiv.textContent || tempDiv.innerText || "";
        
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            setHasCopied(true);
            setTimeout(() => setHasCopied(false), 2000);
        } else {
             toast({
                variant: "destructive",
                title: "Copy Failed",
                description: "Cannot copy empty content.",
            });
        }
    };

    return (
        <Button size="sm" variant="secondary" className="h-7" onClick={onCopy}>
            {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Copy</span>
        </Button>
    )
}


export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, icon, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-4 w-full">
              {icon && <div className="flex-shrink-0 mt-1">{icon}</div>}
              <div className="grid gap-1 flex-grow pr-12">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ScrollArea className="max-h-32 w-full pr-4">
                    <ToastDescription>{description}</ToastDescription>
                  </ScrollArea>
                )}
                 <div className="flex gap-2 items-center mt-2">
                    {action}
                    <Button size="sm" variant="secondary" className="h-7" onClick={() => dismiss(id)}>
                        OK
                    </Button>
                    {variant === 'destructive' && description && <CopyButton text={description} />}
                </div>
              </div>
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
