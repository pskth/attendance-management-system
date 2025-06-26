'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, Printer } from "lucide-react";

interface ExportReportsProps {
  filters: {
    academicYear: string;
  };
}

export default function ExportReports({ filters }: ExportReportsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setIsExporting(true);
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real application, this would trigger the actual export
    const fileName = `analytics_report_${filters.academicYear}_${Date.now()}.${format}`;
    
    // Create a mock download
    const element = document.createElement('a');
    element.href = '#';
    element.download = fileName;
    element.click();
    
    setIsExporting(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        <Button
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="flex items-center justify-center space-x-1 text-xs sm:text-sm"
        >
          <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>PDF</span>
        </Button>
        
        <Button
          onClick={() => handleExport('excel')}
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="flex items-center justify-center space-x-1 text-xs sm:text-sm"
        >
          <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Excel</span>
        </Button>
        
        <Button
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="flex items-center justify-center space-x-1 text-xs sm:text-sm"
        >
          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>CSV</span>
        </Button>
        
        <Button
          onClick={handlePrint}
          variant="outline"
          size="sm"
          className="flex items-center justify-center space-x-1 text-xs sm:text-sm"
        >
          <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Print</span>
        </Button>
      </div>
      
      {isExporting && (
        <div className="text-xs text-gray-500 mt-1">
          Generating report...
        </div>
      )}
    </div>
  );
}
