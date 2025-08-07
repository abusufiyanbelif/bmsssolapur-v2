
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

function CopyButton({ text }: { text: React.ReactNode }) {
    const { toast } = useToast();
    const [hasCopied, setHasCopied] = useState(false);

    const onCopy = () => {
        if (typeof text === 'string') {
            navigator.clipboard.writeText(text);
            setHasCopied(true);
            setTimeout(() => setHasCopied(false), 2000);
        } else {
             toast({
                variant: "destructive",
                title: "Copy Failed",
                description: "Cannot copy non-text content.",
            });
        }
    };

    return (
        <Button size="sm" variant="outline" className="absolute bottom-4 right-16 h-7" onClick={onCopy}>
            {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Copy</span>
        </Button>
    )
}


export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, icon, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-4">
              {icon && <div className="flex-shrink-0 mt-1">{icon}</div>}
              <div className="grid gap-1 flex-grow pr-12">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            {variant === 'destructive' && description && <CopyButton text={description} />}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
