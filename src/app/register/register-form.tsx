

"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { handleRegister } from "./actions";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, UserPlus, PlusCircle, Trash2 } from "lucide-react";

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  bankAccountName: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  upiPhone: z.string().optional(),
  upiIds: z.array(z.object({ value: z.string() })).optional(),
});

type RegisterFormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      upiIds: [{ value: "" }],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "upiIds"
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("firstName", values.firstName);
    formData.append("lastName", values.lastName);
    if(values.email) formData.append("email", values.email);
    formData.append("phone", values.phone);
    formData.append("password", values.password);
    if(values.bankAccountName) formData.append("bankAccountName", values.bankAccountName);
    if(values.bankName) formData.append("bankName", values.bankName);
    if(values.bankAccountNumber) formData.append("bankAccountNumber", values.bankAccountNumber);
    if(values.bankIfscCode) formData.append("bankIfscCode", values.bankIfscCode);
    if(values.upiPhone) formData.append("upiPhone", values.upiPhone);
    values.upiIds?.forEach(upi => {
        if(upi.value) formData.append("upiIds", upi.value);
    });

    const result = await handleRegister(formData);

    if (result.success && result.user) {
      toast({
        variant: "success",
        title: "Registration Successful!",
        description: `Your User ID is "${result.user.userId}". Redirecting to login...`,
        icon: <CheckCircle />,
        duration: 5000,
      });
      setTimeout(() => router.push('/login'), 3000); // Give user time to read toast
    } else {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: result.error || "An unknown error occurred.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6 pt-4" onSubmit={form.handleSubmit(onSubmit)}>
        <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                    <Input type="text" placeholder="Enter your first name" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                    <Input type="text" placeholder="Enter your last name" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address (Optional)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="10-digit number" maxLength={10} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Min. 6 characters" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <h3 className="text-lg font-semibold border-b pb-2 pt-4">Payment Details (Optional)</h3>
         <FormField
            control={form.control}
            name="bankAccountName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Full Name as per Bank Account</FormLabel>
                <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={form.control}
                name="bankAccountNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Bank Account Number</FormLabel>
                    <FormControl>
                        <Input placeholder="Enter account number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="bankIfscCode"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>IFSC Code</FormLabel>
                    <FormControl>
                        <Input placeholder="Enter IFSC code" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Bank Name</FormLabel>
                <FormControl>
                    <Input placeholder="Enter bank name" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
                control={form.control}
                name="upiPhone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>UPI Phone Number</FormLabel>
                    <FormControl>
                        <Input type="tel" maxLength={10} placeholder="10-digit UPI linked phone" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
         <div className="space-y-4">
            <FormLabel>UPI IDs</FormLabel>
            {fields.map((field, index) => (
            <FormField
              control={form.control}
              key={field.id}
              name={`upiIds.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input {...field} placeholder="e.g., username@okhdfc" />
                    </FormControl>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: "" })}
            >
                <PlusCircle className="mr-2" />
                Add another UPI ID
            </Button>
         </div>


        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" />
          )}
          Create Account
        </Button>
      </form>
    </Form>
  );
}

