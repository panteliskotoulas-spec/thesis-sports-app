export interface FormTextAreaProps extends React.ComponentProps<'textarea'> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  grow?: boolean;
}

export function FormTextArea({
  id,
  label,
  hint,
  error,
  grow,
  ...textareaProps
}: FormTextAreaProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${grow ? 'flex-1' : ''}`}>
      <label htmlFor={id}>{label}</label>

      <textarea
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-28 w-full resize-y rounded-md border-[0.5px] border-input bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 ${
          grow ? 'flex-1' : ''
        }`}
        {...textareaProps}
      />

      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
