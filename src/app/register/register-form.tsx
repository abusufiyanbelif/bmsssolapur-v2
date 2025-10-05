
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
import type { AppSettings, UserRole } from "@/services/types";

const createRegisterFormSchema = (isAadhaarMandatory: boolean) => z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  aadhaarNumber: isAadhaarMandatory
    ? z.string().regex(/^[0-9]{12}$/, "Aadhaar must be 12 digits.")
    : z.string().optional(),
  bankAccountName: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  upiPhoneNumbers: z.array(z.object({ value: z.string() })).optional(),
  upiIds: z.array(z.object({ value: z.string() })).optional(),
});


type RegisterFormValues = z.infer<ReturnType<typeof createRegisterFormSchema>>;

interface RegisterFormProps {
    settings: AppSettings;
}

export function RegisterForm({ settings }: RegisterFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isAadhaarMandatory = settings?.userConfiguration?.isAadhaarMandatory || false;
  const formSchema = createRegisterFormSchema(isAadhaarMandatory);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      aadhaarNumber: "",
      upiIds: [{ value: "" }],
      upiPhoneNumbers: [{ value: "" }],
    },
  });
  
  const { fields: upiIdFields, append: appendUpiId, remove: removeUpiId } = useFieldArray({
    control: form.control,
    name: "upiIds"
  });
  const { fields: upiPhoneFields, append: appendUpiPhone, remove: removeUpiPhone } = useFieldArray({
    control: form.control,
    name: "upiPhoneNumbers"
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === 'upiIds' && Array.isArray(value)) {
        value.forEach(item => item.value && formData.append('upiIds', item.value));
      } else if (key === 'upiPhoneNumbers' && Array.isArray(value)) {
        value.forEach(item => item.value && formData.append('upiPhoneNumbers', item.value));
      } else if (value) {
        formData.append(key, String(value));
      }
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
        <FormField
            control={form.control}
            name="aadhaarNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Aadhaar Number {isAadhaarMandatory && <span className="text-destructive">*</span>}</FormLabel>
                <FormControl>
                    <Input placeholder="Enter 12-digit Aadhaar number" {...field} />
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
        <div className="space-y-4">
            <FormLabel>UPI Phone Numbers (Optional)</FormLabel>
            {upiPhoneFields.map((field, index) => (
            <FormField
              control={form.control}
              key={field.id}
              name={`upiPhoneNumbers.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input {...field} placeholder="e.g., 9876543210" type="tel" maxLength={10} />
                    </FormControl>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeUpiPhone(index)}>
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
                onClick={() => appendUpiPhone({ value: "" })}
            >
                <PlusCircle className="mr-2" />
                Add Phone Number
            </Button>
         </div>
         <div className="space-y-4">
            <FormLabel>UPI IDs (Optional)</FormLabel>
            {upiIdFields.map((field, index) => (
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
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeUpiId(index)}>
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
                onClick={() => appendUpiId({ value: "" })}
            >
                <PlusCircle className="mr-2" />
                Add UPI ID
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
