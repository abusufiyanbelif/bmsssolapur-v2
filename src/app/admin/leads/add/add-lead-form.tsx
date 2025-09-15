
// src/app/admin/leads/add/add-lead-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import * as z from "zod";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { handleAddLead, handleExtractLeadDetailsFromText, handleExtractLeadBeneficiaryDetailsFromText, handleGenerateSummaries } from "./actions";
import { handleAddUser } from "@/app/admin/user-management/add/actions";
import { useState, useEffect, useRef, useMemo, Suspense, useCallback } from "react";
import { Loader2, UserPlus, Users, Info, CalendarIcon, AlertTriangle, ChevronsUpDown, Check, Banknote, X, Lock, Clipboard, Text, Bot, FileUp, ZoomIn, ZoomOut, FileIcon, ScanSearch, UserSearch, UserRoundPlus, XCircle, PlusCircle, Paperclip, RotateCw, UploadCloud, CheckCircle, RefreshCw as RefreshIcon, BookOpen, Sparkles } from "lucide-react";
import type { User, LeadPurpose, Campaign, Lead, DonationType, LeadPriority, AppSettings, PurposeCategory, ExtractLeadDetailsOutput, ExtractBeneficiaryDetailsOutput, GenerateSummariesOutput } from "@/services/types";
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


const leadPriorities: LeadPriority[] = ['Urgent', 'High', 'Medium', 'Low'];
const donationTypes: Exclude<DonationType, 'Split' | 'Any'>[] = ['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah', 'Interest'];
const semesterOptions = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

const createFormSchema = (isAadhaarMandatory: boolean) => z.object({
  beneficiaryType: z.enum(['existing', 'new']).default('existing'),
  beneficiaryId: z.string().optional(),
  linkBeneficiaryLater: z.boolean().default(false),
  manualBeneficiaryName: z.string().optional(),
  
  // New beneficiary fields
  newBeneficiaryUserId: z.string().min(3, "User ID must be at least 3 characters."),
  newBeneficiaryFirstName: z.string().min(2, "First name must be at least 2 characters."),
  newBeneficiaryMiddleName: z.string().optional(),
  newBeneficiaryLastName: z.string().min(1, "Last name is required."),
  newBeneficiaryFullName: z.string().optional(),
  newBeneficiaryFatherName: z.string().optional(),
  newBeneficiaryPhone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits."),
  newBeneficiaryEmail: z.string().email().optional().or(z.literal('')),
  newBeneficiaryAadhaar: isAadhaarMandatory
    ? z.string().regex(/^[0-9]{12}$/, "Aadhaar must be 12 digits.")
    : z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  aadhaarCard: z.any().optional(),
  dateOfBirth: z.date().optional(),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: "Gender is required."}),
  isAnonymousAsBeneficiary: z.boolean().default(false),

  hasReferral: z.boolean().default(false),
  campaignId: z.string().optional(),
  campaignName: z.string().optional(),
  referredByUserId: z.string().optional(),
  referredByUserName: z.string().optional(),
  headline: z.string().min(10, "Case Summary must be at least 10 characters.").optional().or(z.literal('')),
  story: z.string().optional(),
  diseaseIdentified: z.string().optional(),
  diseaseStage: z.string().optional(),
  diseaseSeriousness: z.enum(['High', 'Moderate', 'Low']).optional(),
  purpose: z.string().min(1, "Purpose is required."),
  otherPurposeDetail: z.string().optional(),
  category: z.string().min(1, "Category is required."),
  otherCategoryDetail: z.string().optional(),
  degree: z.string().optional(),
  year: z.string().optional(),
  semester: z.string().optional(),
  priority: z.enum(leadPriorities),
  acceptableDonationTypes: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one donation type.",
  }),
  isHistoricalRecord: z.boolean().default(false),
  helpRequested: z.coerce.number().min(1, "Amount requested must be greater than 0."),
  fundingGoal: z.coerce.number().optional(),
  collectedAmount: z.coerce.number().optional(),
  caseReportedDate: z.date().optional(),
  dueDate: z.date().optional(),
  isLoan: z.boolean().default(false),
  caseDetails: z.string().optional(),
  otherDocuments: z.array(z.any()).optional(),
})
.superRefine((data, ctx) => {
    // Beneficiary linking logic
    if (!data.linkBeneficiaryLater) {
        if (data.beneficiaryType === 'existing' && (!data.beneficiaryId || data.beneficiaryId.trim() === '')) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select an existing beneficiary.", path: ["beneficiaryId"] });
        } else if (data.beneficiaryType === 'new' && (!data.newBeneficiaryFirstName || !data.newBeneficiaryLastName || !data.newBeneficiaryPhone || !data.gender)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "New beneficiary requires First Name, Last Name, Phone, and Gender.", path: ["newBeneficiaryFirstName"] });
        }
    } else {
        if (!data.manualBeneficiaryName || data.manualBeneficiaryName.trim() === '') {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Beneficiary Name is required when linking later.", path: ["manualBeneficiaryName"] });
        }
    }

    // Purpose and Category 'Other' logic
    if (data.purpose === 'Other' && (!data.otherPurposeDetail || data.otherPurposeDetail.length === 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please specify details for the 'Other' purpose.", path: ["otherPurposeDetail"] });
    }
    if (data.category === 'Other' && (!data.otherCategoryDetail || data.otherCategoryDetail.length === 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please specify details for the 'Other' category.", path: ["otherCategoryDetail"] });
    }

    // Conditional Date Validation for Historical Records
    if (data.isHistoricalRecord) {
        if (!data.caseReportedDate) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Case Reported Date is required for historical records.", path: ["caseReportedDate"] });
        } else if (data.caseReportedDate > new Date()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Case Reported Date must be in the past.", path: ["caseReportedDate"] });
        }
        if (!data.dueDate) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Due Date is required for historical records.", path: ["dueDate"] });
        } else if (data.dueDate > new Date()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Due Date must be in the past.", path: ["dueDate"] });
        }
    } else {
        if (data.dueDate && data.dueDate < new Date()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Due Date cannot be in the past for new leads.", path: ["dueDate"] });
        }
    }
});



type AddLeadFormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface AddLeadFormProps {
  users: User[];
  campaigns: Campaign[];
  settings: AppSettings;
}

type AvailabilityState = {
    isChecking: boolean;
    isAvailable: boolean | null;
    suggestions?: string[];
    existingUserName?: string;
};

type CreationStatus = 'idle' | 'creating-user' | 'creating-lead' | 'success' | 'error';
interface CreationStep {
    name: string;
    status: 'pending' | 'in-progress' | 'success' | 'error';
    details?: string;
}

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

