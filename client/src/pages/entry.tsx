import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertMaterialSchema } from "@shared/schema";
import { useCreateMaterial } from "@/hooks/use-materials";
import { useCreateTransaction } from "@/hooks/use-transactions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Link, useLocation } from "wouter";

// Extend schema to include transaction details (enteredBy)
const entryFormSchema = insertMaterialSchema.extend({
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
});

type EntryFormValues = z.infer<typeof entryFormSchema>;

export default function Entry() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createMaterial = useCreateMaterial();
  const createTransaction = useCreateTransaction();

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      materialCode: "",
      name: "",
      quantity: 0,
      rackId: "",
      binNumber: "",
    },
  });

  async function onSubmit(data: EntryFormValues) {
    try {
      // 1. Create the material (upsert logic handled on backend or error if exists)
      await createMaterial.mutateAsync({
        materialCode: data.materialCode,
        name: data.name,
        quantity: data.quantity,
        rackId: data.rackId,
        binNumber: data.binNumber,
      });

      // 2. Log transaction
      await createTransaction.mutateAsync({
        materialCode: data.materialCode,
        type: "ENTRY",
        quantity: data.quantity,
        rackId: data.rackId,
        binNumber: data.binNumber,
        personName: "SYSTEM",
      });

      toast({
        title: "Success",
        description: `Material ${data.materialCode} entered successfully.`,
      });
      
      form.reset();
      setLocation("/search"); // Redirect to verify
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enter material",
        variant: "destructive",
      });
    }
  }

  const isSubmitting = createMaterial.isPending || createTransaction.isPending;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold">Material Entry</h1>
          <p className="text-muted-foreground">Register new inventory into the system.</p>
        </div>
      </div>

      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>All fields are required for accurate tracking.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="materialCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Code</FormLabel>
                      <FormControl>
                        <Input placeholder="MAT-XXXX" {...field} className="font-mono uppercase" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Blue Cotton Thread" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rackId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rack ID</FormLabel>
                        <FormControl>
                          <Input placeholder="A1" {...field} className="uppercase" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="binNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bin No.</FormLabel>
                        <FormControl>
                          <Input placeholder="05" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

             
              <div className="flex justify-end gap-4 pt-4">
                <Link href="/">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Confirm Entry
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
