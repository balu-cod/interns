import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMaterial, useUpdateMaterial } from "@/hooks/use-materials";
import { useCreateTransaction } from "@/hooks/use-transactions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, PackageMinus, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";

const issueFormSchema = z.object({
  materialCode: z.string().min(1, "Material Code is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  issuedBy: z.string().min(1, "Issuer name is required"),
});

type IssueFormValues = z.infer<typeof issueFormSchema>;

export default function Issue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchCode, setSearchCode] = useState("");
  
  // Fetch material info when user searches
  const { data: material, isLoading: isLoadingMaterial } = useMaterial(searchCode);
  const updateMaterial = useUpdateMaterial();
  const createTransaction = useCreateTransaction();

  const form = useForm<IssueFormValues>({
    resolver: zodResolver(issueFormSchema),
    defaultValues: {
      materialCode: "",
      quantity: 0,
      issuedBy: user?.firstName || "",
    },
  });

  const handleSearch = () => {
    const code = form.getValues("materialCode");
    if (code) setSearchCode(code);
  };

  async function onSubmit(data: IssueFormValues) {
    if (!material) {
      toast({ title: "Error", description: "Please search and verify material first.", variant: "destructive" });
      return;
    }

    if (material.quantity < data.quantity) {
      toast({ title: "Error", description: "Insufficient quantity available.", variant: "destructive" });
      return;
    }

    try {
      // 1. Update inventory
      await updateMaterial.mutateAsync({
        id: material.id,
        quantity: material.quantity - data.quantity,
      });

      // 2. Log transaction
      await createTransaction.mutateAsync({
        materialCode: data.materialCode,
        type: "ISSUE",
        quantity: data.quantity,
        rackId: material.rackId,
        binNumber: material.binNumber,
        personName: data.issuedBy,
      });

      toast({
        title: "Success",
        description: `Issued ${data.quantity} of ${data.materialCode}.`,
      });
      
      form.reset();
      setSearchCode("");
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to issue material",
        variant: "destructive",
      });
    }
  }

  const isSubmitting = updateMaterial.isPending || createTransaction.isPending;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-orange-600">Material Issue</h1>
          <p className="text-muted-foreground">Disburse materials for production.</p>
        </div>
      </div>

      <Card className="border-t-4 border-t-orange-500 shadow-md">
        <CardHeader>
          <CardTitle>Issue Authorization</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="flex gap-2 items-end">
                <FormField
                  control={form.control}
                  name="materialCode"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Material Code</FormLabel>
                      <FormControl>
                        <Input placeholder="MAT-XXXX" {...field} className="font-mono uppercase" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="button" variant="secondary" onClick={handleSearch} disabled={isLoadingMaterial}>
                  {isLoadingMaterial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>

              {material && (
                <Alert className="bg-blue-50 border-blue-200">
                  <PackageMinus className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Stock Available: {material.quantity}</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Location: Rack {material.rackId} / Bin {material.binNumber} <br/>
                    <span className="text-xs opacity-75">{material.name}</span>
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity to Issue</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50" {...field} />
                    </FormControl>
                    <FormDescription>
                      Must be less than or equal to available stock.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issuedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issued By</FormLabel>
                    <FormControl>
                      <Input placeholder="Authorized Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isSubmitting || !material}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <PackageMinus className="w-4 h-4 mr-2" />
                    Authorize Issue
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
