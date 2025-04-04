import { useState, useMemo } from "react";
import { ExtractedCode } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Download, ArrowUp, ArrowDown, Search, Upload, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface ResultsSectionProps {
  extractedCodes: ExtractedCode[];
  onDownloadCSV: () => void;
  onUploadToAzure?: () => void; // Make this optional
  isLoading?: boolean;
}

export function ResultsSection({ 
  extractedCodes, 
  onDownloadCSV, 
  onUploadToAzure,
  isLoading = false
}: ResultsSectionProps) {
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [payerFilter, setPayerFilter] = useState("all_payers");
  const [lobFilter, setLobFilter] = useState("all_lines");
  const [sortField, setSortField] = useState<keyof ExtractedCode>("code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique payers and lines of business for filters
  const uniquePayers = useMemo(() => {
    return [...new Set(extractedCodes.map(code => code.payerName))];
  }, [extractedCodes]);

  const uniqueLOBs = useMemo(() => {
    return [...new Set(extractedCodes.map(code => code.lineOfBusiness))];
  }, [extractedCodes]);

  // Handle sorting
  const handleSort = (field: keyof ExtractedCode) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort codes
  const filteredAndSortedCodes = useMemo(() => {
    // First filter
    let filtered = extractedCodes.filter(code => {
      const matchesSearch = searchTerm === "" || 
        code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.payerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (code.planName && code.planName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        code.lineOfBusiness.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.sourceFile.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (code.category && code.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (code.subcategory && code.subcategory.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (code.description && code.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesPayer = payerFilter === "all_payers" || code.payerName === payerFilter;
      const matchesLOB = lobFilter === "all_lines" || code.lineOfBusiness === lobFilter;
      
      return matchesSearch && matchesPayer && matchesLOB;
    });
    
    // Then sort
    const sorted = [...filtered].sort((a, b) => {
      // Handle cases where the field could be undefined
      const aValue = a[sortField] ?? "";
      const bValue = b[sortField] ?? "";
      
      // Compare values (handle string/number comparison)
      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
    
    return sorted;
  }, [extractedCodes, searchTerm, payerFilter, lobFilter, sortField, sortDirection]);

  // Get current page items
  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredAndSortedCodes.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredAndSortedCodes, currentPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredAndSortedCodes.length / itemsPerPage);

  // Get page numbers for pagination
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show a subset of pages with the current page in the middle
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      
      // Adjust startPage if endPage reached the maximum
      if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }, [currentPage, totalPages]);

  // Change page
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Extracted Data</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDownloadCSV}
            disabled={isLoading || extractedCodes.length === 0}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Download CSV
          </Button>
          {onUploadToAzure && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onUploadToAzure}
              disabled={isLoading || extractedCodes.length === 0}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Upload to Azure
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (confirm("Are you sure you want to clear all extracted data?")) {
                fetch("/api/codes", { method: "DELETE" })
                  .then(res => res.json())
                  .then(() => {
                    // Refresh code data
                    queryClient.invalidateQueries({ queryKey: ["/api/codes"] });
                  })
                  .catch(err => {
                    console.error("Error clearing data:", err);
                  });
              }
            }}
            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-grow max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input 
            type="text"
            placeholder="Search codes or descriptions"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={payerFilter} onValueChange={setPayerFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Payers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_payers">All Payers</SelectItem>
            {uniquePayers.map((payer) => (
              <SelectItem key={payer} value={payer}>{payer}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={lobFilter} onValueChange={setLobFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Lines" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_lines">All Lines</SelectItem>
            {uniqueLOBs.map((lob) => (
              <SelectItem key={lob} value={lob}>{lob}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("payerName")}
              >
                Payer
                {sortField === "payerName" && (
                  sortDirection === "asc" ? 
                    <ArrowUp className="inline-block ml-1 h-4 w-4" /> : 
                    <ArrowDown className="inline-block ml-1 h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("planName")}
              >
                Plan
                {sortField === "planName" && (
                  sortDirection === "asc" ? 
                    <ArrowUp className="inline-block ml-1 h-4 w-4" /> : 
                    <ArrowDown className="inline-block ml-1 h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("lineOfBusiness")}
              >
                Line of Business
                {sortField === "lineOfBusiness" && (
                  sortDirection === "asc" ? 
                    <ArrowUp className="inline-block ml-1 h-4 w-4" /> : 
                    <ArrowDown className="inline-block ml-1 h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("year")}
              >
                Year
                {sortField === "year" && (
                  sortDirection === "asc" ? 
                    <ArrowUp className="inline-block ml-1 h-4 w-4" /> : 
                    <ArrowDown className="inline-block ml-1 h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("codeType")}
              >
                Code Type
                {sortField === "codeType" && (
                  sortDirection === "asc" ? 
                    <ArrowUp className="inline-block ml-1 h-4 w-4" /> : 
                    <ArrowDown className="inline-block ml-1 h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("code")}
              >
                Code
                {sortField === "code" && (
                  sortDirection === "asc" ? 
                    <ArrowUp className="inline-block ml-1 h-4 w-4" /> : 
                    <ArrowDown className="inline-block ml-1 h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("category")}
              >
                Category
                {sortField === "category" && (
                  sortDirection === "asc" ? 
                    <ArrowUp className="inline-block ml-1 h-4 w-4" /> : 
                    <ArrowDown className="inline-block ml-1 h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("subcategory")}
              >
                Subcategory
                {sortField === "subcategory" && (
                  sortDirection === "asc" ? 
                    <ArrowUp className="inline-block ml-1 h-4 w-4" /> : 
                    <ArrowDown className="inline-block ml-1 h-4 w-4" />
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("description")}
              >
                Description
                {sortField === "description" && (
                  sortDirection === "asc" ? 
                    <ArrowUp className="inline-block ml-1 h-4 w-4" /> : 
                    <ArrowDown className="inline-block ml-1 h-4 w-4" />
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No data available. Upload and process PDFs to extract codes.
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((code) => (
                <TableRow key={code.id} className="hover:bg-gray-50">
                  <TableCell>{code.payerName}</TableCell>
                  <TableCell className="truncate max-w-xs" title={code.planName || "N/A"}>
                    {code.planName || "-"}
                  </TableCell>
                  <TableCell>{code.lineOfBusiness}</TableCell>
                  <TableCell>{code.year}</TableCell>
                  <TableCell>{code.codeType}</TableCell>
                  <TableCell className="font-medium">{code.code}</TableCell>
                  <TableCell>{code.category || "-"}</TableCell>
                  <TableCell>{code.subcategory || "-"}</TableCell>
                  <TableCell className="truncate max-w-xs" title={code.description || "N/A"}>
                    {code.description || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredAndSortedCodes.length > 0 && (
        <div className="py-3">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {pageNumbers.map(number => (
                <PaginationItem key={number}>
                  <PaginationLink
                    onClick={() => paginate(number)}
                    isActive={currentPage === number}
                  >
                    {number}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          
          <div className="text-sm text-gray-700 text-center mt-2">
            Showing {filteredAndSortedCodes.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredAndSortedCodes.length)} of{" "}
            {filteredAndSortedCodes.length} results
          </div>
        </div>
      )}
    </div>
  );
}
