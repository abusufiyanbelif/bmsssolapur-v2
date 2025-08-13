

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { handleAddApprover } from "../actions";
import { useState } from "react";
import { Loader2, Check, ChevronsUpDown, X } from "lucide-react";
import type { User } from "@/services/types";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";


const formSchema = z.object({
  userId: z.string({ required_error: "Please select a user." }).min(1, "Please select a user."),
  approverType: z.enum(['Mandatory', 'Optional']),
});

type FormValues = z.infer<typeof formSchema>;

interface AddApproverFormProps {
  users: User[];
}

export function AddApproverForm({ users }: AddApproverFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Show only admins who are NOT already any kind of approver
  const eligibleUsers = users.filter(u => 
    (u.roles.includes("Admin") || u.roles.includes("Super Admin")) && 
    !u.groups?.includes("Lead Approver") &&
    !u.groups?.includes("Mandatory Lead Approver")
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        approverType: 'Optional'
    }
  });


  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    const groupToAssign = values.approverType === 'Mandatory' ? 'Mandatory Lead Approver' : 'Lead Approver';
    const result = await handleAddApprover(values.userId, groupToAssign);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Approver Added",
        description: `Successfully added user to the ${values.approverType} Approver group.`,
      });
      router.push("/admin/leads/configuration");
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-lg">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Select User</FormLabel>
               <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? eligibleUsers.find(
                            (user) => user.id === field.value
                          )?.name
                        : "Select a user"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search user..." />
                    <CommandList>
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup>
                        {eligibleUsers.map((user) => (
                            <CommandItem
                            value={user.name}
                            key={user.id}
                            onSelect={() => {
                                form.setValue("userId", user.id!);
                                setPopoverOpen(false);
                            }}
                            >
                            <Check
                                className={cn(
                                "mr-2 h-4 w-4",
                                user.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                            />
                            {user.name} ({user.phone})
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="approverType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Approver Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an approver type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Optional">Optional</SelectItem>
                  <SelectItem value="Mandatory">Mandatory</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add to Group
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                <X className="mr-2 h-4 w-4" />
                Cancel
            </Button>
        </div>
      </form>
    </Form>
  );
}
