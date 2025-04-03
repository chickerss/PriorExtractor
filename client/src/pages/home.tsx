import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileUploader } from "@/components/file-uploader";
import { FileMetadataForm } from "@/components/file-metadata-form";
import { ResultsSection } from "@/components/results-section";
import { AzureDialog } from "@/components/azure-dialog";
import { Button } from "@/components/ui/button";
import { 
  UploadedFile, 
  FileMetadata, 
  ExtractedCode,
  AzureConnection
} from "@shared/schema";
import { processPDFFile } from "@/lib/pdf-utils";
import { downloadExtractedCodesAsCSV } from "@/lib/csv-utils";
import { uploadToAzureDatabricks } from "@/lib/azure-utils";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { PlusCircle } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAzureDialog, setShowAzureDialog] = useState(false);

  // Get extracted codes from the backend
  const { 
    data: extractedCodes = [], 
    isLoading: isLoadingCodes,
    refetch: refetchCodes
  } = useQuery({
    queryKey: ["/api/codes"],
    queryFn: ({ queryKey }) => fetch(queryKey[0] as string).then(res => res.json()),
  });

  // Mutation for processing a single PDF file
  const processPdfMutation = useMutation({
    mutationFn: async (data: { 
      file: File, 
      metadata: FileMetadata 
    }) => {
      const formData = new FormData();
      formData.append("file", data.file);
      
      console.log("Sending metadata with file:", data.metadata);
      
      // Always append metadata fields, even if they're empty strings
      // to ensure they get properly passed to the server
      formData.append("payer_name", data.metadata?.payerName || "Unknown Payer");
      formData.append("plan_name", data.metadata?.planName || data.file.name || "Unknown Plan");
      formData.append("year", data.metadata?.year?.toString() || new Date().getFullYear().toString());
      formData.append("line_of_business", data.metadata?.lineOfBusiness || "Unknown");
      
      const response = await fetch("/api/process-pdf", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process PDF");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/codes"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to process PDF: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    },
  });

  // Handle updating file metadata
  const updateFileMetadata = (fileId: string, metadata: FileMetadata) => {
    setUploadedFiles(prevFiles => 
      prevFiles.map(file => 
        file.id === fileId 
          ? { ...file, metadata } 
          : file
      )
    );
  };

  // Handle file processing
  const handleProcessFiles = async () => {
    setIsProcessing(true);
    
    try {
      // Process each file sequentially
      for (const file of uploadedFiles) {
        // Skip files that have already been processed
        if (file.status === 'processed') continue;
        
        // Update file status to processing
        setUploadedFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === file.id 
              ? { ...f, status: 'processing' as const } 
              : f
          )
        );
        
        // Setup default metadata if none provided
        const defaultMetadata = {
          payerName: "Unknown Payer",
          planName: file.file.name || "Unknown Plan",
          year: new Date().getFullYear(),
          lineOfBusiness: "Unknown"
        };
        
        // Process the file using the mutation
        await processPdfMutation.mutateAsync({ 
          file: file.file, 
          metadata: file.metadata || defaultMetadata 
        });
        
        // Update file status to processed
        setUploadedFiles(prevFiles => 
          prevFiles.map(f => 
            f.id === file.id 
              ? { ...f, status: 'processed' as const } 
              : f
          )
        );
      }
      
      toast({
        title: "Success",
        description: "All files processed successfully",
      });
      
      // Refetch codes to ensure we have the latest data
      await refetchCodes();
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Error",
        description: `Failed to process files: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle download as CSV
  const handleDownloadCSV = () => {
    if (extractedCodes.length === 0) {
      toast({
        title: "No data",
        description: "There are no extracted codes to download",
        variant: "destructive",
      });
      return;
    }
    
    downloadExtractedCodesAsCSV(extractedCodes);
    
    toast({
      title: "Success",
      description: "CSV file downloaded successfully",
    });
  };
  
  // Handle Azure upload
  const handleUploadToAzure = () => {
    if (extractedCodes.length === 0) {
      toast({
        title: "No data",
        description: "There are no extracted codes to upload",
        variant: "destructive",
      });
      return;
    }
    
    setShowAzureDialog(true);
  };
  
  // Handle Azure upload with connection details
  const handleAzureUpload = async (connection: AzureConnection) => {
    setIsUploading(true);
    
    try {
      const result = await uploadToAzureDatabricks(extractedCodes, connection);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        
        setShowAzureDialog(false);
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading to Azure:", error);
      toast({
        title: "Error",
        description: `Failed to upload to Azure: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12H15M12 9V15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="ml-2 text-xl font-semibold text-gray-900">Prior Auth Manager</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="pb-5 border-b border-gray-200 mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Prior Authorization Requirements</h1>
            <p className="mt-2 text-sm text-gray-600">Upload, extract, and manage prior authorization data from multiple payers</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900">Upload Documents</h2>
                <p className="mt-1 text-sm text-gray-500">Upload PDF files to extract CPT and HCPCS codes</p>
                
                <div className="mt-4">
                  <FileUploader 
                    uploadedFiles={uploadedFiles}
                    setUploadedFiles={setUploadedFiles}
                    onFileSelect={(file) => {
                      const index = uploadedFiles.findIndex(f => f.id === file.id);
                      if (index !== -1) {
                        setSelectedFileIndex(index);
                      }
                    }}
                  />
                </div>
                
                {uploadedFiles.length > 0 && (
                  <div className="mt-6">
                    <FileMetadataForm 
                      uploadedFiles={uploadedFiles}
                      selectedFileIndex={selectedFileIndex}
                      onUpdateMetadata={updateFileMetadata}
                      onSelectFileIndex={setSelectedFileIndex}
                    />
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleProcessFiles}
                    disabled={isProcessing || uploadedFiles.length === 0}
                  >
                    {isProcessing ? (
                      "Processing..."
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4 mr-1.5" />
                        Process Files
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <ResultsSection 
                  extractedCodes={extractedCodes}
                  onDownloadCSV={handleDownloadCSV}
                  onUploadToAzure={handleUploadToAzure}
                  isLoading={isLoadingCodes}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Prior Authorization Manager. All rights reserved.
          </p>
        </div>
      </footer>
      
      {/* Azure Dialog */}
      <AzureDialog
        open={showAzureDialog}
        onOpenChange={setShowAzureDialog}
        onUpload={handleAzureUpload}
        isUploading={isUploading}
      />
    </div>
  );
}
