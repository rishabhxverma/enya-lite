interface Props {
  toolName: string;
  output: unknown;
}

export function ToolResultJson({ toolName, output }: Props) {
  return (
    <div className="rounded-2xl border-2 bg-muted/30 p-4 shadow-sm">
      <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">
        {toolName}
      </div>
      <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono text-foreground/80 max-h-72">
        {JSON.stringify(output, null, 2)}
      </pre>
    </div>
  );
}
