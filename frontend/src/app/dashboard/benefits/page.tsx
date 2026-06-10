"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Info,
  TrendingUp,
  FileText,
  X,
  CheckCircle,
  Download,
  Eye,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { usePdfGeneration } from "@/hooks/usePdfGeneration";
import DocumentReadinessModal from "@/components/pdf/DocumentReadinessModal";
import ApplyModal from "@/components/dashboard/ApplyModal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import {
  formatCurrency,
  formatDate,
  getConfidenceColor,
  getCurrentQuarterYear,
  resolveQuarterYearForPdf,
} from "@/lib/utils";

const PROGRAM_SCOPE_OPTIONS = [
  { value: "all", label: "All Programs" },
  { value: "federal", label: "Federal" },
  { value: "state", label: "State" },
];

const QUARTER_FILTER_OPTIONS = [
  { value: "Q1", label: "Q1 (Jan–Mar)" },
  { value: "Q2", label: "Q2 (Apr–Jun)" },
  { value: "Q3", label: "Q3 (Jul–Sep)" },
  { value: "Q4", label: "Q4 (Oct–Dec)" },
];

const selectClassName =
  "w-full appearance-none rounded-lg border border-outline-variant/60 bg-white py-2.5 pl-3 pr-9 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-300 cursor-pointer";

