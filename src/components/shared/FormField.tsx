export interface FormFieldProps extends React.ComponentProps<'input'> {
  id: string;
  label: string;
  labelAction?: React.ReactNode;
  hint?: string;
  error?: string;
}

export function FormField({
  id,
  label,
  labelAction,
  hint,
  error,
  ...inputProps
}: FormFieldProps) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id}>{label}</label>
        {labelAction}
      </div>

      <input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="h-11 w-full rounded-md border-[0.5px] border-input bg-background px-4 text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30"
        {...inputProps}
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
