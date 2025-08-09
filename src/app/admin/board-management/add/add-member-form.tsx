
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
import { handleAddBoardMember } from "./actions";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { User } from "@/services/types";
import { useRouter } from "next/navigation";


const boardRoles = ['Founder', 'Co-Founder', 'Finance', 'Member of Organization'] as const;

const formSchema = z.object({
  userId: z.string().min(1, "Please select a user."),
  role: z.enum(boardRoles),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMemberFormProps {
  users: User[];
}

export function AddMemberForm({ users }: AddMemberFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const adminUsers = users.filter(u => u.roles.includes("Admin") || u.roles.includes("Super Admin"));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });


  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    const result = await handleAddBoardMember(values.userId, values.role);

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: "Member Added",
        description: `Successfully added member to the board.`,
      });
      router.push("/admin/board-management");
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
            <FormItem>
              <FormLabel>Select User</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user with Admin privileges" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {adminUsers.map(user => (
                    <SelectItem key={user.id} value={user.id!}>
                      {user.name} ({user.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign Group / Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group or role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {boardRoles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add to Group
        </Button>
      </form>
    </Form>
  );
}
