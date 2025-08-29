'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, Printer, Loader2 } from "lucide-react";

interface ExportReportsProps {
  filters: {
    academicYear: string;
  };
}

export default function ExportReports({ filters }: ExportReportsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);

  const downloadFile = (data: any, filename: string, mimeType: string) => {
    let blob: Blob;

    if (mimeType === 'text/csv') {
      blob = new Blob([data], { type: mimeType });
    } else {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: mimeType });
    }

    const url = window.URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    window.URL.revokeObjectURL(url);
  };

  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    setIsExporting(true);
    setExportingType(format);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch(`/api/export/${format}?academicYear=${encodeURIComponent(filters.academicYear)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Export failed with status ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      const contentDisposition = response.headers.get('content-disposition');

      let filename = `analytics_report_${filters.academicYear}_${Date.now()}`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          filename = fileNameMatch[1];
        }
      } else {
        filename += `.${format === 'excel' ? 'json' : format}`;
      }

      if (format === 'csv') {
        const csvData = await response.text();
        downloadFile(csvData, filename, 'text/csv');
      } else {
        const jsonData = await response.json();
        downloadFile(jsonData, filename, 'application/json');
      }

      console.log(`${format.toUpperCase()} export completed successfully`);

    } catch (error) {
      console.error(`${format.toUpperCase()} export error:`, error);
      alert(`Failed to export ${format.toUpperCase()} report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
      setExportingType(null);
    }
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
          {isExporting && exportingType === 'pdf' ? (
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
          ) : (
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
          <span>PDF</span>
        </Button>

        <Button
          onClick={() => handleExport('excel')}
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="flex items-center justify-center space-x-1 text-xs sm:text-sm"
        >
          {isExporting && exportingType === 'excel' ? (
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
          <span>Excel</span>
        </Button>

        <Button
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          variant="outline"
          size="sm"
          className="flex items-center justify-center space-x-1 text-xs sm:text-sm"
        >
          {isExporting && exportingType === 'csv' ? (
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
          ) : (
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
          <span>CSV</span>
        </Button>

        <Button
          onClick={handlePrint}
          disabled={isExporting}
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
          Generating {exportingType?.toUpperCase()} report...
        </div>
      )}
    </div>
  );
}