function getRelevantDueDateInQuarter(dates: string[] | undefined): string | null {
  if (!dates?.length) return null;

  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const sorted = [...dates].sort();

  for (const dateStr of sorted) {
    const parsed = new Date(`${dateStr}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime()) && parsed.getTime() >= todayUtc) {
      return dateStr;
    }
  }

  return sorted[sorted.length - 1] ?? null;
}

function getProgramQuarterDueDisplay(
  program: {
    current_quarter?: string;
    current_quarter_due_date?: string | null;
    quarter_due_dates?: Record<string, string[]>;
  } | null | undefined,
  quarterFilter: string
): { quarter: string | null; dueDate: string | null } {
  const dates = program?.quarter_due_dates?.[quarterFilter];
  return {
    quarter: quarterFilter,
    dueDate: getRelevantDueDateInQuarter(dates),
  };
}

export default function BenefitsPage() {
  const [programScope, setProgramScope] = useState<"all" | "federal" | "state">("all");
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [quarterFilter, setQuarterFilter] = useState(() => getCurrentQuarterYear().quarter);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
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
  } = usePdfGeneration();

  const filterParams = useMemo(
    () => ({
      ...(programScope === "federal" ? { federal: "true" } : {}),
      ...(programScope === "state" ? { state_only: "true" } : {}),
      ...(selectedStateCode ? { state: selectedStateCode } : {}),
      quarter: quarterFilter,
    }),
    [programScope, selectedStateCode, quarterFilter]
  );

  const pdfQuarterContext = useMemo(
    () => resolveQuarterYearForPdf(quarterFilter),
    [quarterFilter]
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["eligibility-results", filterParams],
    queryFn: () =>
      api.get("/api/eligibility/results", { params: filterParams }).then((r) => r.data.data),
    placeholderData: (previousData) => previousData,
  });

  const results = data?.results ?? [];
  const summary = data?.summary;
  const availableStateOptions = data?.availableStates ?? [];
  const profileState = data?.profileState ?? null;
  const hasActiveStateFilter = !!selectedStateCode;

  const scanMutation = useMutation({
    mutationFn: () => api.post("/api/eligibility/scan"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eligibility-results"] });
    },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-on-surface mb-1">
            My Benefits & Eligibility
          </h1>
          <p className="text-sm text-on-surface-variant">
            AI-powered matching across 200+ government programs
          </p>
        </div>
        <Button
          onClick={() => scanMutation.mutate()}
          loading={scanMutation.isPending}
          size="md"
        >
          <RefreshCw className="w-4 h-4" />
          {scanMutation.isPending ? "Scanning..." : "Re-run AI Scan"}
        </Button>
      </div>

      {/* Total value banner */}
      {summary && summary.totalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="bg-gradient-primary border-0" glass={false}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white/70 text-sm">Estimated Total Monthly Benefits</div>
                <div className="font-display font-bold text-3xl text-white">
                  {formatCurrency(summary.totalMonthlyValueMax)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/70 text-xs">Qualified programs</div>
                <div className="font-bold text-2xl text-white">
                  {summary.qualifiedCount}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {profileState && !hasActiveStateFilter && programScope === "all" && (
        <p className="mb-4 text-sm text-on-surface-variant">
          Showing federal and {profileState} state programs based on your profile.
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6 relative">
        {isFetching && !isLoading && (
          <div className="absolute -top-6 right-0 text-xs text-on-surface-variant flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Updating results...
          </div>
        )}
        <div className="flex-1 min-w-[10rem]">
          <label htmlFor="program-scope-filter" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            Program Type
          </label>
          <div className="relative">
            <select
              id="program-scope-filter"
              value={programScope}
              onChange={(e) => setProgramScope(e.target.value as "all" | "federal" | "state")}
              className={selectClassName}
            >
              {PROGRAM_SCOPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          </div>
        </div>

        <div className="flex-1 min-w-[10rem]">
          <label htmlFor="state-filter" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            State
          </label>
          <div className="relative">
            <select
              id="state-filter"
              value={selectedStateCode}
              onChange={(e) => setSelectedStateCode(e.target.value)}
              className={selectClassName}
            >
              <option value="">All States</option>
              {availableStateOptions.map((option: { code: string; label: string }) => (
                <option key={option.code} value={option.code}>
                  {option.label} ({option.code})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          </div>
        </div>

        <div className="flex-1 min-w-[10rem]">
          <label htmlFor="quarter-filter" className="block text-xs font-semibold text-on-surface-variant mb-1.5">
            Quarter
          </label>
          <div className="relative">
            <select
              id="quarter-filter"
              value={quarterFilter}
              onChange={(e) => setQuarterFilter(e.target.value)}
              className={selectClassName}
            >
              {QUARTER_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl text-on-surface mb-2">
            {!summary?.totalCount ? "No scan results yet" : "No programs match your filter"}
          </h3>
          <p className="text-on-surface-variant mb-6 max-w-sm mx-auto">
            {!summary?.totalCount
              ? "We need a bit more information about your family to find the best matches. Complete your profile to see eligible benefits."
              : "Try adjusting your filter criteria"}
          </p>
          {!summary?.totalCount && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={() => router.push("/eligibility")} variant="primary">
                <ArrowRight className="w-4 h-4" />
                Complete Family Profile
              </Button>
              <Button onClick={() => scanMutation.mutate()} variant="outline" loading={scanMutation.isPending}>
                <RefreshCw className="w-4 h-4" />
                Run AI Scan
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {results.map((result: any, i: number) => {
            const quarterDueDisplay = getProgramQuarterDueDisplay(result.program, quarterFilter);

            return (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card hover className="h-full">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap mb-1">
                      <h3 className="font-display font-semibold text-on-surface">
                        {result.program?.name}
                      </h3>
                      <StatusBadge status={result.status} />
                    </div>
                    <p className="text-xs text-on-surface-variant">{result.program?.agency}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-emerald-600 text-lg">
                      {formatCurrency(result.program?.estimated_monthly_value_max || 0)}
                    </div>
                    <div className="text-xs text-on-surface-variant">/ month max</div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-on-surface-variant">AI Confidence</span>
                    <span className={`text-xs font-semibold ${getConfidenceColor(result.confidence_score)}`}>
                      {result.confidence_score}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary rounded-full transition-all duration-700"
                      style={{ width: `${result.confidence_score}%` }}
                    />
                  </div>
                </div>

                {/* Reasoning + quarter due date */}
                {(result.reasoning || !!quarterDueDisplay.dueDate) && (
                  <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-surface-container-low">
                    <Info className="w-3.5 h-3.5 text-on-surface-variant shrink-0 mt-0.5" />
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {result.reasoning}
                      {result.reasoning && !!quarterDueDisplay.dueDate && (
                        <span className="mx-1.5 text-on-surface-variant/50">·</span>
                      )}
                      {!!quarterDueDisplay.dueDate && (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap align-middle">
                          <Calendar className="w-3 h-3 shrink-0" />
                          {quarterDueDisplay.quarter} due{" "}
                          {formatDate(quarterDueDisplay.dueDate)}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs text-on-surface-variant capitalize">
                      {result.program?.program_type?.replace(/_/g, " ")}
                    </span>
                  </div>
                  {["qualified", "likely_qualified"].includes(result.status) && (
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleGeneratePdf(
                            result.program.id,
                            undefined,
                            result.program.name,
                            pdfQuarterContext.quarter,
                            pdfQuarterContext.year
                          )
                        }
                        disabled={generatingPdfId === result.program.id}
                        loading={generatingPdfId === result.program.id}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        Generate PDF
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedProgram(result.program);
                          setApplyModalOpen(true);
                        }}
                      >
                        Apply Now
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
            );
          })}
        </div>
      )}

      {/* Validation Warning Modal */}
      <DocumentReadinessModal
        isOpen={showWarningModal}
        validationReport={validationReport}
        pendingParams={pendingParams}
        generatingPdfId={generatingPdfId}
        onClose={closeWarningModal}
        onGenerateAnyway={confirmAndGeneratePdf}
      />

      {/* PDF Success/Download Modal */}
      {pdfModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface rounded-2xl shadow-xl w-full max-w-md flex flex-col"
          >
            <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between bg-surface-container-lowest rounded-t-2xl">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h3 className="font-display font-semibold text-lg text-on-surface">
                  Generated Successfully at {new Date().toLocaleTimeString()}
                </h3>
              </div>
              <button
                onClick={closePdfModal}
                className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-sm">{pdfModal.programName}</h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  Your government assistance application package has been generated and is ready for download.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-surface-container bg-surface-container-lowest flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-b-2xl">
              <Button 
                variant="outline" 
                onClick={closePdfModal}
                className="w-full sm:w-auto whitespace-nowrap"
              >
                Close
              </Button>
              {pdfModal.pdfId && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => viewPdf(pdfModal.pdfId!)}
                    disabled={!!isViewing || !!isDownloading}
                    loading={isViewing === pdfModal.pdfId}
                    className="w-full sm:w-auto whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    View PDF
                  </Button>
                  <Button
                    onClick={() =>
                      downloadPdf(pdfModal.pdfId!, { programName: pdfModal.programName })
                    }
                    disabled={!!isViewing || !!isDownloading}
                    loading={isDownloading === pdfModal.pdfId}
                    className="w-full sm:w-auto whitespace-nowrap px-2.5"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Download PDF
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      {/* Apply Email Composition & Attachments Modal */}
      <ApplyModal
        isOpen={applyModalOpen}
        onClose={() => {
          setApplyModalOpen(false);
          setSelectedProgram(null);
        }}
        program={selectedProgram}
        pdfQuarter={resolveQuarterYearForPdf(quarterFilter).quarter}
        pdfYear={resolveQuarterYearForPdf(quarterFilter).year}
      />
    </div>
  );
}
