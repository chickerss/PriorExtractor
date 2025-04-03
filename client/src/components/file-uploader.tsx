import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileImage, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UploadedFile } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

interface FileUploaderProps {
  uploadedFiles: UploadedFile[];
  setUploadedFiles: (files: UploadedFile[]) => void;
  onFileSelect: (file: UploadedFile) => void;
}

export function FileUploader({ uploadedFiles, setUploadedFiles, onFileSelect }: FileUploaderProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(file => file.type === "application/pdf");
    
    if (pdfFiles.length < acceptedFiles.length) {
      toast({
        title: "Invalid file type",
        description: "Only PDF files are accepted",
        variant: "destructive",
      });
    }
    
    if (pdfFiles.length > 0) {
      const newFiles = pdfFiles.map(file => ({
        id: uuidv4(),
        file,
        status: 'pending' as const,
      }));
      
      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
      
      // If this is the first file, select it
      if (uploadedFiles.length === 0 && newFiles.length > 0) {
        onFileSelect(newFiles[0]);
      }
    }
  }, [uploadedFiles, setUploadedFiles, onFileSelect, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Update the isDragging state when drag events occur
  const handleDragEnter = useCallback(() => setIsDragging(true), []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback(() => setIsDragging(false), []);

  const removeFile = (id: string) => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== id);
    setUploadedFiles(updatedFiles);
  };

  return (
    <div className="w-full space-y-4">
      <div 
        {...getRootProps()}
        className={`flex justify-center px-6 pt-5 pb-6 border-2 ${
          isDragActive || isDragging ? 'border-primary' : 'border-gray-300'
        } border-dashed rounded-md hover:border-primary transition-colors cursor-pointer`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-1 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none">
              <span>Upload PDF files</span>
              <input {...getInputProps()} className="sr-only" />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PDF files up to 10MB each</p>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900">Uploaded files</h3>
          <ul className="mt-3 divide-y divide-gray-100 max-h-60 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <li key={file.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center overflow-hidden">
                  <FileImage className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="ml-2 text-sm text-gray-700 truncate" title={file.file.name}>
                    {file.file.name}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-4 text-sm font-medium text-red-600 hover:text-red-500"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
