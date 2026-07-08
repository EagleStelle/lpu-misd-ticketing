import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Paperclip, X, Search, Check } from "lucide-react";

// PrimaryButton: Main action button, typically for form submission
export const PrimaryButton = ({
  label,
  loadingLabel = "Submitting...",
  isLoading,
  icon: Icon,
  className = "",
  ...props
}) => (
  <button
    type="submit"
    disabled={isLoading}
    className={`inline-flex justify-center items-center gap-2 bg-lpu-maroon text-white border border-lpu-maroon px-4 py-2 text-sm rounded-lg cursor-pointer font-bold transition-all duration-200 hover:bg-lpu-gold hover:text-lpu-maroon hover:border-lpu-gold shadow-lg shadow-lpu-maroon/20 disabled:opacity-50 lg:px-8 lg:py-3 lg:text-[0.95rem] lg:rounded-xl ${className}`}
    {...props}
  >
    {!isLoading && Icon && <Icon size={18} className="stroke-[2.2px]" />}
    {isLoading ? loadingLabel : label}
  </button>
);

// SecondaryButton: Outlined button for secondary actions, supports optional icon
export const SecondaryButton = ({
  label,
  onClick,
  icon: Icon,
  disabled,
  className = "",
  ...props
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex justify-center items-center gap-2 bg-white dark:bg-zinc-900 text-lpu-maroon dark:text-lpu-gold border border-lpu-maroon dark:border-lpu-gold px-4 py-2 text-sm rounded-lg cursor-pointer font-bold transition-all duration-200 hover:bg-lpu-gold hover:text-lpu-maroon hover:border-lpu-gold dark:hover:bg-lpu-gold dark:hover:text-lpu-maroon dark:hover:border-lpu-gold disabled:opacity-50 lg:px-8 lg:py-3 lg:text-[0.95rem] lg:rounded-xl ${className}`}
    {...props}
  >
    {Icon && <Icon size={18} className="stroke-[2.2px]" />}
    {label}
  </button>
);

// FilePicker: Hidden file input with button trigger, uses SecondaryButton
export const FilePicker = forwardRef(({ onFileSelect, isLoading }, ref) => {
  return (
    <>
      <input
        ref={ref}
        type="file"
        multiple
        onChange={onFileSelect}
        className="hidden"
      />
      <SecondaryButton
        label="Attach Files"
        icon={Paperclip}
        onClick={() => ref.current?.click()}
        disabled={isLoading}
      />
    </>
  );
});
FilePicker.displayName = "FilePicker";

// AttachmentPreview: Shows a preview list of attached files with remove option
export const AttachmentPreview = ({ attachments, onRemove }) => {
  if (attachments.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 w-full md:col-span-2 mt-2">
      <p className="text-[0.75rem] font-bold text-gray-500 px-1">
        Attached Files ({attachments.length})
      </p>
      <div className="flex flex-wrap gap-3">
        {attachments.map((file, index) => {
          const isImage = file.type.startsWith("image/");
          return (
            <div
              key={index}
              className="relative w-24 h-24 border-2 border-lpu-maroon/30 rounded-xl overflow-hidden bg-white shadow-sm"
            >
              {isImage ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                  onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-400">
                  <Paperclip size={24} className="mb-1" />
                  <span className="text-[10px] font-bold uppercase">
                    {file.name.split(".").pop()}
                  </span>
                </div>
              )}
              {/* Always Visible X */}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 p-1 bg-lpu-maroon text-white rounded-full shadow-md hover:bg-lpu-red z-10 transition-colors"
              >
                <X size={14} strokeWidth={3} />
              </button>
              {/* Always Visible Filename */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-1 truncate font-medium">
                {file.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
// FloatingInput: Text input with animated floating label
export const FloatingInput = ({
  label,
  type = "text",
  className = "",
  ...props
}) => {
  const inputClass =
    `w-full box-border rounded-xl border border-gray-200 dark:border-zinc-700 text-[0.95rem] bg-white dark:bg-zinc-900 dark:text-zinc-100 outline-none transition-all duration-200 focus:ring-2 focus:ring-lpu-gold focus:border-lpu-gold px-[14px] py-[12px] peer ${className}`.trim();

  const labelClass =
    "absolute left-[14px] top-[12px] text-[0.9rem] text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-1 transition-all duration-200 pointer-events-none peer-focus:-top-2 peer-focus:text-[0.75rem] peer-focus:font-bold peer-focus:!text-lpu-gold peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-[0.75rem] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:text-gray-500 dark:peer-[:not(:placeholder-shown)]:text-zinc-400";

  return (
    <div className="relative flex flex-col w-full group">
      <input type={type} placeholder=" " className={inputClass} {...props} />
      <label className={labelClass}>{label}</label>
    </div>
  );
};
// FloatingSelect: Select dropdown with animated floating label
export const FloatingSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  required = true,
}) => {
  const normalizedOptions = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt,
  );
  const selectClass =
    "w-full appearance-none box-border rounded-xl border border-gray-200 dark:border-zinc-700 text-[0.95rem] bg-white dark:bg-zinc-900 dark:text-zinc-100 outline-none transition-all duration-200 focus:ring-2 focus:ring-lpu-gold focus:border-lpu-gold py-[12px] pl-[14px] pr-[36px] cursor-pointer peer";

  const labelClass =
    "absolute left-[14px] top-[12px] text-[0.9rem] text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-1 transition-all duration-200 pointer-events-none peer-focus:-top-2 peer-focus:text-[0.75rem] peer-focus:font-bold peer-focus:!text-lpu-gold peer-valid:-top-2 peer-valid:text-[0.75rem] peer-valid:font-bold peer-valid:text-gray-500 dark:peer-valid:text-zinc-400";

  return (
    <div className="relative flex flex-col w-full group">
      <select
        name={name}
        className={selectClass}
        value={value}
        onChange={onChange}
        required={required}
      >
        <option value="" disabled hidden></option>
        {normalizedOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <label className={labelClass}>{label}</label>
      <ChevronDown
        size={18}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-all duration-200 group-focus-within:rotate-180 peer-focus:text-lpu-gold"
      />
    </div>
  );
};

// FloatingCombobox: searchable single-select with floating label.
// Same onChange contract as FloatingSelect — emits { target: { name, value } }.
export const FloatingCombobox = ({
  label,
  name,
  value,
  onChange,
  options,
  required = true,
}) => {
  const normalizedOptions = useMemo(
    () =>
      (options || []).map((opt) =>
        typeof opt === "string" ? { value: opt, label: opt } : opt,
      ),
    [options],
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const selected = normalizedOptions.find((o) => o.value === value) || null;
  const floated = open || value !== "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((o) =>
      o.label.toLowerCase().includes(q),
    );
  }, [normalizedOptions, query]);

  // Position the portalled panel relative to the trigger, in viewport coords.
  const computeCoords = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const gap = 8;
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < 260 && spaceAbove > spaceBelow;
    return {
      left: r.left,
      width: r.width,
      top: openUp ? r.top - gap : r.bottom + gap,
      openUp,
      maxHeight: Math.max(160, (openUp ? spaceAbove : spaceBelow) - gap - 8),
    };
  }, []);

  // Close on outside click (portal panel lives outside the trigger's DOM tree)
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !panelRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return undefined;
    const update = () => setCoords(computeCoords());
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, computeCoords]);

  // On open: focus the search box (state resets happen in openMenu)
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  // Keep highlight in view
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = listRef.current?.children[activeIndex];
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const openMenu = () => {
    setQuery("");
    setActiveIndex(normalizedOptions.findIndex((o) => o.value === value));
    setCoords(computeCoords());
    setOpen(true);
  };

  const commit = (opt) => {
    onChange?.({ target: { name, value: opt.value } });
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return openMenu();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[activeIndex]) commit(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const boxClass = `w-full box-border rounded-xl border text-[0.95rem] bg-white dark:bg-zinc-900 dark:text-zinc-100 outline-none transition-all duration-200 py-[12px] pl-[14px] pr-[36px] text-left cursor-pointer ${
    open
      ? "border-lpu-gold ring-2 ring-lpu-gold"
      : "border-gray-200 dark:border-zinc-700"
  }`;

  const labelClass = `absolute left-[14px] bg-white dark:bg-zinc-900 px-1 pointer-events-none transition-all duration-200 ${
    floated
      ? "-top-2 text-[0.75rem] font-bold text-gray-500 dark:text-zinc-400"
      : "top-[12px] text-[0.9rem] text-gray-500 dark:text-zinc-400"
  } ${open ? "!text-lpu-gold" : ""}`;

  const panel = open && coords && (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        left: coords.left,
        width: coords.width,
        top: coords.top,
        transform: coords.openUp ? "translateY(-100%)" : undefined,
        zIndex: 1300,
      }}
      className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95"
    >
      <div className="flex items-center gap-2 px-3 h-10 border-b border-gray-100 dark:border-zinc-800 shrink-0">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search..."
          className="flex-1 min-w-0 h-full bg-transparent text-sm outline-none text-gray-800 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
        />
      </div>
      <ul
        ref={listRef}
        role="listbox"
        style={{ maxHeight: coords.maxHeight - 40 }}
        className="overflow-y-auto py-1"
      >
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-sm text-gray-400 dark:text-zinc-500 text-center">
            No matches
          </li>
        ) : (
          filtered.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === activeIndex;
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => commit(opt)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left cursor-pointer transition-colors ${
                    isActive
                      ? "bg-lpu-maroon text-white"
                      : "text-gray-800 dark:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check
                      size={15}
                      className={`shrink-0 ${isActive ? "text-white" : "text-lpu-maroon dark:text-lpu-gold"}`}
                    />
                  )}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );

  return (
    <div className="relative flex flex-col w-full">
      <button
        ref={triggerRef}
        type="button"
        name={name}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={boxClass}
      >
        {selected ? (
          selected.label
        ) : (
          <span className="text-transparent select-none">.</span>
        )}
      </button>
      <label className={labelClass}>{label}</label>
      <ChevronDown
        size={18}
        className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-all duration-200 ${
          open ? "rotate-180 text-lpu-gold" : ""
        }`}
      />
      {panel && createPortal(panel, document.body)}
    </div>
  );
};

