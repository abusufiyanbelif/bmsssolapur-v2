
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getUser } from '@/services/user-service';
import type { User } from '@/services/types';
import { Loader2, AlertCircle, Edit, X, Save, PlusCircle, Trash2, CreditCard, Fingerprint, MapPin, Banknote, User as UserIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from "@/components/ui/textarea";
import { handleUpdateProfile } from '../actions';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

const profileFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required."),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits."),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']),
  beneficiaryType: z.enum(["Adult", "Old Age", "Kid", "Family", "Widow"]).optional(),
  occupation: z.string().optional(),
  familyMembers: z.coerce.number().optional(),
  isWidow: z.boolean().default(false),
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  upiPhoneNumbers: z.array(z.object({ value: z.string() })).optional(),
  upiIds: z.array(z.object({ value: z.string() })).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileSettingsPage() {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
    });

    const { formState: { isDirty }, control, reset, handleSubmit } = form;
    const { fields: upiIdFields, append: appendUpiId, remove: removeUpiId } = useFieldArray({ control, name: "upiIds" });
    const { fields: upiPhoneFields, append: appendUpiPhone, remove: removeUpiPhone } = useFieldArray({ control, name: "upiPhoneNumbers" });

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            setUserId(storedUserId);
        } else {
            setError("You must be logged in to view your profile.");
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const fetchedUser = await getUser(userId);
            if (fetchedUser) {
                setUser(fetchedUser);
                reset({
                    firstName: fetchedUser.firstName,
                    middleName: fetchedUser.middleName || '',
                    lastName: fetchedUser.lastName,
                    phone: fetchedUser.phone,
                    addressLine1: fetchedUser.address?.addressLine1 || '',
                    city: fetchedUser.address?.city || '',
                    state: fetchedUser.address?.state || '',
                    country: fetchedUser.address?.country || '',
                    pincode: fetchedUser.address?.pincode || '',
                    gender: fetchedUser.gender || 'Other',
                    beneficiaryType: fetchedUser.beneficiaryType,
                    occupation: fetchedUser.occupation || '',
                    familyMembers: fetchedUser.familyMembers || 0,
                    isWidow: fetchedUser.isWidow || false,
                    panNumber: fetchedUser.panNumber || '',
                    aadhaarNumber: fetchedUser.aadhaarNumber || '',
                    bankAccountName: fetchedUser.bankAccountName || '',
                    bankName: fetchedUser.bankName || '',
                    bankAccountNumber: fetchedUser.bankAccountNumber || '',
                    bankIfscCode: fetchedUser.bankIfscCode || '',
                    upiPhoneNumbers: fetchedUser.upiPhoneNumbers?.map(id => ({ value: id })) || [{ value: "" }],
                    upiIds: fetchedUser.upiIds?.map(id => ({ value: id })) || [{ value: "" }],
                });
            } else {
                setError("User not found.");
            }
        } catch (e) {
            setError("Failed to load user profile.");
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (userId) {
            fetchUser();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);


    async function onSubmit(values: ProfileFormValues) {
        if (!user?.id) return;
        setIsSubmitting(true);
        const updatePayload = {
            ...values,
            upiIds: values.upiIds?.map(item => item.value).filter(Boolean),
            upiPhoneNumbers: values.upiPhoneNumbers?.map(item => item.value).filter(Boolean),
            enableMonthlyDonationReminder: user.enableMonthlyDonationReminder || false,
        };
        const result = await handleUpdateProfile(user.id, updatePayload as any);
        
        if (result.success) {
            toast({ variant: "success", title: "Profile Updated", description: "Your changes have been saved." });
            await fetchUser();
            setIsEditing(false);
        } else {
            toast({ variant: "destructive", title: "Update Failed", description: result.error });
        }

        setIsSubmitting(false);
    }
    
    if (loading) {
        return <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error || !user) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error || "Could not load user profile."}</AlertDescription>
            </Alert>
        );
    }
    
    const isBeneficiary = user.roles.includes('Beneficiary');

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-primary">Account Settings</CardTitle>
                                <CardDescription className="text-muted-foreground">{isEditing ? "Update your account details below." : "View your account details."}</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <Button type="button" variant="outline" onClick={() => {setIsEditing(false); reset();}}>
                                            <X className="mr-2 h-4 w-4" /> Cancel
                                        </Button>
                                         <Button type="submit" disabled={isSubmitting || !isDirty}>
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Save Changes
                                        </Button>
                                    </>
                                ) : (
                                    <Button type="button" onClick={() => setIsEditing(true)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Accordion type="multiple" defaultValue={["basic", "payment"]} className="w-full space-y-4">
                            <AccordionItem value="basic" className="border rounded-lg">
                                <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2"><UserIcon className="h-5 w-5"/>Basic Information</h4></AccordionTrigger>
                                <AccordionContent className="p-6 pt-2 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="middleName" render={({ field }) => (<FormItem><FormLabel>Middle Name</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Primary Phone</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="gender" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Gender</FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex items-center space-x-4 pt-2" disabled={!isEditing}>
                                                        <FormItem className="flex items-center space-x-2"><RadioGroupItem value="Male" id="male" /><FormLabel htmlFor="male" className="font-normal">Male</FormLabel></FormItem>
                                                        <FormItem className="flex items-center space-x-2"><RadioGroupItem value="Female" id="female" /><FormLabel htmlFor="female" className="font-normal">Female</FormLabel></FormItem>
                                                        <FormItem className="flex items-center space-x-2"><RadioGroupItem value="Other" id="other" /><FormLabel htmlFor="other" className="font-normal">Other</FormLabel></FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="address" className="border rounded-lg">
                                <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2"><MapPin className="h-5 w-5"/>Address Details</h4></AccordionTrigger>
                                <AccordionContent className="p-6 pt-2 space-y-6">
                                    <FormField control={form.control} name="addressLine1" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="pincode" render={({ field }) => (<FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            
                             {isBeneficiary && (
                                 <AccordionItem value="beneficiary" className="border rounded-lg">
                                     <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2"><UserIcon className="h-5 w-5"/>Beneficiary Details</h4></AccordionTrigger>
                                     <AccordionContent className="p-6 pt-2 space-y-6">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField control={form.control} name="occupation" render={({ field }) => (<FormItem><FormLabel>Occupation</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                            <FormField control={form.control} name="familyMembers" render={({ field }) => (<FormItem><FormLabel>Number of Family Members</FormLabel><FormControl><Input type="number" {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                        </div>
                                         <FormField control={form.control} name="beneficiaryType" render={({ field }) => (
                                             <FormItem>
                                                 <FormLabel>Beneficiary Type</FormLabel>
                                                 <FormControl>
                                                     <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4 pt-2" disabled={!isEditing}>
                                                        <FormItem className="flex items-center space-x-3 space-y-0"><RadioGroupItem value="Adult" id="type-adult"/><FormLabel className="font-normal" htmlFor="type-adult">Adult</FormLabel></FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0"><RadioGroupItem value="Old Age" id="type-old"/><FormLabel className="font-normal" htmlFor="type-old">Old Age</FormLabel></FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0"><RadioGroupItem value="Kid" id="type-kid"/><FormLabel className="font-normal" htmlFor="type-kid">Kid</FormLabel></FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0"><RadioGroupItem value="Family" id="type-family"/><FormLabel className="font-normal" htmlFor="type-family">Family</FormLabel></FormItem>
                                                     </RadioGroup>
                                                 </FormControl>
                                                 <FormMessage />
                                             </FormItem>
                                         )}/>
                                     </AccordionContent>
                                 </AccordionItem>
                             )}

                            <AccordionItem value="payment" className="border rounded-lg">
                                <AccordionTrigger className="p-4 font-semibold text-primary"><h4 className="flex items-center gap-2"><CreditCard className="h-5 w-5"/>Verification &amp; Payment Details</h4></AccordionTrigger>
                                <AccordionContent className="p-6 pt-2 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="panNumber" render={({ field }) => (<FormItem><FormLabel>PAN Number</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="aadhaarNumber" render={({ field }) => (<FormItem><FormLabel>Aadhaar Number</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                    </div>
                                    <FormField control={form.control} name="bankAccountName" render={({ field }) => (<FormItem><FormLabel>Full Name as per Bank Account</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="bankAccountNumber" render={({ field }) => (<FormItem><FormLabel>Bank Account Number</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={form.control} name="bankIfscCode" render={({ field }) => (<FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                    </div>
                                    <FormField control={form.control} name="bankName" render={({ field }) => (<FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} disabled={!isEditing} /></FormControl><FormMessage /></FormItem>)}/>
                                    <Separator />
                                    <div className="space-y-4">
                                        <FormLabel>UPI Phone Numbers</FormLabel>
                                        {upiPhoneFields.map((field, index) => (<FormField control={form.control} key={field.id} name={`upiPhoneNumbers.${index}.value`} render={({ field }) => (<FormItem><div className="flex items-center gap-2"><FormControl><Input {...field} disabled={!isEditing} type="tel" maxLength={10} /></FormControl>{isEditing && (<Button type="button" variant="ghost" size="icon" onClick={() => removeUpiPhone(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>)}</div><FormMessage /></FormItem>)}/>))}
                                        {isEditing && (<Button type="button" variant="outline" size="sm" onClick={() => appendUpiPhone({ value: "" })}><PlusCircle className="mr-2" />Add Phone</Button>)}
                                    </div>
                                    <div className="space-y-4">
                                        <FormLabel>UPI IDs</FormLabel>
                                        {upiIdFields.map((field, index) => (<FormField control={form.control} key={field.id} name={`upiIds.${index}.value`} render={({ field }) => (<FormItem><div className="flex items-center gap-2"><FormControl><Input {...field} disabled={!isEditing} /></FormControl>{isEditing && (<Button type="button" variant="ghost" size="icon" onClick={() => removeUpiId(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>)}</div><FormMessage /></FormItem>)}/>))}
                                        {isEditing && (<Button type="button" variant="outline" size="sm" onClick={() => appendUpiId({ value: "" })}><PlusCircle className="mr-2" />Add UPI ID</Button>)}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}

    
