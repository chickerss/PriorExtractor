import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AzureConnection, azureConnectionSchema } from "@shared/schema";
import { Upload } from "lucide-react";

interface AzureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (connection: AzureConnection) => Promise<void>;
  isUploading?: boolean;
}

export function AzureDialog({ 
  open, 
  onOpenChange,
  onUpload,
  isUploading = false 
}: AzureDialogProps) {
  // Azure authentication form
  const form = useForm<AzureConnection>({
    resolver: zodResolver(azureConnectionSchema),
    defaultValues: {
      workspaceUrl: "",
      accessToken: "",
      directoryPath: "dbfs:/FileStore/prior-auth-data/",
    },
  });

  const handleSubmit = async (data: AzureConnection) => {
    try {
      await onUpload(data);
    } catch (error) {
      console.error("Failed to upload to Azure:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload to Azure Databricks</DialogTitle>
          <DialogDescription>
            Enter your Azure Databricks connection information to upload the extracted data.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="workspaceUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://your-workspace.azuredatabricks.net"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="accessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Your access token"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="directoryPath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DBFS Directory Path</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="dbfs:/FileStore/prior-auth-data/"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
