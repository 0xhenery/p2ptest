import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { insertListingSchema } from "@shared/schema";
import { useP2PContract, listItem } from "@/lib/contracts";
import { useWeb3Store } from "@/lib/web3";
import { apiRequest } from "@/lib/queryClient";

export default function CreateListing() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const contract = useP2PContract();
  const { address } = useWeb3Store();

  const form = useForm({
    resolver: zodResolver(insertListingSchema),
    defaultValues: {
      itemName: "",
      description: "",
      price: "",
      twitterLink: "",
      telegramLink: "",
      sellerAddress: address || "",
      itemId: 0
    }
  });

  async function onSubmit(values: any) {
    console.log("Form submitted with values:", values);

    if (!contract || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log("Attempting to create listing with contract:", contract);

      // List item on blockchain
      const result = await listItem(contract, values.price);
      console.log("Contract transaction result:", result);

      // Save listing details to memory storage
      const response = await apiRequest("POST", "/api/listings", {
        ...values,
        itemId: parseInt(result.itemId),
        sellerAddress: address,
        price: result.price
      });

      console.log("API response:", response);

      toast({
        title: "Success",
        description: "Listing created successfully"
      });

      navigate("/");
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (ETH)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.000001" min="0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="twitterLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter Link</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://twitter.com/..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telegramLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telegram Link</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://t.me/..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Create Listing
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}