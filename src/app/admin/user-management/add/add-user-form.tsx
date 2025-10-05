
// src/app/admin/user-management/add/add-user-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, FormProvider, useFormContext } from "react-hook-form";
import * as z from "zod";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef, useMemo, Suspense, useCallback } from "react";
import { Loader2, UserPlus, Users, Info, CalendarIcon, AlertTriangle, ChevronsUpDown, Check, Banknote, X, Lock, Clipboard, Text, Bot, FileUp, ZoomIn, ZoomOut, FileIcon, ScanSearch, UserSearch, UserRoundPlus, XCircle, PlusCircle, Paperclip, RotateCw, RefreshCw as RefreshIcon, BookOpen, Sparkles, CreditCard, Fingerprint, MapPin, Trash2, CheckCircle } from "lucide-react";
import type { User, UserRole, AppSettings, ExtractBeneficiaryDetailsOutput, GenerateSummariesOutput } from "@/services/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getRawTextFromImage } from '@/app/actions';
import Image from "next/image";
import { getUser, checkAvailability } from "@/services/user-service";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchParams, useRouter } from 'next/navigation';
import { Separator } from "@/components/ui/separator";
import { handleAddUser, handleExtractUserDetailsFromText } from "./actions";
import { Textarea } from "@/components/ui/textarea";

const allRoles: Exclude<UserRole, 'Guest'>[] = [
    "Donor",
    "Beneficiary",
    "Admin",
    "Finance Admin",
    "Super Admin",
    "Referral",
];

const normalAdminRoles: Exclude<UserRole, 'Guest' | 'Admin' | 'Super Admin' | 'Finance Admin'>[] = [
    "Donor",
    "Beneficiary",
    "Referral",
];

const states = [
    { name: "Andhra Pradesh", cities: ["Visakhapatnam", "Vijayawada", "Guntur"] },
    { name: "Karnataka", cities: ["Bengaluru", "Mysuru", "Hubli"] },
    { name: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur", "Solapur"] },
    { name: "Tamil Nadu", cities: ["Chennai", "Coimbatore", "Madurai"] },
    { name: "Telangana", cities: ["Hyderabad", "Warangal", "Nizamabad"] },
];

const createFormSchema = (settings?: AppSettings) => z.object({
  userId: z.string().min(3, "User ID must be at least 3 characters."),
  fullName: z.string().optional(),
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required."),
  fatherName: z.string().optional(),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits."),
  password: z.string().optional(),
  roles: z.array(z.string()).refine((value) => (value || []).length > 0, {
    message: "You have to select at least one role.",
  }),
  createProfile: z.boolean().default(false),
  isAnonymousAsBeneficiary: z.boolean().default(false),
  isAnonymousAsDonor: z.boolean().default(false),
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Please select a gender."}),
  beneficiaryType: z.enum(["Adult", "Old Age", "Kid", "Family", "Widow"]).optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  occupation: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),
  familyMembers: z.coerce.number().optional(),
  earningMembers: z.coerce.number().optional(),
  totalFamilyIncome: z.coerce.number().optional(),
  isWidow: z.boolean().default(false),
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  upiPhoneNumbers: z.array(z.object({ value: z.string() })).optional(),
  upiIds: z.array(z.object({ value: z.string() })).optional(),
  aadhaarCard: z.any().optional(),
}).superRefine((data, ctx) => {
    // Dynamic mandatory fields based on roles and settings
    const isBeneficiary = data.roles.includes('Beneficiary');
    const beneficiarySettings = settings?.userConfiguration?.Beneficiary;

    if (isBeneficiary && beneficiarySettings) {
        if (beneficiarySettings.isAadhaarMandatory && !data.aadhaarNumber) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Aadhaar Number is required for Beneficiaries.", path: ["aadhaarNumber"] });
        }
        if (beneficiarySettings.isAddressMandatory && !data.addressLine1) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Address is required for Beneficiaries.", path: ["addressLine1"] });
        }
        if (beneficiarySettings.isPanMandatory && !data.panNumber) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PAN Number is required for Beneficiaries.", path: ["panNumber"] });
        }
        if (beneficiarySettings.isBankAccountMandatory && !data.bankAccountNumber) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bank Account Number is required for Beneficiaries.", path: ["bankAccountNumber"] });
        }
        if (!data.beneficiaryType) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Beneficiary Type is required when the Beneficiary role is selected.", path: ["beneficiaryType"] });
        }
    }
});


type AddUserFormValues = z.infer<ReturnType<typeof createFormSchema>>;

type AvailabilityState = {
    isChecking: boolean;
    isAvailable: boolean | null;
    suggestions?: string[];
    existingUserName?: string;
};