// FloatingTextarea: Textarea input with animated floating label
export const FloatingTextarea = ({
  label,
  name,
  value,
  onChange,
  heightClass = "h-[clamp(300px,55vh,800px)]",
  required = true,
  autoResize = false,
  ...props
}) => {
  const textareaClass =
    `w-full box-border rounded-xl border border-gray-200 dark:border-zinc-700 text-[0.95rem] bg-white dark:bg-zinc-900 dark:text-zinc-100 outline-none transition-all duration-200 focus:ring-2 focus:ring-lpu-gold focus:border-lpu-gold px-[14px] py-[12px] peer resize-none ${heightClass} ${autoResize ? "[field-sizing:content]" : ""}`.trim();

  const labelClass =
    "absolute left-[14px] top-[12px] text-[0.9rem] text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-1 transition-all duration-200 pointer-events-none peer-focus:-top-2 peer-focus:text-[0.75rem] peer-focus:font-bold peer-focus:!text-lpu-gold peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-[0.75rem] peer-[:not(:placeholder-shown)]:font-bold peer-[:not(:placeholder-shown)]:text-gray-500 dark:peer-[:not(:placeholder-shown)]:text-zinc-400";

  return (
    <div className="relative flex flex-col w-full group md:col-span-2">
      <textarea
        {...props}
        name={name}
        placeholder=" "
        className={textareaClass}
        value={value}
        onChange={onChange}
        required={required}
      />
      <label className={labelClass}>{label}</label>
    </div>
  );
};

export const Alert = ({ type, message }) => {
  if (!message) return null;

  const isError = type === "error";

  const classes = isError
    ? "text-lpu-maroon bg-red-50 border-l-lpu-maroon border-red-100"
    : "text-emerald-700 bg-emerald-50 border-l-emerald-500 border-emerald-100";

  return (
    <div
      className={`p-4 mb-6 text-[0.9rem] font-medium rounded-xl border-l-4 border-y border-r shadow-sm transition-all duration-300 ${classes}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-1.5 h-1.5 rounded-full ${isError ? "bg-lpu-maroon" : "bg-emerald-500"}`}
        />
        {message}
      </div>
    </div>
  );
};
