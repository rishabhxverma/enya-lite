import { CheckCircle2, FileText, AlertCircle } from "lucide-react";

interface Props {
  status: "parsing" | "ready" | "failed";
  filename?: string;
  pageCount?: number;
  chunkCount?: number;
  error?: string;
}

export function UploadStatusCard({
  status,
  filename,
  pageCount,
  chunkCount,
  error,
}: Props) {
  return (
    <div className="rounded-2xl border-2 bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        {status === "ready" ? (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-700" />
          </div>
        ) : status === "failed" ? (
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-700" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-yellow-700" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold">
            {status === "ready"
              ? "Textbook parsed and indexed"
              : status === "failed"
                ? "Parse failed"
                : "Parsing your textbook…"}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {filename ?? "uploaded file"}
            {status === "ready" && pageCount && chunkCount
              ? ` • ${pageCount} pages • ${chunkCount} chunks`
              : ""}
          </div>
          {error && (
            <div className="text-sm text-red-700 mt-2">{error}</div>
          )}
          {status === "parsing" && (
            <div className="mt-3 h-2 rounded-full bg-yellow-100 overflow-hidden">
              <div className="h-full w-1/2 bg-yellow-500 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