const initialAvailabilityState: AvailabilityState = {
    isChecking: false,
    isAvailable: null,
};

function AvailabilityFeedback({ state, fieldName, onSuggestionClick }: { state: AvailabilityState, fieldName: string, onSuggestionClick?: (suggestion: string) => void }) {
    if (state.isChecking) {
        return <p className="text-sm text-muted-foreground flex items-center mt-2"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</p>;
    }
    if (state.isAvailable === true) {
        return <p className="text-sm text-green-600 flex items-center mt-2"><CheckCircle className="mr-2 h-4 w-4" /> Available</p>;
    }
    if (state.isAvailable === false) {
        return (
            <div className="mt-2">
                <p className="text-sm text-destructive flex items-center">
                    <XCircle className="mr-2 h-4 w-4" /> 
                    This {fieldName} is already in use
                    {state.existingUserName && ` by ${state.existingUserName}`}.
                </p>
                {state.suggestions && state.suggestions.length > 0 && onSuggestionClick && (
                    <div className="flex gap-2 items-center mt-1">
                        <p className="text-xs text-muted-foreground">Suggestions:</p>
                        {state.suggestions.map(suggestion => (
                            <Button 
                                key={suggestion}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-xs h-6 px-2"
                                onClick={() => onSuggestionClick(suggestion)}
                            >
                                {suggestion}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        );
    }
    return null;
}

interface AddUserFormProps {
    settings?: AppSettings;
    isSubForm?: boolean;
    prefilledData?: ExtractBeneficiaryDetailsOutput;
    onUserCreate?: (user: User) => void;
}

function FormContent({ settings }: { settings?: AppSettings }) {
  const { control, formState, watch, setValue, trigger } = useFormContext<AddUserFormValues>();
  const { toast } = useToast();
  const [userIdState, setUserIdState] = useState<AvailabilityState>(initialAvailabilityState);
  const [emailState, setEmailState] = useState<AvailabilityState>(initialAvailabilityState);
  const [phoneState, setPhoneState] = useState<AvailabilityState>(initialAvailabilityState);
  const [panState, setPanState] = useState<AvailabilityState>(initialAvailabilityState);
  const [aadhaarState, setAadhaarState] = useState<AvailabilityState>(initialAvailabilityState);
  const [bankAccountState, setBankAccountState] = useState<AvailabilityState>(initialAvailabilityState);
  const [upiIdStates, setUpiIdStates] = useState<Record<number, AvailabilityState>>({});

  const { fields: upiIdFields, append: appendUpiId, remove: removeUpiId } = useFieldArray({ control, name: "upiIds" });
  const { fields: upiPhoneFields, append: appendUpiPhone, remove: removeUpiPhone } = useFieldArray({ control, name: "upiPhoneNumbers" });

  const selectedRoles = watch("roles");
  const selectedGender = watch("gender");
  const isBeneficiary = selectedRoles.includes('Beneficiary');
  
  const isInitialMount = useRef(true);

  const handleAvailabilityCheck = useCallback(async (field: string, value: string, setState: React.Dispatch<React.SetStateAction<AvailabilityState>>) => {
    if (!value) {
        setState(initialAvailabilityState);
        return;
    }
    setState({ isChecking: true, isAvailable: null });
    const result = await checkAvailability(field, value);
    setState({ isChecking: false, ...result });
  }, []);

  const debouncedUserId = useDebounce(watch('userId'), 500);
  const debouncedEmail = useDebounce(watch('email'), 500);
  const debouncedPhone = useDebounce(watch('phone'), 500);
  const debouncedPan = useDebounce(watch('panNumber'), 500);
  const debouncedAadhaar = useDebounce(watch('aadhaarNumber'), 500);
  const debouncedBankAccount = useDebounce(watch('bankAccountNumber'), 500);
  const debouncedUpiIds = useDebounce(watch('upiIds'), 500);

  useEffect(() => { 
    if (isInitialMount.current && !debouncedUserId) return;
    if (debouncedUserId) handleAvailabilityCheck('userId', debouncedUserId, setUserIdState); 
  }, [debouncedUserId, handleAvailabilityCheck]);
  useEffect(() => { 
    if (isInitialMount.current && !debouncedEmail) return;
    if (debouncedEmail) handleAvailabilityCheck('email', debouncedEmail, setEmailState); 
  }, [debouncedEmail, handleAvailabilityCheck]);
  useEffect(() => { 
    if (isInitialMount.current && !debouncedPhone) return;
    if (debouncedPhone) handleAvailabilityCheck('phone', debouncedPhone, setPhoneState); 
  }, [debouncedPhone, handleAvailabilityCheck]);
  useEffect(() => { 
    if (isInitialMount.current && !debouncedPan) return;
    if (debouncedPan) handleAvailabilityCheck('panNumber', debouncedPan, setPanState); 
  }, [debouncedPan, handleAvailabilityCheck]);
  useEffect(() => { 
    if (isInitialMount.current && !debouncedAadhaar) return;
    if (debouncedAadhaar) handleAvailabilityCheck('aadhaarNumber', debouncedAadhaar, setAadhaarState); 
  }, [debouncedAadhaar, handleAvailabilityCheck]);
  useEffect(() => { 
    if (isInitialMount.current && !debouncedBankAccount) return;
    if (debouncedBankAccount) handleAvailabilityCheck('bankAccountNumber', debouncedBankAccount, setBankAccountState); 
  }, [debouncedBankAccount, handleAvailabilityCheck]);

  useEffect(() => {
    debouncedUpiIds?.forEach((upi, index) => {
        if(upi.value) handleAvailabilityCheck('upiId', upi.value, (state) => setUpiIdStates(prev => ({...prev, [index]: state})));
    });
  }, [debouncedUpiIds, handleAvailabilityCheck]);
  
  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  const fullName = watch("fullName");
  const firstName = watch("firstName");
  const middleName = watch("middleName");
  const lastName = watch("lastName");

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFullName = e.target.value;
    setValue('fullName', newFullName, { shouldDirty: true });
    const nameParts = newFullName.split(' ').filter(Boolean);
    setValue('firstName', nameParts[0] || '', { shouldDirty: true });
    setValue('lastName', nameParts.length > 1 ? nameParts[nameParts.length - 1] : '', { shouldDirty: true });
    setValue('middleName', nameParts.slice(1, -1).join(' '), { shouldDirty: true });
    if (nameParts.length > 0) trigger(['firstName', 'lastName']);
  }

  useEffect(() => {
    const fullNameFromParts = `${firstName || ''} ${middleName || ''} ${lastName || ''}`.replace(/\s+/g, ' ').trim();
    if (fullNameFromParts !== fullName) {
        setValue('fullName', fullNameFromParts, { shouldDirty: true });
    }
  }, [firstName, middleName, lastName, fullName, setValue]);

  useEffect(() => {
    if (firstName && lastName) {
        const generatedUserId = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '');
        if (!formState.dirtyFields.userId) {
            setValue('userId', generatedUserId);
        }
    }
  }, [firstName, lastName, setValue, formState.dirtyFields.userId]);

  const selectedState = watch("state");

  const beneficiaryUserConfig = settings?.userConfiguration?.Beneficiary || {};
  const isAadhaarMandatory = beneficiaryUserConfig.isAadhaarMandatory || false;

  return (
    <div className="space-y-6 pt-4">
        <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
        <FormField
            control={control}
            name="fullName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                    <Input placeholder="Enter user's full name" {...field} onChange={handleFullNameChange}/>
                </FormControl>
                <FormDescription>The fields below will be auto-populated from this.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
                control={control}
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
                control={control}
                name="middleName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl>
                        <Input type="text" placeholder="Enter your middle name" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
            control={control}
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
            control={control}
            name="fatherName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Father&apos;s Name (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="Enter father's name" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
        control={control}
        name="userId"
        render={({ field }) => (
            <FormItem>
            <FormLabel>User ID</FormLabel>
            <FormControl>
                <Input type="text" placeholder="Create a custom user ID" {...field} />
            </FormControl>
            <AvailabilityFeedback state={userIdState} fieldName="User ID" onSuggestionClick={(s) => setValue('userId', s, { shouldValidate: true })} />
            <FormMessage />
            </FormItem>
        )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
        control={control}
        name="email"
        render={({ field }) => (
            <FormItem>
            <FormLabel>Email Address (Optional)</FormLabel>
            <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
            </FormControl>
            <AvailabilityFeedback state={emailState} fieldName="email" />
            <FormMessage />
            </FormItem>
        )}
        />
        <FormField
        control={control}
        name="phone"
        render={({ field }) => (
            <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
                <Input type="tel" placeholder="10-digit number" maxLength={10} {...field} />
            </FormControl>
            <AvailabilityFeedback state={phoneState} fieldName="phone number" />
            <FormMessage />
            </FormItem>
        )}
        />
        </div>
        
        <FormField
            control={control}
            name="gender"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel>Gender</FormLabel>
                <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4 pt-2">
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Male" /></FormControl><FormLabel className="font-normal">Male</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Female" /></FormControl><FormLabel className="font-normal">Female</FormLabel></FormItem>
                    </RadioGroup>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />

        <h3 className="text-lg font-semibold border-b pb-2">Address Details</h3>
        <FormField
            control={control}
            name="addressLine1"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Address Line 1 (Street, Area)</FormLabel>
                <FormControl>
                    <Textarea placeholder="Enter user's full address" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={control}
                name="state"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>State</FormLabel>
                    <Select onValueChange={(value) => { field.onChange(value); setValue('city', undefined); }} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {states.map(state => <SelectItem key={state.name} value={state.name}>{state.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="city"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>City</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!selectedState}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a city" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {states.find(s => s.name === selectedState)?.cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
                control={control}
                name="pincode"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Pincode</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., 413001" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
                control={control}
                name="country"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., India" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
        </div>

          {isBeneficiary && (
              <>
                  <h3 className="text-lg font-semibold border-b pb-2">Family &amp; Occupation</h3>
                  <div className="space-y-6">
                      <FormField control={control} name="occupation" render={({ field }) => (<FormItem><FormLabel>Beneficiary&apos;s Occupation</FormLabel><FormControl><Input placeholder="e.g., Daily wage worker, Unemployed" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={control} name="fatherOccupation" render={({ field }) => (<FormItem><FormLabel>Father&apos;s Occupation</FormLabel><FormControl><Input placeholder="e.g., Shop owner, Retired" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={control} name="motherOccupation" render={({ field }) => (<FormItem><FormLabel>Mother&apos;s Occupation</FormLabel><FormControl><Input placeholder="e.g., Homemaker, Teacher" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField control={control} name="familyMembers" render={({ field }) => (<FormItem><FormLabel>Family Members</FormLabel><FormControl><Input type="number" placeholder="e.g., 5" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                          <FormField control={control} name="earningMembers" render={({ field }) => (<FormItem><FormLabel>Earning Members</FormLabel><FormControl><Input type="number" placeholder="e.g., 1" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                          <FormField control={control} name="totalFamilyIncome" render={({ field }) => (<FormItem><FormLabel>Total Family Income (Monthly)</FormLabel><FormControl><Input type="number" placeholder="e.g., 10000" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      </div>
                  </div>
                  {selectedGender === 'Female' && (
                      <FormField
                          control={control}
                          name="isWidow"
                          render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                  <div className="space-y-1 leading-none">
                                      <FormLabel>Is the Beneficiary a Widow?</FormLabel>
                                      <FormDescription>Check this box if the user is a widow. This helps in prioritizing cases.</FormDescription>
                                  </div>
                              </FormItem>
                          )}
                      />
                  )}
                  <FormField
                      control={control}
                      name="beneficiaryType"
                      render={({ field }) => (
                          <FormItem className="space-y-3">
                          <FormLabel>Beneficiary Type</FormLabel>
                          <FormDescription>Categorize the beneficiary for reporting and aid purposes.</FormDescription>
                          <FormControl>
                              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4 pt-2">
                                  <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Adult" /></FormControl><FormLabel className="font-normal">Adult</FormLabel></FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Old Age" /></FormControl><FormLabel className="font-normal">Old Age</FormLabel></FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Kid" /></FormControl><FormLabel className="font-normal">Kid</FormLabel></FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Family" /></FormControl><FormLabel className="font-normal">Family</FormLabel></FormItem>
                              </RadioGroup>
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
              </>
          )}

        <h3 className="text-lg font-semibold border-b pb-2">Verification &amp; Payment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={control}
            name="panNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>PAN Number (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="Enter PAN number" {...field} />
                </FormControl>
                <AvailabilityFeedback state={panState} fieldName="PAN Number" />
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={control}
            name="aadhaarNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Aadhaar Number {isAadhaarMandatory && <span className="text-destructive">*</span>}</FormLabel>
                <FormControl>
                    <Input placeholder="Enter 12-digit Aadhaar number" {...field} />
                </FormControl>
                <AvailabilityFeedback state={aadhaarState} fieldName="Aadhaar Number" />
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
            control={control}
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
                control={control}
                name="bankAccountNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Bank Account Number (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="Enter account number" {...field} />
                    </FormControl>
                    <AvailabilityFeedback state={bankAccountState} fieldName="Bank Account" />
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={control}
                name="bankIfscCode"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>IFSC Code (Optional)</FormLabel>
                    <FormControl>
                        <Input placeholder="Enter IFSC code" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
            control={control}
            name="bankName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Bank Name (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="Enter bank name" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <div className="space-y-4">
            <FormLabel>UPI Phone Numbers (Optional)</FormLabel>
            <FormDescription>Add one or more UPI-linked phone numbers.</FormDescription>
            {upiPhoneFields.map((field, index) => (
            <FormField
              control={control}
              key={field.id}
              name={`upiPhoneNumbers.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input {...field} type="tel" maxLength={10} placeholder="10-digit UPI linked phone" />
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
            <FormDescription>Add one or more UPI IDs for this user to help with automatic donor detection.</FormDescription>
            {upiIdFields.map((field, index) => (
            <FormField
              control={control}
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
                  <AvailabilityFeedback state={upiIdStates[index] || initialAvailabilityState} fieldName="UPI ID" />
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
    </div>
  )
}

function AddUserFormContent({ settings, isSubForm = false, prefilledData, onUserCreate }: AddUserFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const formSchema = useMemo(() => createFormSchema(settings), [settings]);
  
  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      userId: "",
      fullName: "",
      firstName: "",
      middleName: "",
      lastName: "",
      fatherName: "",
      email: "",
      phone: "",
      password: "",
      roles: ["Donor"],
      createProfile: false,
      isAnonymousAsBeneficiary: false,
      isAnonymousAsDonor: false,
      gender: undefined,
      beneficiaryType: undefined,
      addressLine1: "",
      city: "Solapur",
      state: "Maharashtra",
      country: "India",
      pincode: "",
      occupation: "",
      fatherOccupation: "",
      motherOccupation: "",
      familyMembers: 0,
      earningMembers: 0,
      totalFamilyIncome: 0,
      isWidow: false,
      panNumber: "",
      aadhaarNumber: "",
      bankAccountName: "",
      bankName: "",
      bankAccountNumber: "",
      bankIfscCode: "",
      upiPhoneNumbers: [{ value: "" }],
      upiIds: [{ value: "" }],
      aadhaarCard: null,
    },
  });

  const handleCancel = () => {
    form.reset();
  };

  const { handleSubmit: originalHandleSubmit, formState, trigger } = form;

  const handleSubmit = (onSubmitFunction: (values: AddUserFormValues) => void) => {
    return async (e: React.BaseSyntheticEvent) => {
      e.preventDefault();
      await trigger(); // Manually trigger validation
  
      if (Object.keys(formState.errors).length > 0) {
        const errorMessages = Object.values(formState.errors)
          .map(err => err.message)
          .filter(Boolean)
          .join('\n');
        
        toast({
          variant: "destructive",
          title: "Please correct the errors below",
          description: <pre className="mt-2 w-full rounded-md bg-slate-950 p-4"><code className="text-white whitespace-pre-wrap">{errorMessages}</code></pre>
        });
        return; // Stop submission
      }
      
      originalHandleSubmit(onSubmitFunction)(e);
    };
  };

  async function onSubmit(values: AddUserFormValues) {
    setIsSubmitting(true);
    
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        if (key === 'roles' && Array.isArray(value)) {
            value.forEach(role => formData.append('roles', role));
        } else if ((key === 'upiIds' || key === 'upiPhoneNumbers') && Array.isArray(value)) {
            value.forEach(item => item.value && formData.append(key, item.value));
        } else if (value instanceof File) {
            formData.append(key, value);
        }
         else {
            formData.append(key, String(value));
        }
      }
    });
    
    const result = await handleAddUser(formData);

    if (result.success && result.user) {
      toast({
        variant: "success",
        title: "User Created",
        description: `Successfully created user ${result.user.name}.`,
        icon: <CheckCircle />,
      });
      
      if (onUserCreate) {
          onUserCreate(result.user);
      } else {
        const redirectUrlParam = new URLSearchParams(window.location.search).get('redirect_url');
        if (redirectUrlParam) {
            const newParams = new URLSearchParams(window.location.search);
            newParams.set('donorId', result.user.id!);
            newParams.delete('redirect_url');
            router.push(`${redirectUrlParam}?${newParams.toString()}`);
        } else {
            handleCancel();
        }
      }

    } else {
      toast({
        variant: "destructive",
        title: "Error Creating User",
        description: result.error || "An unknown error occurred. Please check the form and try again.",
      });
    }
     setIsSubmitting(false);
  }

  return (
    <>
      <FormProvider {...form}>
      {isSubForm ? (
        <FormContent settings={settings} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
            <FormContent settings={settings} />
            <div className="flex items-center gap-4 mt-8">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    {isSubmitting ? 'Creating User...' : 'Create User'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Clear Form
                </Button>
            </div>
        </form>
      )}
      </FormProvider>
    </>
  );
}

export function AddUserForm(props: AddUserFormProps) {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddUserFormContent {...props} />
        </Suspense>
    )
}
