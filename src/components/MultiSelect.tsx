'use client';

interface Option {
  id: string;
  label: string;
}

interface MultiSelectProps {
  options: readonly Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  label: string;
  error?: string;
}

export default function MultiSelect({
  options,
  selected,
  onChange,
  label,
  error
}: MultiSelectProps) {
  const toggleOption = (optionId: string) => {
    const newSelected = selected.includes(optionId)
      ? selected.filter(id => id !== optionId)
      : [...selected, optionId];
    onChange(newSelected);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-1">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => toggleOption(option.id)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
              ${
                selected.includes(option.id)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}