import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FileMetadata, UploadedFile, fileMetadataSchema } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FileMetadataFormProps {
  uploadedFiles: UploadedFile[];
  selectedFileIndex: number;
  onUpdateMetadata: (fileId: string, metadata: FileMetadata) => void;
  onSelectFileIndex: (index: number) => void;
}

export function FileMetadataForm({
  uploadedFiles,
  selectedFileIndex,
  onUpdateMetadata,
  onSelectFileIndex,
}: FileMetadataFormProps) {
  const selectedFile = uploadedFiles[selectedFileIndex];
  
  // Create years array from 2020 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i);
  
  // Lines of business options
  const linesOfBusiness = [
    "Medicare",
    "Medicaid",
    "Commercial",
    "Marketplace",
    "Other"
  ];

  const form = useForm<FileMetadata>({
    resolver: zodResolver(fileMetadataSchema),
    defaultValues: {
      payerName: selectedFile?.metadata?.payerName || "",
      planName: selectedFile?.metadata?.planName || "",
      year: selectedFile?.metadata?.year || currentYear,
      lineOfBusiness: selectedFile?.metadata?.lineOfBusiness || "Medicare",
    },
  });

  const handleSubmit = (data: FileMetadata) => {
    onUpdateMetadata(selectedFile.id, data);
    
    // If there are more files, go to the next one
    if (selectedFileIndex < uploadedFiles.length - 1) {
      onSelectFileIndex(selectedFileIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (selectedFileIndex > 0) {
      // Save current form data
      const formData = form.getValues();
      onUpdateMetadata(selectedFile.id, formData);
      
      // Go to previous file
      onSelectFileIndex(selectedFileIndex - 1);
    }
  };

  const goToNext = () => {
    const formData = form.getValues();
    onUpdateMetadata(selectedFile.id, formData);
    
    if (selectedFileIndex < uploadedFiles.length - 1) {
      onSelectFileIndex(selectedFileIndex + 1);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">File Metadata</h3>
      
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <p className="text-sm text-gray-600">
            Entering details for: <span className="font-medium">{selectedFile.file.name}</span>
          </p>
        </CardContent>
      </Card>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <FormField
              control={form.control}
              name="payerName"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Payer Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Anthem, UnitedHealthcare"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="planName"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Gold PPO, Bronze HMO"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Year</FormLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value, 10))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lineOfBusiness"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormLabel>Line of Business</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select line of business" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {linesOfBusiness.map((lob) => (
                        <SelectItem key={lob} value={lob}>
                          {lob}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={goToPrevious}
              disabled={selectedFileIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              type="button"
              onClick={goToNext}
              disabled={selectedFileIndex === uploadedFiles.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
