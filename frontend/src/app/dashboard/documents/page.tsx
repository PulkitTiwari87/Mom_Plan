"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle, XCircle, Loader2, Trash2, Eye, Clock, Edit2, Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { usePdfGeneration } from "@/hooks/usePdfGeneration";

export default function DocumentsPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [activeTab, setActiveTab] = useState<"uploaded" | "generated">("uploaded");
  const { viewPdf, downloadPdf, isViewing, isDownloading } = usePdfGeneration();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.get("/api/documents").then((r) => r.data.data),
  });

  const { data: generatedPdfs, isLoading: loadingPdfs } = useQuery({
    queryKey: ["generated-pdfs"],
    queryFn: () => api.get("/api/pdf").then((r) => r.data.data),
  });

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", "other");
    try {
      await api.post("/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || file.size)
          );
          setUploadProgress(percentCompleted);
        },
      });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (err: any) {
      setUploadError(err.response?.data?.error?.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleViewDocument = async (id: string, mimeType: string) => {
    try {
      const response = await api.get(`/api/documents/${id}/download`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("Failed to view document", err);
    }
  };

  const handleRename = async (id: string) => {
    if (!newName.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      await api.patch(`/api/documents/${id}/rename`, { name: newName });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (err) {
      console.error("Failed to rename document", err);
    } finally {
      setRenamingId(null);
      setNewName("");
    }
  };

  const docTypeIcons: Record<string, string> = {
    identity: "🪪",
    income: "💰",
    residence: "🏠",
    medical: "🏥",
    other: "📄",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-on-surface mb-1">
          Documents
        </h1>
        <p className="text-sm text-on-surface-variant">
          Securely upload and manage supporting documents for your applications
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("uploaded")}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
            activeTab === "uploaded"
              ? "bg-primary-100 border-primary-200 text-primary-700 font-semibold"
              : "bg-white border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          Uploaded Documents
        </button>
        <button
          onClick={() => setActiveTab("generated")}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
            activeTab === "generated"
              ? "bg-primary-100 border-primary-200 text-primary-700 font-semibold"
              : "bg-white border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          Generated Application Packages
        </button>
      </div>

      {activeTab === "uploaded" && (
        <>
          {/* Upload Zone */}
          <div
            className="border-2 border-dashed border-primary-200 bg-primary-50/30 rounded-2xl p-10 text-center mb-8 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all duration-200"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleUpload(file);
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
                <div className="flex items-center gap-2 mb-1 text-primary-600 font-medium">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading {uploadProgress}%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary">
                  <Upload className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-medium text-on-surface mb-1">Drop files here or click to upload</p>
                  <p className="text-xs text-on-surface-variant">
                    PDF, JPG, PNG up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {uploadError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          {uploadError}
        </div>
      )}

      {/* Documents List */}
      {activeTab === "uploaded" && (
        isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-surface-container rounded-xl" />
            ))}
          </div>
        ) : !documents || documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
            <p className="text-on-surface-variant">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc: any, i: number) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card padding="sm" hover>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl shrink-0">
                      {docTypeIcons[doc.document_type] || "📄"}
                    </div>
                    <div className="flex-1 min-w-0">
                      {renamingId === doc.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 h-8 px-2 text-sm border border-surface-container-highest rounded bg-surface focus:outline-none focus:border-primary-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(doc.id);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                          />
                          <button
                            onClick={() => handleRename(doc.id)}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setRenamingId(null)}
                            className="text-xs font-medium text-on-surface-variant hover:text-on-surface"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="font-medium text-sm text-on-surface truncate flex items-center gap-2 group">
                          {doc.display_name}
                          <button
                            onClick={() => {
                              setRenamingId(doc.id);
                              setNewName(doc.display_name);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary-500 transition-all"
                            title="Rename Document"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                        <span className="capitalize">{doc.document_type}</span>
                        <span>•</span>
                        <span>{formatDate(doc.uploaded_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleViewDocument(doc.id, doc.mime_type)}
                        title="View Document"
                        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary-500 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )
      )}

      {activeTab === "generated" && (
        loadingPdfs ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-surface-container rounded-xl" />
            ))}
          </div>
        ) : !generatedPdfs || generatedPdfs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-on-surface-variant/30 mx-auto mb-3" />
            <p className="text-on-surface-variant">No generated packages found. Apply to programs to generate PDFs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {generatedPdfs.map((pdf: any, i: number) => (
              <motion.div
                key={pdf.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card padding="sm" hover>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-on-surface truncate">
                        {pdf.program?.name || "Application Package"}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5">
                        <span>v{pdf.version}</span>
                        <span>•</span>
                        <span>{pdf.program?.agency || "Government Assistance"}</span>
                        <span>•</span>
                        <span>{formatDate(pdf.generated_at)}</span>
                        <span>•</span>
                        <span>{formatBytes(pdf.file_size)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => viewPdf(pdf.id)}
                        disabled={isViewing || isDownloading}
                        title="View PDF"
                        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary-500 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadPdf(pdf.id, pdf.program?.name)}
                        disabled={isViewing || isDownloading}
                        title="Download PDF"
                        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary-500 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
