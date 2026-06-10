import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatPdfFilename, getDownloadFilenameFromResponse } from "@/lib/utils";

export interface ValidationReport {
  is_valid: boolean;
  missing_required_fields: string[];
  missing_required_documents: string[];
  missing_optional_fields: string[];
  missing_optional_documents: string[];
  uploaded_document_types: string[];
  can_generate: boolean;
}

export interface PdfModalState {
  open: boolean;
  pdfId?: string;
  downloadUrl?: string;
  programName?: string;
}

export interface PendingGenerateParams {
  programId: string;
  applicationId?: string;
  programName?: string;
  quarter?: string;
  year?: number;
}

export interface PdfDownloadMeta {
  programName?: string;
  quarter?: string | null;
  year?: number | null;
  version?: number;
}

export function usePdfGeneration() {
  const queryClient = useQueryClient();
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [pdfModal, setPdfModal] = useState<PdfModalState>({ open: false });
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingParams, setPendingParams] = useState<PendingGenerateParams | null>(null);

  const [isViewing, setIsViewing] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleGeneratePdf = async (
    programId: string,
    applicationId?: string,
    programName?: string,
    quarter?: string,
    year?: number
  ) => {
    const loadId = applicationId || programId;
    setGeneratingPdfId(loadId);

    try {
      const valRes = await api.post("/api/pdf/validate", { program_id: programId });
      const report: ValidationReport = valRes.data.data;

      const hasMissingRequired = 
        report.missing_required_fields.length > 0 || 
        report.missing_required_documents.length > 0;
      
      const hasMissingOptional = 
        report.missing_optional_fields.length > 0 || 
        report.missing_optional_documents.length > 0;

      if (hasMissingRequired || hasMissingOptional) {
        setValidationReport(report);
        setPendingParams({ programId, applicationId, programName, quarter, year });
        setShowWarningModal(true);
        setGeneratingPdfId(null);
      } else {
        await confirmAndGeneratePdf(programId, applicationId, programName, quarter, year);
      }
    } catch (err) {
      console.error("Failed to validate program requirements:", err);
      setGeneratingPdfId(null);
    }
  };

  const confirmAndGeneratePdf = async (
    programId: string,
    applicationId?: string,
    programName?: string,
    quarter?: string,
    year?: number
  ) => {
    const loadId = applicationId || programId;
    setGeneratingPdfId(loadId);
    setShowWarningModal(false);

    try {
      const res = await api.post("/api/pdf/generate", {
        program_id: programId,
        application_id: applicationId,
        quarter,
        year,
      });
      const pdfId = res.data.data.id;
      const urlRes = await api.get(`/api/pdf/${pdfId}/download`);
      
      setPdfModal({
        open: true,
        pdfId,
        downloadUrl: urlRes.data.data.url,
        programName,
      });

      // Auto-trigger download right after successful generation (counts as v1)
      downloadPdf(pdfId, {
        programName,
        quarter: res.data.data.quarter,
        year: res.data.data.year,
        version: res.data.data.version,
      });

      // Invalidate applications query to update the UI across components
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["generated-pdfs"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (err) {
      console.error("Failed to generate PDF application packet:", err);
    } finally {
      setGeneratingPdfId(null);
      setPendingParams(null);
    }
  };

  const viewPdf = async (pdfId: string) => {
    setIsViewing(pdfId);
    try {
      const response = await api.get(`/api/pdf/${pdfId}/download/stream`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("Failed to view PDF:", err);
    } finally {
      setIsViewing(null);
    }
  };

  const downloadPdf = async (pdfId: string, meta?: PdfDownloadMeta) => {
    setIsDownloading(pdfId);
    try {
      const fallbackName = formatPdfFilename(
        meta?.programName || "Application",
        meta?.quarter,
        meta?.year,
        (meta?.version ?? 0) + 1
      );
      const response = await api.get(`/api/pdf/${pdfId}/download/stream`, {
        responseType: "blob",
        params: { record_download: "true" },
      });
      const filename = getDownloadFilenameFromResponse(response, fallbackName);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 60000);

      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["generated-pdfs"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (err) {
      console.error("Failed to download PDF:", err);
    } finally {
      setIsDownloading(null);
    }
  };

  const closeWarningModal = () => {
    setShowWarningModal(false);
    setValidationReport(null);
    setPendingParams(null);
  };

  const closePdfModal = () => {
    setPdfModal({ open: false });
  };

  return {
    generatingPdfId,
    pdfModal,
    validationReport,
    showWarningModal,
    pendingParams,
    isViewing,
    isDownloading,
    handleGeneratePdf,
    confirmAndGeneratePdf,
    viewPdf,
    downloadPdf,
    closeWarningModal,
    closePdfModal,
  };
}
