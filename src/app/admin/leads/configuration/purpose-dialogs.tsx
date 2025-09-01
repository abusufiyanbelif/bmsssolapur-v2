

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Edit, Trash2 } from "lucide-react";
import { handleAddLeadPurpose, handleUpdateLeadPurpose, handleDeleteLeadPurpose, handleAddCategory, handleUpdateCategory, handleDeleteCategory } from "./actions";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface AddPurposeDialogProps {
    purposeToEdit?: { id: string; name: string };
}

export function AddPurposeDialog({ purposeToEdit }: AddPurposeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(purposeToEdit?.name || "");
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = purposeToEdit 
        ? await handleUpdateLeadPurpose(purposeToEdit.name, name)
        : await handleAddLeadPurpose(name);

    if (result.success) {
      toast({ variant: 'success', title: `Purpose ${purposeToEdit ? 'Updated' : 'Created'}`, description: `The purpose "${name}" has been successfully saved.` });
      setOpen(false);
      setName("");
      router.refresh(); // This might not be enough, parent may need to re-fetch
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {purposeToEdit ? (
             <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
        ) : (
             <Button><PlusCircle className="mr-2 h-4 w-4" />Create Purpose</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{purposeToEdit ? 'Edit' : 'Create'} Lead Purpose</DialogTitle>
          <DialogDescription>
            {purposeToEdit ? 'Rename this purpose.' : 'Add a new purpose to be used for lead categorization.'}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
            <Label htmlFor="purpose-name">Purpose Name</Label>
            <Input id="purpose-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting || !name}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {purposeToEdit ? 'Save Changes' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


interface DeletePurposeDialogProps {
    purposeToDelete: { id: string, name: string };
    allPurposes: { id: string, name: string }[];
}


export function DeletePurposeDialog({ purposeToDelete, allPurposes }: DeletePurposeDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newPurpose, setNewPurpose] = useState<string>("");
    const { toast } = useToast();
    const router = useRouter();

    const availablePurposes = allPurposes.filter(p => p.id !== purposeToDelete.id);

    const handleDelete = async () => {
        if(!newPurpose) {
            toast({variant: 'destructive', title: 'Error', description: 'Please select a new purpose for existing leads.'});
            return;
        }
        setIsSubmitting(true);
        const result = await handleDeleteLeadPurpose(purposeToDelete.name, newPurpose);
         if (result.success) {
            toast({ variant: 'success', title: `Purpose Deleted`, description: `The purpose "${purposeToDelete.name}" has been successfully deleted.` });
            setOpen(false);
            router.refresh();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsSubmitting(false);
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                 <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete &quot;{purposeToDelete.name}&quot;?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. All existing leads with this purpose must be reassigned to a new purpose.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="new-purpose-select">Reassign existing leads to:</Label>
                     <Select onValueChange={setNewPurpose}>
                        <SelectTrigger id="new-purpose-select">
                            <SelectValue placeholder="Select a new purpose..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availablePurposes.map(purpose => (
                                <SelectItem key={purpose.id} value={purpose.name}>{purpose.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isSubmitting || !newPurpose}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete &amp; Reassign
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Dialogs for Categories

interface AddCategoryDialogProps {
    purposeId: string;
    categoryToEdit?: { id: string; name: string };
}

export function AddCategoryDialog({ purposeId, categoryToEdit }: AddCategoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState(categoryToEdit?.name || "");
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const result = categoryToEdit
            ? await handleUpdateCategory(purposeId, categoryToEdit.name, name)
            : await handleAddCategory(purposeId, name);

        if (result.success) {
            toast({ variant: 'success', title: `Category ${categoryToEdit ? 'Updated' : 'Created'}`, description: `The category "${name}" has been successfully saved.` });
            setOpen(false);
            setName("");
            router.refresh();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsSubmitting(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {categoryToEdit ? (
                    <Button variant="ghost" size="icon" className="h-6 w-6"><Edit className="h-3 w-3" /></Button>
                ) : (
                    <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />Add Category</Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{categoryToEdit ? 'Edit' : 'Create'} Category</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !name}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {categoryToEdit ? 'Save Changes' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface DeleteCategoryDialogProps {
    purposeId: string;
    categoryToDelete: { id: string; name: string };
    allCategories: { id: string; name: string }[];
}

export function DeleteCategoryDialog({ purposeId, categoryToDelete, allCategories }: DeleteCategoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCategory, setNewCategory] = useState<string>("");
    const { toast } = useToast();
    const router = useRouter();

    const availableCategories = allCategories.filter(c => c.id !== categoryToDelete.id);

    const handleDelete = async () => {
        if (!newCategory) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a new category for existing leads.' });
            return;
        }
        setIsSubmitting(true);
        const result = await handleDeleteCategory(purposeId, categoryToDelete.name, newCategory);
        if (result.success) {
            toast({ variant: 'success', title: `Category Deleted`, description: `The category "${categoryToDelete.name}" has been successfully deleted.` });
            setOpen(false);
            router.refresh();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsSubmitting(false);
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete &quot;{categoryToDelete.name}&quot;?</AlertDialogTitle>
                    <AlertDialogDescription>
                        All existing leads with this category must be reassigned to a new category within the same purpose.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="new-category-select">Reassign leads to:</Label>
                    <Select onValueChange={setNewCategory}>
                        <SelectTrigger id="new-category-select">
                            <SelectValue placeholder="Select a new category..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableCategories.map(cat => (
                                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isSubmitting || !newCategory}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete &amp; Reassign
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