function AddLeadFormContent({ users, campaigns, settings }: AddLeadFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationStatus, setCreationStatus] = useState<CreationStep[]>([]);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<Lead[] | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [referralPopoverOpen, setReferralPopoverOpen] = useState(false);
  const [selectedReferralDetails, setSelectedReferralDetails] = useState<User | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [isCaseTextExtracting, setIsCaseTextExtracting] = useState(false);
  const [isCaseAnalyzing, setIsCaseAnalyzing] = useState(false);
  const [isRefreshingStory, setIsRefreshingStory] = useState(false);
  const [isRefreshingSummary, setIsRefreshingSummary] = useState(false);
  const [caseRawText, setCaseRawText] = useState<string>('');
  
  const [isBeneficiaryTextExtracting, setIsBeneficiaryTextExtracting] = useState(false);
  const [isBeneficiaryAnalyzing, setIsBeneficiaryAnalyzing] = useState(false);
  const [isRefreshingDetails, setIsRefreshingDetails] = useState(false);
  const [beneficiaryRawText, setBeneficiaryRawText] = useState<string>('');
  const [extractedBeneficiaryDetails, setExtractedBeneficiaryDetails] = useState<ExtractBeneficiaryDetailsOutput | null>(null);

  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);
  const [otherDocumentsPreviews, setOtherDocumentsPreviews] = useState<string[]>([]);
  const [zoomLevels, setZoomLevels] = useState<Record<string, {zoom: number, rotation: number}>>({});

  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  const otherDocsInputRef = useRef<HTMLInputElement>(null);

  const [userIdState, setUserIdState] = useState<AvailabilityState>(initialAvailabilityState);
  const [emailState, setEmailState] = useState<AvailabilityState>(initialAvailabilityState);
  const [phoneState, setPhoneState] = useState<AvailabilityState>(initialAvailabilityState);
  const [panState, setPanState] = useState<AvailabilityState>(initialAvailabilityState);
  const [aadhaarState, setAadhaarState] = useState<AvailabilityState>(initialAvailabilityState);
  const [bankAccountState, setBankAccountState] = useState<AvailabilityState>(initialAvailabilityState);
  const [upiIdStates, setUpiIdStates] = useState<Record<number, AvailabilityState>>({});


  const potentialBeneficiaries = users.filter(u => u.roles.includes("Beneficiary"));
  const potentialReferrals = users.filter(u => u.roles.includes("Referral"));
  
  const leadConfiguration = settings.leadConfiguration || {};
  const approvalProcessDisabled = leadConfiguration.approvalProcessDisabled || false;
  
  const leadPurposes = useMemo(() => 
    (leadConfiguration.purposes || []).filter(p => p.enabled)
  , [leadConfiguration.purposes]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
        const admin = users.find(u => u.id === storedUserId);
        setAdminUser(admin || null);
    }
  }, [users]);
  
  const userHasOverridePermission = adminUser?.roles.includes('Super Admin');
  const isFormDisabled = approvalProcessDisabled && !userHasOverridePermission;

  const beneficiaryUserConfig = settings.userConfiguration?.Beneficiary || {};
  const isAadhaarMandatory = beneficiaryUserConfig.isAadhaarMandatory || false;
  const formSchema = createFormSchema(isAadhaarMandatory);

  const form = useForm<AddLeadFormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      beneficiaryType: 'existing',
      beneficiaryId: '',
      newBeneficiaryUserId: '',
      newBeneficiaryFirstName: '',
      newBeneficiaryMiddleName: '',
      newBeneficiaryLastName: '',
      newBeneficiaryFullName: '',
      newBeneficiaryFatherName: '',
      newBeneficiaryPhone: '',
      newBeneficiaryEmail: '',
      newBeneficiaryAadhaar: '',
      addressLine1: '',
      city: 'Solapur',
      state: 'Maharashtra',
      country: 'India',
      pincode: '',
      isAnonymousAsBeneficiary: false,
      dateOfBirth: undefined,
      gender: undefined,
      aadhaarCard: null,
      hasReferral: false,
      referredByUserId: '',
      referredByUserName: '',
      campaignId: 'none',
      campaignName: '',
      headline: '',
      story: '',
      diseaseIdentified: '',
      diseaseStage: '',
      diseaseSeriousness: undefined,
      purpose: '',
      otherPurposeDetail: '',
      category: '',
      otherCategoryDetail: '',
      degree: '',
      year: '',
      semester: '',
      priority: 'Medium',
      acceptableDonationTypes: [],
      isHistoricalRecord: false,
      helpRequested: 0,
      fundingGoal: 0,
      collectedAmount: 0,
      caseReportedDate: undefined,
      dueDate: undefined,
      isLoan: false,
      caseDetails: '',
      otherDocuments: [],
      linkBeneficiaryLater: false,
      manualBeneficiaryName: '',
    },
  });
  
  const handleCancel = () => {
    form.reset();
      setSelectedReferralDetails(null);
      setCaseRawText("");
      setBeneficiaryRawText("");
      setAadhaarPreview(null);
      setOtherDocumentsPreviews([]);
      setCreationStatus([]);
  };

  const { formState: { isValid }, setValue, watch, getValues, control, trigger } = form;
  const selectedPurposeName = watch("purpose");
  const selectedCategory = watch("category");
  const selectedDegree = watch("degree");
  const beneficiaryType = watch("beneficiaryType");
  const linkBeneficiaryLater = watch("linkBeneficiaryLater");
  const hasReferral = watch("hasReferral");
  const newBeneficiaryFirstName = watch("newBeneficiaryFirstName");
  const newBeneficiaryMiddleName = watch("newBeneficiaryMiddleName");
  const newBeneficiaryLastName = watch("newBeneficiaryLastName");
  const newBeneficiaryFullName = watch("newBeneficiaryFullName");
  const isHistoricalRecord = watch("isHistoricalRecord");
  
  const dynamicText = useMemo(() => {
    let documentLabel = "Relevant Documents";
    let caseSummaryPlaceholder = "A short, compelling summary of the need";

    switch (selectedPurposeName) {
        case 'Education':
            documentLabel = "Fee Receipts, Bonafide Certificates, etc.";
            caseSummaryPlaceholder = "e.g., Help needed for final year college fees";
            break;
        case 'Medical':
            documentLabel = "Hospital Bills, Doctor's Notes, etc.";
            caseSummaryPlaceholder = "e.g., Assistance required for urgent heart surgery";
            break;
        case 'Relief Fund':
            documentLabel = "Ration Slips, Utility Bills, etc.";
            caseSummaryPlaceholder = "e.g., Support needed for monthly ration kit";
            break;
        case 'Deen':
             documentLabel = "Construction Quotes, Event Details, etc.";
             caseSummaryPlaceholder = "e.g., Contribution for Masjid renovation project";
             break;
        case 'Loan':
             documentLabel = "Business Plan, Quotations, etc.";
             caseSummaryPlaceholder = "e.g., Small loan needed to start a tailoring business";
             break;
    }

    return {
        scanSectionTitle: `Scan Case Documents (${documentLabel})`,
        caseSummaryPlaceholder,
    };
  }, [selectedPurposeName]);
  
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fullName = e.target.value;
    setValue('newBeneficiaryFullName', fullName, { shouldDirty: true });
    const nameParts = fullName.split(' ').filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';
    const middleName = nameParts.slice(1, -1).join(' ');
    setValue('newBeneficiaryFirstName', firstName, { shouldDirty: true });
    setValue('newBeneficiaryMiddleName', middleName, { shouldDirty: true });
    setValue('newBeneficiaryLastName', lastName, { shouldDirty: true });
  }

  useEffect(() => {
    const fullNameFromParts = `${newBeneficiaryFirstName || ''} ${newBeneficiaryMiddleName || ''} ${newBeneficiaryLastName || ''}`.replace(/\s+/g, ' ').trim();
    if (fullNameFromParts !== newBeneficiaryFullName) {
        setValue('newBeneficiaryFullName', fullNameFromParts, { shouldDirty: true });
    }
  }, [newBeneficiaryFirstName, newBeneficiaryMiddleName, newBeneficiaryLastName, newBeneficiaryFullName, setValue]);

  useEffect(() => {
     if (newBeneficiaryFirstName && newBeneficiaryLastName && !form.formState.dirtyFields.newBeneficiaryUserId) {
        const generatedUserId = `${newBeneficiaryFirstName.toLowerCase()}.${newBeneficiaryLastName.toLowerCase()}`.replace(/\s+/g, '');
        setValue('newBeneficiaryUserId', generatedUserId, { shouldValidate: true });
    }
  }, [newBeneficiaryFirstName, newBeneficiaryLastName, setValue, form.formState.dirtyFields.newBeneficiaryUserId]);

  const availableCategories = useMemo(() => {
      if (!selectedPurposeName) return [];
      const purpose = leadPurposes.find(p => p.name === selectedPurposeName);
      return (purpose?.categories || []).filter(c => c.enabled);
  }, [selectedPurposeName, leadPurposes]);


  useEffect(() => {
    if (selectedPurposeName === 'Loan') {
        form.setValue('isLoan', true, { shouldDirty: true });
    } else {
        form.setValue('isLoan', false, { shouldDirty: true });
    }
  }, [selectedPurposeName, form]);
    
  const handleAvailabilityCheck = useCallback(async (field: string, value: string, setState: React.Dispatch<React.SetStateAction<AvailabilityState>>) => {
    if (!value) {
        setState(initialAvailabilityState);
        return;
    }
    setState({ isChecking: true, isAvailable: null });
    const result = await checkAvailability(field, value);
    setState({ isChecking: false, ...result });
  }, []);

  // Debounced values
  const debouncedUserId = useDebounce(watch('userId'), 500);
  const debouncedEmail = useDebounce(watch('email'), 500);
  const debouncedPhone = useDebounce(watch('phone'), 500);
  const debouncedPan = useDebounce(watch('panNumber'), 500);
  const debouncedAadhaar = useDebounce(watch('aadhaarNumber'), 500);
  const debouncedBankAccount = useDebounce(watch('bankAccountNumber'), 500);
  const debouncedUpiIds = useDebounce(watch('upiIds'), 500);

  // Effects for debounced checks
  useEffect(() => { if(debouncedUserId) handleAvailabilityCheck('userId', debouncedUserId, setUserIdState); }, [debouncedUserId, handleAvailabilityCheck]);
  useEffect(() => { if(debouncedEmail) handleAvailabilityCheck('email', debouncedEmail || '', setEmailState); }, [debouncedEmail, handleAvailabilityCheck]);
  useEffect(() => { if(debouncedPhone) handleAvailabilityCheck('phone', debouncedPhone, setPhoneState); }, [debouncedPhone, handleAvailabilityCheck]);
  useEffect(() => { if(debouncedPan) handleAvailabilityCheck('panNumber', debouncedPan || '', setPanState); }, [debouncedPan, handleAvailabilityCheck]);
  useEffect(() => { if(debouncedAadhaar) handleAvailabilityCheck('aadhaarNumber', debouncedAadhaar || '', setAadhaarState); }, [debouncedAadhaar, handleAvailabilityCheck]);
  useEffect(() => { if(debouncedBankAccount) handleAvailabilityCheck('bankAccountNumber', debouncedBankAccount || '', setBankAccountState); }, [debouncedBankAccount, handleAvailabilityCheck]);

  useEffect(() => {
    debouncedUpiIds?.forEach((upi, index) => {
        if(upi.value) handleAvailabilityCheck('upiId', upi.value, (state) => setUpiIdStates(prev => ({...prev, [index]: state})));
    });
  }, [debouncedUpiIds, handleAvailabilityCheck]);
    
  const handleGetTextFromDocuments = async (filesToScan: (File | null | undefined)[], textSetter: React.Dispatch<React.SetStateAction<string>>, loadingSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
      const validFiles = filesToScan.filter((file): file is File => file instanceof File && file.size > 0);
      if (validFiles.length === 0) {
          toast({ variant: 'destructive', title: 'No Files', description: 'Please upload at least one document to scan.' });
          return;
      }
      loadingSetter(true);
      const formData = new FormData();
      validFiles.forEach((file, index) => {
          formData.append(`file_${index}`, file);
      });
  
      try {
          const result = await getRawTextFromImage(formData);
          if (result.success && result.rawText) {
              textSetter(result.rawText);
              toast({ variant: 'success', title: 'Text Extracted', description: 'Raw text is available for auto-fill.' });
          } else {
              toast({ variant: 'destructive', title: 'Extraction Failed', description: result.error || 'Could not extract any text from the documents.' });
          }
      } catch (e) {
          toast({ variant: 'destructive', title: 'Error', description: "An unexpected error occurred during text extraction." });
      } finally {
          loadingSetter(false);
      }
  };
    
  const handleFullAutoFill = async () => {
    if (!caseRawText) {
      toast({ variant: 'destructive', title: 'No Text', description: 'Please extract text from documents first.' });
      return;
    }
    setIsCaseAnalyzing(true);
    const result = await handleExtractLeadDetailsFromText(caseRawText, selectedPurposeName, selectedCategory);
    if (result.success && result.details) {
      const details = result.details;
      if (details.headline) setValue('headline', details.headline, { shouldDirty: true });
      if (details.story) setValue('story', details.story, { shouldDirty: true });
      if (details.diseaseIdentified) setValue('diseaseIdentified', details.diseaseIdentified, { shouldDirty: true });
      if (details.diseaseStage) setValue('diseaseStage', details.diseaseStage, { shouldDirty: true });
      if (details.diseaseSeriousness) setValue('diseaseSeriousness', details.diseaseSeriousness, { shouldDirty: true });
      if (details.purpose) {
        const matchingPurpose = leadPurposes.find(p => p.name.toLowerCase() === details.purpose?.toLowerCase());
        if (matchingPurpose) setValue('purpose', matchingPurpose.name, { shouldDirty: true });
      }
      if (details.category) setValue('category', details.category, { shouldDirty: true });
      if (details.amount) setValue('helpRequested', details.amount, { shouldDirty: true });
      if (details.dueDate) setValue('dueDate', new Date(details.dueDate), { shouldDirty: true });
      if (details.caseDetails) setValue('caseDetails', details.caseDetails, { shouldDirty: true });
      if (details.semester) setValue('semester', details.semester, { shouldDirty: true });

      toast({ variant: 'success', title: 'Auto-fill Complete', description: 'Please review the populated fields.' });
    } else {
      toast({ variant: 'destructive', title: 'Auto-fill Failed', description: result.error || 'An unknown error occurred.' });
    }
    setIsCaseAnalyzing(false);
  };
  
  const handleRefreshSummary = async () => {
    if (!caseRawText) {
        toast({ variant: 'destructive', title: 'No Text', description: 'Please scan documents first.' });
        return;
    }
    setIsRefreshingSummary(true);
    const result = await handleExtractLeadDetailsFromText(caseRawText, selectedPurposeName, selectedCategory);
     if (result.success && result.details?.headline) {
        setValue('headline', result.details.headline, { shouldDirty: true });
        toast({ variant: 'success', title: 'Case Summary Refreshed' });
    } else {
        toast({ variant: 'destructive', title: 'Failed to Regenerate Summary', description: result.error });
    }
    setIsRefreshingSummary(false);
  }
  
  const handleRefreshStory = async () => {
    if (!caseRawText) {
        toast({ variant: 'destructive', title: 'No Text', description: 'Please scan documents first.' });
        return;
    }
    setIsRefreshingStory(true);
    const result = await handleExtractLeadDetailsFromText(caseRawText, selectedPurposeName, selectedCategory);
    if (result.success && result.details?.story) {
        setValue('story', result.details.story, { shouldDirty: true });
        toast({ variant: 'success', title: 'Story Refreshed' });
    } else {
         toast({ variant: 'destructive', title: 'Failed to Regenerate Story', description: result.error });
    }
    setIsRefreshingStory(false);
  }

  const handleBeneficiaryAutoFill = async (isRefresh = false) => {
    if (!beneficiaryRawText) {
         toast({ variant: 'destructive', title: 'No Text', description: 'Please extract text from beneficiary documents first.' });
        return;
    }
    
    const loadingSetter = isRefresh ? setIsRefreshingDetails : setIsBeneficiaryAnalyzing;
    loadingSetter(true);

    let missingFields: (keyof ExtractBeneficiaryDetailsOutput)[] = [];
    if (isRefresh && extractedBeneficiaryDetails) {
        missingFields = Object.keys(extractedBeneficiaryDetails).filter(key => !extractedBeneficiaryDetails[key as keyof ExtractBeneficiaryDetailsOutput]) as (keyof ExtractBeneficiaryDetailsOutput)[];
    }
    const analysisResult = await handleExtractLeadBeneficiaryDetailsFromText(beneficiaryRawText, missingFields.length > 0 ? missingFields : undefined);
            
    if (analysisResult.success && analysisResult.details) {
         if (isRefresh && extractedBeneficiaryDetails) {
            // Merge new results with existing ones
            const mergedDetails = { ...extractedBeneficiaryDetails, ...analysisResult.details };
            setExtractedBeneficiaryDetails(mergedDetails);
            toast({ variant: 'success', title: 'Refresh Complete', description: 'AI tried to find the missing details.' });
        } else {
            setExtractedBeneficiaryDetails(analysisResult.details);
        }
    } else {
        toast({ variant: 'destructive', title: 'Analysis Failed', description: analysisResult.error || "Could not extract structured details from text." });
    }
    loadingSetter(false);
  }

  const beneficiaryDialogFields: { key: keyof ExtractBeneficiaryDetailsOutput; label: string }[] = [
    { key: 'beneficiaryFullName', label: 'Full Name' },
    { key: 'beneficiaryFirstName', label: 'First Name' },
    { key: 'beneficiaryMiddleName', label: 'Middle Name' },
    { key: 'beneficiaryLastName', label: 'Last Name' },
    { key: 'fatherName', label: "Father's Name" },
    { key: 'dateOfBirth', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'beneficiaryPhone', label: 'Phone' },
    { key: 'aadhaarNumber', label: 'Aadhaar Number' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'pincode', label: 'Pincode' },
    { key: 'country', label: 'Country' },
];

  const applyExtractedBeneficiaryDetails = () => {
    if (!extractedBeneficiaryDetails) return;
    const details = extractedBeneficiaryDetails;
    
    // Iterate over the keys to set form values
    Object.entries(details).forEach(([key, value]) => {
        if (value) {
            switch (key) {
                case 'beneficiaryFullName': setValue('newBeneficiaryFullName', value, { shouldDirty: true }); break;
                case 'beneficiaryFirstName': setValue('newBeneficiaryFirstName', value, { shouldDirty: true }); break;
                case 'beneficiaryMiddleName': setValue('newBeneficiaryMiddleName', value, { shouldDirty: true }); break;
                case 'beneficiaryLastName': setValue('newBeneficiaryLastName', value, { shouldDirty: true }); break;
                case 'fatherName': setValue('newBeneficiaryFatherName', value, { shouldDirty: true }); break;
                case 'beneficiaryPhone':
                    const phone = value.replace(/\D/g, '').slice(-10);
                    setValue('newBeneficiaryPhone', phone, { shouldDirty: true, shouldValidate: true });
                    break;
                case 'aadhaarNumber':
                    setValue('newBeneficiaryAadhaar', value.replace(/\D/g,''), { shouldDirty: true, shouldValidate: true });
                    break;
                case 'address': setValue('addressLine1', value, { shouldDirty: true }); break;
                case 'city': setValue('city', value, { shouldDirty: true }); break;
                case 'pincode': setValue('pincode', value, { shouldDirty: true }); break;
                case 'country': setValue('country', value, { shouldDirty: true }); break;
                case 'gender':
                    const genderValue = value as 'Male' | 'Female' | 'Other';
                    if (['Male', 'Female', 'Other'].includes(genderValue)) {
                        setValue('gender', genderValue, { shouldDirty: true });
                    }
                    break;
                case 'dateOfBirth':
                    const dateString = value.replace(/\s/g, '');
                    const parts = dateString.split(/[\/\-]/);
                    let date: Date | null = null;
                    if (parts.length === 3) {
                        const [d, m, y] = parts;
                        if (y.length === 4) {
                            date = new Date(`${y}-${m}-${d}`);
                        } else if (y.length === 2) {
                            date = new Date(`${parseInt(y) > 50 ? '19' : '20'}${y}-${m}-${d}`);
                        }
                    }
                    if (date && !isNaN(date.getTime())) {
                        setValue('dateOfBirth', date, { shouldDirty: true });
                    }
                    break;
            }
        }
    });

    toast({ variant: 'success', title: 'Auto-fill Complete', description: 'Beneficiary details have been populated. Please review.' });
    setExtractedBeneficiaryDetails(null);
  }

  async function onSubmit(values: AddLeadFormValues, forceCreate: boolean = false) {
    if (!adminUser?.id) {
        toast({ variant: "destructive", title: "Error", description: "Could not identify admin. Please log in again." });
        return;
    }
    
    setIsSubmitting(true);
    setCreationStatus([]); // Reset status on new submission

    let finalBeneficiaryId = values.beneficiaryId;

    // --- Step 1: Create Beneficiary if 'new' is selected ---
    if (values.beneficiaryType === 'new') {
        setCreationStatus([{ name: 'Creating Beneficiary', status: 'in-progress' }]);
        const userFormData = new FormData();
        // Append all relevant new user fields
        Object.keys(values).forEach(key => {
            if (key.startsWith('newBeneficiary') || ['gender', 'isAnonymousAsBeneficiary', 'aadhaarCard', 'addressLine1', 'city', 'state', 'country', 'pincode'].includes(key)) {
                const value = values[key as keyof AddLeadFormValues];
                if (value) {
                     if (value instanceof File) {
                         userFormData.append(key, value);
                     } else {
                        userFormData.append(key, String(value));
                     }
                }
            }
        });
        userFormData.append('roles', 'Beneficiary'); // Always assign Beneficiary role

        const userResult = await handleAddUser(userFormData);
        
        if (userResult.success && userResult.user?.id) {
            setCreationStatus(prev => prev.map(s => s.name === 'Creating Beneficiary' ? { ...s, status: 'success', details: `User ID: ${userResult.user?.userId}` } : s));
            finalBeneficiaryId = userResult.user.id;
        } else {
            setCreationStatus(prev => prev.map(s => s.name === 'Creating Beneficiary' ? { ...s, status: 'error', details: userResult.error } : s));
            toast({ variant: 'destructive', title: 'Beneficiary Creation Failed', description: userResult.error });
            setIsSubmitting(false);
            return;
        }
    }
    
    // --- Step 2: Create Lead ---
    setCreationStatus(prev => [...prev, { name: 'Creating Lead', status: 'in-progress' }]);
    
    const leadFormData = new FormData();
    Object.keys(values).forEach(key => {
        const formKey = key as keyof AddLeadFormValues;
        const value = values[formKey] as any;
        if (value && !key.startsWith('newBeneficiary')) {
            if (Array.isArray(value)) {
                if(key === 'otherDocuments') value.forEach(f => f instanceof File && leadFormData.append(key, f));
                else value.forEach(v => leadFormData.append(key, v));
            }
            else if (value instanceof Date) leadFormData.append(key, value.toISOString());
            else if (typeof value === 'boolean') { if (value) leadFormData.append(key, 'on'); }
            else if (value instanceof File) leadFormData.append(key, value);
            else leadFormData.append(key, String(value));
        }
    });

    leadFormData.append("adminUserId", adminUser.id);
    if(finalBeneficiaryId) leadFormData.set("beneficiaryId", finalBeneficiaryId); // Use final ID
    if(forceCreate) leadFormData.append("forceCreate", "true");
    
    const leadResult = await handleAddLead(leadFormData);
    
    if (leadResult.duplicateLeadWarning) {
        setDuplicateWarning(leadResult.duplicateLeadWarning);
        setIsSubmitting(false);
        setCreationStatus([]);
        return;
    }

    if (leadResult.success && leadResult.lead) {
        setCreationStatus(prev => prev.map(s => s.name === 'Creating Lead' ? { ...s, status: 'success', details: `Lead ID: ${leadResult.lead?.id}` } : s));
        toast({ variant: "success", title: "Lead Created Successfully!", duration: 5000 });
        setTimeout(() => {
            handleCancel();
        }, 1000);
    } else {
        setCreationStatus(prev => prev.map(s => s.name === 'Creating Lead' ? { ...s, status: 'error', details: leadResult.error } : s));
        toast({ variant: "destructive", title: "Error Creating Lead", description: leadResult.error });
    }

    setIsSubmitting(false);
  }
  
  const showEducationFields = selectedPurposeName === 'Education' && (selectedCategory === 'College Fees' || selectedCategory === 'School Fees');
  const showYearField = showEducationFields && selectedDegree && !['SSC'].includes(selectedDegree);
  const showSemesterField = showEducationFields && selectedDegree && !['SSC', 'HSC'].includes(selectedDegree);
  const yearOptions = useMemo(() => {
      if (selectedCategory === 'School Fees') return leadConfiguration.schoolYearOptions || [];
      if (selectedCategory === 'College Fees') return leadConfiguration.collegeYearOptions || [];
      return [];
  }, [selectedCategory, leadConfiguration]);

  const isAnyFieldInvalid = userIdState.isAvailable === false || emailState.isAvailable === false || phoneState.isAvailable === false || panState.isAvailable === false || aadhaarState.isAvailable === false || bankAccountState.isAvailable === false || Object.values(upiIdStates).some(s => s.isAvailable === false);


  return (
    <>
        {isFormDisabled && (
            <Alert variant="destructive" className="mb-6">
                <Lock className="h-4 w-4" />
                <AlertTitle>Lead Creation Disabled</AlertTitle>
                <AlertDescription>
                    The lead approval process is currently disabled. Only users with override permissions can create new leads.
                </AlertDescription>
            </Alert>
        )}

        <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => onSubmit(values, false))} className="space-y-6 max-w-2xl">
            <fieldset disabled={isFormDisabled} className="space-y-6">
                 <h3 className="text-lg font-semibold border-b pb-2">Beneficiary Details</h3>
                <FormField
                    control={form.control}
                    name="linkBeneficiaryLater"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 bg-amber-500/10">
                        <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                        <FormLabel>
                            Link Beneficiary Later
                        </FormLabel>
                        <FormDescription>Check this if you do not have the beneficiary's full details and want to create the lead with just a name.</FormDescription>
                        </div>
                    </FormItem>
                    )}
                />
                 
                {linkBeneficiaryLater ? (
                    <FormField control={form.control} name="manualBeneficiaryName" render={({ field }) => (<FormItem><FormLabel>Beneficiary Name</FormLabel><FormControl><Input placeholder="Enter the beneficiary's full name" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                ) : (
                <>
                <FormField
                    control={form.control}
                    name="beneficiaryType"
                    render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormControl>
                        <RadioGroup
                            onValueChange={(value) => field.onChange(value as 'existing' | 'new')}
                            value={field.value}
                            className="grid grid-cols-2 gap-4"
                        >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                    <Button type="button" variant={field.value === 'existing' ? 'default' : 'outline'} className="w-full h-20 flex-col gap-2" onClick={() => field.onChange('existing')}>
                                        <UserSearch className="h-6 w-6"/>
                                        <span>Search Existing</span>
                                    </Button>
                                </FormControl>
                            </FormItem>
                             <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                     <Button type="button" variant={field.value === 'new' ? 'default' : 'outline'} className="w-full h-20 flex-col gap-2" onClick={() => field.onChange('new')}>
                                        <UserRoundPlus className="h-6 w-6"/>
                                        <span>Create New</span>
                                    </Button>
                                </FormControl>
                            </FormItem>
                        </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                
                {beneficiaryType === 'existing' ? (
                     <FormField
                        control={form.control}
                        name="beneficiaryId"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Select Beneficiary</FormLabel>
                            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                className={cn("w-full justify-between", !field.value && "text-muted-foreground" )}
                                >
                                {field.value
                                    ? potentialBeneficiaries.find(
                                        (user) => user.id === field.value
                                    )?.name
                                    : "Search by name, phone, Aadhaar..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search by name, phone, Aadhaar, PAN, UPI..." />
                                <CommandList>
                                    <CommandEmpty>No beneficiaries found.</CommandEmpty>
                                    <CommandGroup>
                                    {potentialBeneficiaries.map((user) => (
                                        <CommandItem
                                        value={`${user.name} ${user.phone} ${user.aadhaarNumber} ${user.panNumber} ${user.upiIds?.join(' ')}`}
                                        key={user.id}
                                        onSelect={() => {
                                            form.setValue("beneficiaryId", user.id!);
                                            setPopoverOpen(false);
                                        }}
                                        >
                                        <Check className={cn("mr-2 h-4 w-4", user.id === field.value ? "opacity-100" : "opacity-0")} />
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
                ) : (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <Accordion type="single" collapsible>
                            <AccordionItem value="scan-beneficiary-docs">
                                <AccordionTrigger>
                                     <div className="flex items-center gap-2 text-primary">
                                        <ScanSearch className="h-5 w-5" />
                                        Scan Aadhaar Card (Optional)
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4">
                                     <div className="space-y-4 p-4 border rounded-lg bg-background">
                                         <p className="text-sm text-muted-foreground">Upload an Aadhaar card to auto-fill the new beneficiary's details.</p>
                                          <FormField control={form.control} name="aadhaarCard" render={({ field: { onChange, value, ...fieldProps } }) => ( <FormItem><FormLabel>Aadhaar Card</FormLabel><FormControl><Input type="file" accept="image/*,application/pdf" ref={aadhaarInputRef} onChange={e => { onChange(e.target.files?.[0]); setAadhaarPreview(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null); }} /></FormControl><FormMessage /></FormItem>)} />
                                          {aadhaarPreview && (
                                            <div className="relative group p-2 border rounded-lg">
                                                <Image src={aadhaarPreview} alt="Aadhaar Preview" width={200} height={120} className="rounded-md object-cover"/>
                                                 <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => { form.setValue('aadhaarCard', null); setAadhaarPreview(null); if(aadhaarInputRef.current) aadhaarInputRef.current.value = ""; }}><X className="h-4 w-4"/></Button>
                                            </div>
                                          )}
                                         <div className="flex flex-col sm:flex-row gap-2">
                                             <Button type="button" variant="outline" className="w-full" onClick={() => handleGetTextFromDocuments([getValues('aadhaarCard')], setBeneficiaryRawText, setIsBeneficiaryTextExtracting)} disabled={isBeneficiaryTextExtracting}>
                                                {isBeneficiaryTextExtracting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Text className="mr-2 h-4 w-4" />}
                                                Scan Aadhaar
                                            </Button>
                                            <Button type="button" className="w-full" onClick={() => handleBeneficiaryAutoFill()} disabled={!beneficiaryRawText || isBeneficiaryAnalyzing}>
                                                {isBeneficiaryAnalyzing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4" />}
                                                Get Beneficiary Details
                                            </Button>
                                         </div>
                                         {beneficiaryRawText && (
                                            <div className="space-y-2 pt-4">
                                                <Label>Extracted Text</Label>
                                                <Textarea value={beneficiaryRawText} readOnly rows={8} className="text-xs font-mono bg-background" />
                                            </div>
                                        )}
                                     </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                        <h3 className="font-medium pt-4">New Beneficiary Details</h3>
                        <FormField control={form.control} name="newBeneficiaryFullName" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Full Name" {...field} onChange={handleFullNameChange} /></FormControl><FormDescription>Edit this to automatically update the fields below.</FormDescription><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="newBeneficiaryFirstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="First Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="newBeneficiaryMiddleName" render={({ field }) => (<FormItem><FormLabel>Middle Name</FormLabel><FormControl><Input placeholder="Middle Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="newBeneficiaryLastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Last Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        
                        <FormField
                            control={form.control}
                            name="newBeneficiaryUserId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>User ID</FormLabel>
                                <FormControl>
                                    <Input placeholder="auto-generated or custom" {...field} />
                                </FormControl>
                                <AvailabilityFeedback state={userIdState} fieldName="User ID" onSuggestionClick={(s) => setValue('newBeneficiaryUserId', s, { shouldValidate: true })} />
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="newBeneficiaryFatherName" render={({ field }) => (<FormItem><FormLabel>Father&apos;s Name</FormLabel><FormControl><Input placeholder="Father's Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="newBeneficiaryPhone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input type="tel" maxLength={10} placeholder="Enter 10-digit phone number" {...field} />
                                    </FormControl>
                                    <AvailabilityFeedback state={phoneState} fieldName="phone number" />
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="newBeneficiaryAadhaar"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Aadhaar Number {isAadhaarMandatory && <span className="text-destructive">*</span>}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter 12-digit Aadhaar number" {...field} />
                                    </FormControl>
                                     <AvailabilityFeedback state={aadhaarState} fieldName="Aadhaar number" />
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                        <FormField control={form.control} name="gender" render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel>Gender</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4 pt-2">
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Male" /></FormControl><FormLabel className="font-normal">Male</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Female" /></FormControl><FormLabel className="font-normal">Female</FormLabel></FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>)} />
                        <h4 className="font-medium pt-2">Address</h4>
                        <FormField control={form.control} name="addressLine1" render={({field}) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="city" render={({field}) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="state" render={({field}) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="pincode" render={({field}) => (<FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        </div>
                         <FormField control={form.control} name="country" render={({field}) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                )}
                </>
                )}
                 
                 <h3 className="text-lg font-semibold border-b pb-2">Case Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                        control={form.control}
                        name="purpose"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Lead Purpose</FormLabel>
                            <Select onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue('category', '');
                                form.setValue('otherCategoryDetail', '');
                                form.setValue('otherPurposeDetail', '');
                            }} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a purpose" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {leadPurposes.map(purpose => (
                                    <SelectItem key={purpose.id} value={purpose.name}>{purpose.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormDescription>The main reason for the help request.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    {selectedPurposeName && selectedPurposeName !== 'Other' && (
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {(availableCategories || []).map(cat => (
                                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                 </div>
                 
                {showEducationFields && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="degree"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Degree/Class</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a degree/class" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {(leadConfiguration.degreeOptions || []).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {showYearField && (
                             <FormField
                                control={form.control}
                                name="year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Year</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {yearOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                        {showSemesterField && (
                             <FormField
                                control={form.control}
                                name="semester"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Semester</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {semesterOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                )}
                 
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>
                            <div className="flex items-center gap-2 text-primary">
                                <ScanSearch className="h-5 w-5" />
                                {dynamicText.scanSectionTitle}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                             <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">Upload case-specific documents like medical reports or fee receipts. The AI will scan them to help you fill out the case details, headline, and story.</p>
                                <FormField
                                    control={form.control}
                                    name="otherDocuments"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Case Documents</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="file"
                                                    multiple
                                                    accept="image/*,application/pdf"
                                                    ref={otherDocsInputRef}
                                                    onChange={(e) => {
                                                        const newFiles = Array.from(e.target.files || []);
                                                        const currentFiles = getValues('otherDocuments') || [];
                                                        const updatedFiles = [...currentFiles, ...newFiles];
                                                        field.onChange(updatedFiles);
                                                        setOtherDocumentsPreviews(urls => [...urls, ...newFiles.map(file => URL.createObjectURL(file))]);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {otherDocumentsPreviews.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {otherDocumentsPreviews.map((url, index) => {
                                             const files = getValues('otherDocuments') || [];
                                             const zoom = zoomLevels[String(index)]?.zoom || 1;
                                             const rotation = zoomLevels[String(index)]?.rotation || 0;
                                             const isImage = files[index]?.type.startsWith('image/');
                                            return (
                                            <div key={url} className="relative group p-1 border rounded-lg bg-background space-y-2">
                                                 <div className="w-full h-24 overflow-auto flex items-center justify-center">
                                                    {isImage ? (
                                                        <Image
                                                            src={url}
                                                            alt={`Preview ${index + 1}`}
                                                            width={100 * zoom}
                                                            height={100 * zoom}
                                                            className="object-contain transition-transform"
                                                            style={{transform: `rotate(${rotation}deg) scale(${zoom})`}}
                                                        />
                                                    ) : (
                                                        <FileIcon className="w-12 h-12 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{getValues('otherDocuments')?.[index]?.name}</p>
                                                <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 p-0.5 rounded-md">
                                                     <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoomLevels(z => ({...z, [String(index)]: {...(z[String(index)] || {zoom:1, rotation: 0}), zoom: (z[String(index)]?.zoom || 1) * 1.2}}))}><ZoomIn className="h-3 w-3"/></Button>
                                                     <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoomLevels(z => ({...z, [String(index)]: {...(z[String(index)] || {zoom:1, rotation: 0}), zoom: Math.max(0.5, (z[String(index)]?.zoom || 1) / 1.2)}}))}><ZoomOut className="h-3 w-3"/></Button>
                                                     <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setZoomLevels(z => ({...z, [String(index)]: {...(z[String(index)] || {zoom:1, rotation: 0}), rotation: ((z[String(index)]?.rotation || 0) + 90) % 360}}))}><RotateCw className="h-3 w-3"/></Button>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => {
                                                         const currentFiles = getValues('otherDocuments') || [];
                                                         const updatedFiles = currentFiles.filter((_, i) => i !== index);
                                                         setValue('otherDocuments', updatedFiles, { shouldDirty: true });
                                                         setOtherDocumentsPreviews(prev => prev.filter((_, i) => i !== index));
                                                    }}><XCircle className="h-4 w-4 text-destructive"/></Button>
                                                </div>
                                            </div>
                                        )})}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-full flex-col gap-2 border-dashed min-h-28"
                                            onClick={() => otherDocsInputRef.current?.click()}
                                        >
                                            <PlusCircle className="h-8 w-8 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">Add More Files</span>
                                        </Button>
                                    </div>
                                )}
                                
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button type="button" variant="outline" className="w-full" onClick={() => handleGetTextFromDocuments(getValues('otherDocuments'), setCaseRawText, setIsCaseTextExtracting)} disabled={isCaseTextExtracting}>
                                        {isCaseTextExtracting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Text className="mr-2 h-4 w-4" />}
                                        Get Case Details
                                    </Button>
                                    <Button type="button" className="w-full" onClick={handleFullAutoFill} disabled={!caseRawText || isCaseAnalyzing}>
                                        {isCaseAnalyzing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Bot className="mr-2 h-4 w-4" />}
                                        Fill Case Details
                                    </Button>
                                </div>
                                {caseRawText && (
                                    <div className="space-y-2 pt-4">
                                        <Label>Extracted Text</Label>
                                        <Textarea value={caseRawText} readOnly rows={8} className="text-xs font-mono bg-background" />
                                    </div>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <FormField control={form.control} name="headline" render={({ field }) => (<FormItem><FormLabel>Case Summary</FormLabel><div className="flex items-center gap-2"><FormControl><Input placeholder={dynamicText.caseSummaryPlaceholder} {...field} /></FormControl><Button type="button" variant="outline" size="icon" onClick={handleRefreshSummary} disabled={!caseRawText || isRefreshingSummary}>{isRefreshingSummary ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshIcon className="h-4 w-4"/>}</Button></div><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="story" render={({ field }) => (<FormItem><FormLabel>Story</FormLabel><div className="flex items-center gap-2"><FormControl><Textarea placeholder="Detailed narrative for public display" {...field} rows={5} /></FormControl><Button type="button" variant="outline" size="icon" onClick={handleRefreshStory} disabled={!caseRawText || isRefreshingStory}>{isRefreshingStory ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshIcon className="h-4 w-4"/>}</Button></div><FormMessage /></FormItem>)} />
                
                {selectedPurposeName === 'Medical' && (
                     <div className="p-4 border rounded-lg space-y-4">
                        <h4 className="font-semibold text-md">Medical Details</h4>
                        <FormField control={form.control} name="diseaseIdentified" render={({field}) => (<FormItem><FormLabel>Disease Identified</FormLabel><FormControl><Input placeholder="e.g., Typhoid, Cataract" {...field} /></FormControl></FormItem>)} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="diseaseStage" render={({field}) => (<FormItem><FormLabel>Disease Stage</FormLabel><FormControl><Input placeholder="e.g., Stage II, Chronic" {...field} /></FormControl></FormItem>)} />
                            <FormField control={form.control} name="diseaseSeriousness" render={({field}) => (<FormItem><FormLabel>Seriousness</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select seriousness" /></SelectTrigger></FormControl><SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Moderate">Moderate</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select></FormItem>)} />
                        </div>
                    </div>
                )}
                
                <FormField control={form.control} name="caseDetails" render={({ field }) => (<FormItem><FormLabel>Internal Case Notes</FormLabel><FormControl><Textarea placeholder="Admin-only notes and summary" {...field} /></FormControl><FormMessage /></FormItem>)} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="isHistoricalRecord" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-amber-500/10"><div className="space-y-0.5"><FormLabel className="text-base">Create record for a past/closed lead</FormLabel><FormDescription>This will allow you to select past dates.</FormDescription></div><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="caseReportedDate" render={({ field }) => (<FormItem><FormLabel>Case Reported Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full text-left font-normal",!field.value&&"text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{field.value?format(field.value,"PPP"):"Pick a date"}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(d) => d > new Date() && !isHistoricalRecord} /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                </div>
                 <FormField control={form.control} name="dueDate" render={({ field }) => (<FormItem><FormLabel>Due Date (Optional)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full text-left font-normal",!field.value&&"text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{field.value?format(field.value,"PPP"):"Pick a date"}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(d) => d < new Date() && !isHistoricalRecord} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                
                <h3 className="text-lg font-semibold border-b pb-2">Financials</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FormField control={control} name="helpRequested" render={({ field }) => (<FormItem><FormLabel>Amount Requested</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    {isHistoricalRecord && (
                      <FormField control={control} name="collectedAmount" render={({ field }) => (<FormItem><FormLabel>Amount Collected</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormDescription>Enter the final amount that was collected for this past case.</FormDescription><FormMessage /></FormItem>)} />
                    )}
                    <FormField control={control} name="fundingGoal" render={({ field }) => (<FormItem><FormLabel>Fundraising Goal (Target)</FormLabel><FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormDescription>The amount to be displayed on the public page.</FormDescription><FormMessage /></FormItem>)} />
                </div>
                 
                 <FormField
                    control={form.control}
                    name="isLoan"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                                This is a repayable loan
                            </FormLabel>
                        </div>
                        </FormItem>
                    )}
                    />
                 <FormField
                  control={form.control}
                  name="acceptableDonationTypes"
                  render={() => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold">Acceptable Donation Types</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {donationTypes.map((type) => (
                          <FormField
                            key={type}
                            control={form.control}
                            name="acceptableDonationTypes"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={type}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(type)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), type])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== type
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {type}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {creationStatus.length > 0 && (
                    <div className="space-y-4 rounded-lg border p-4">
                        <h4 className="font-semibold">Creation Progress</h4>
                        {creationStatus.map(step => (
                            <div key={step.name} className="flex items-center gap-4">
                                {step.status === 'pending' && <Loader2 className="h-5 w-5 text-muted-foreground" />}
                                {step.status === 'in-progress' && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
                                {step.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                {step.status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
                                <div>
                                    <p className="font-medium">{step.name}</p>
                                    {step.details && <p className="text-xs text-muted-foreground">{step.details}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="flex gap-4 pt-6 border-t">
                    <Button type="submit" disabled={isSubmitting || isAnyFieldChecking || isAnyFieldInvalid}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                        {isSubmitting ? 'Creating...' : 'Create Lead'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Clear Form
                    </Button>
                </div>
            </fieldset>
        </form>
        </Form>
        <AlertDialog open={!!duplicateWarning} onOpenChange={() => setDuplicateWarning(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                        Duplicate Lead Warning
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This beneficiary already has {duplicateWarning?.length} open lead(s). Are you sure you want to create another one?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="max-h-60 overflow-y-auto space-y-2 p-2 rounded-md bg-muted">
                    {duplicateWarning?.map(lead => (
                        <div key={lead.id} className="text-sm p-2 border bg-background rounded-md">
                            <p><strong>Purpose:</strong> {lead.purpose}</p>
                            <p><strong>Amount Requested:</strong> ₹{lead.helpRequested.toLocaleString()}</p>
                            <p><strong>Status:</strong> {lead.caseStatus}</p>
                        </div>
                    ))}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDuplicateWarning(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        setDuplicateWarning(null);
                        form.handleSubmit((values) => onSubmit(values, true))();
                    }}>
                        Yes, Create Anyway
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={!!extractedBeneficiaryDetails} onOpenChange={() => setExtractedBeneficiaryDetails(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                       <Bot className="h-6 w-6 text-primary" />
                        Confirm Auto-fill Details
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        The AI has extracted the following details from the document. Please review them before applying to the form.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="max-h-80 overflow-y-auto p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                    {beneficiaryDialogFields.map(({ key, label }) => {
                        const value = extractedBeneficiaryDetails?.[key as keyof ExtractBeneficiaryDetailsOutput] as string | undefined;
                        return (
                            <div key={key} className="flex justify-between border-b pb-1">
                                <span className="text-muted-foreground capitalize">{label}</span>
                                {value ? (
                                     <span className="font-semibold text-right">{value}</span>
                                ) : (
                                    <span className="text-destructive font-normal text-right">Not Found</span>
                                )}
                            </div>
                        )
                    })}
                </div>
                <AlertDialogFooter>
                     <Button variant="outline" onClick={() => handleBeneficiaryAutoFill(true)} disabled={isRefreshingDetails}>
                        {isRefreshingDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshIcon className="mr-2 h-4 w-4" />}
                        Refresh
                    </Button>
                    <div className='flex gap-2'>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={applyExtractedBeneficiaryDetails}>Apply & Fill Form</AlertDialogAction>
                    </div>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

export function AddLeadForm(props: { settings: AppSettings, users: User[], campaigns: Campaign[] }) {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <AddLeadFormContent {...props} />
        </Suspense>
    )
}
