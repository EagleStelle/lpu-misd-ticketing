import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Tag,
  Trash2,
  Pencil,
  Check,
  X,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";
import { getApiBaseUrl } from "../../utils/apiBaseUrl";

function getAuthHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("authToken") || ""}` };
}

function apiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-xl shadow-sm flex flex-col min-h-0 ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, title, aside }) {
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-2.5 border-b border-gray-100 dark:border-white/5 shrink-0">
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-lpu-maroon/8 dark:bg-lpu-gold/20">
          {Icon && (
            <Icon
              className="w-3.5 h-3.5 text-lpu-maroon dark:text-lpu-gold"
              strokeWidth={2}
            />
          )}
        </span>
        <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-zinc-100">
          {title}
        </h3>
      </div>
      {aside != null && (
        <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">
          {aside}
        </span>
      )}
    </div>
  );
}

function OptionRow({
  option,
  busy,
  dragging,
  onRename,
  onToggle,
  onDelete,
  onDragStart,
  onDragEnter,
  onDragEnd,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(option.name);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== option.name) {
      onRename(option, next);
    }
    setEditing(false);
  };

  const inputClass =
    "w-full h-8 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-zinc-100 px-2 text-sm outline-none focus:ring-2 focus:ring-lpu-gold focus:border-lpu-gold";
  const iconBtn =
    "flex items-center justify-center w-8 h-8 rounded-md text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
  // Match the Knowledge Base page buttons
  const kbEditBtn =
    "flex items-center justify-center w-7 h-7 text-lpu-maroon border border-lpu-maroon dark:text-lpu-gold dark:border-lpu-gold rounded-md hover:bg-lpu-gold hover:text-lpu-maroon hover:border-lpu-gold dark:hover:bg-lpu-gold dark:hover:text-lpu-maroon dark:hover:border-lpu-gold transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-50";
  const kbDeleteBtn =
    "flex items-center justify-center w-7 h-7 bg-lpu-maroon text-white border border-lpu-maroon rounded-md hover:bg-lpu-gold hover:text-lpu-maroon hover:border-lpu-gold shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50";

  return (
    <div
      draggable={!editing}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-2 px-2 py-2 rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50/60 dark:bg-zinc-800/40 transition-opacity ${
        dragging ? "opacity-40" : ""
      }`}
    >
      {!editing && (
        <span
          className="shrink-0 flex items-center justify-center w-5 text-gray-300 dark:text-zinc-600 cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical size={15} />
        </span>
      )}
      {editing ? (
        <input
          autoFocus
          className={inputClass}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(option.name);
              setEditing(false);
            }
          }}
        />
      ) : (
        <span
          className={`flex-1 text-sm truncate ${
            option.is_active
              ? "text-gray-800 dark:text-zinc-100"
              : "text-gray-400 dark:text-zinc-500 line-through"
          }`}
        >
          {option.name}
        </span>
      )}

      {editing ? (
        <>
          <button
            type="button"
            className={iconBtn}
            title="Save"
            disabled={busy}
            onClick={commit}
          >
            <Check size={15} />
          </button>
          <button
            type="button"
            className={iconBtn}
            title="Cancel"
            onClick={() => {
              setDraft(option.name);
              setEditing(false);
            }}
          >
            <X size={15} />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className={kbEditBtn}
            title={
              option.is_active
                ? "Hide from the ticket form"
                : "Show on the ticket form"
            }
            disabled={busy}
            onClick={() => onToggle(option)}
          >
            {option.is_active ? (
              <EyeOff size={12} strokeWidth={2.5} />
            ) : (
              <Eye size={12} strokeWidth={2.5} />
            )}
          </button>
          <button
            type="button"
            className={kbEditBtn}
            title="Rename"
            disabled={busy}
            onClick={() => {
              setDraft(option.name);
              setEditing(true);
            }}
          >
            <Pencil size={12} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            className={kbDeleteBtn}
            title="Delete"
            disabled={busy}
            onClick={() => onDelete(option)}
          >
            <Trash2 size={12} strokeWidth={2.5} />
          </button>
        </>
      )}
    </div>
  );
}

function OptionColumn({ type, title, icon, options, onChange }) {
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const dragIndex = useRef(null);

  const activeCount = options.filter((o) => o.is_active).length;

  const move = (arr, from, to) => {
    const next = arr.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  };

  const persistOrder = async (orderedIds) => {
    try {
      await fetch(apiUrl("/api/ticket-options/reorder"), {
        method: "PATCH",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ type, orderedIds }),
      });
    } catch {
      // order stays applied locally; ignore transient errors
    }
  };

  const handleDragStart = (index, id) => {
    dragIndex.current = index;
    setDraggingId(id);
  };

  const handleDragEnter = (index) => {
    const from = dragIndex.current;
    if (from === null || from === index) return;
    onChange((prev) => move(prev, from, index));
    dragIndex.current = index;
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    setDraggingId(null);
    persistOrder(options.map((o) => o.id));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setError("");
    setAdding(true);
    try {
      const res = await fetch(apiUrl("/api/ticket-options"), {
        method: "POST",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ type, name: trimmed }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Failed to add");
        return;
      }
      onChange((prev) => [...prev, json.data]);
      setName("");
    } catch (err) {
      setError(err.message || "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const handleRename = async (option, newName) => {
    setError("");
    setBusyId(option.id);
    try {
      const res = await fetch(apiUrl(`/api/ticket-options/${option.id}`), {
        method: "PATCH",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Failed to rename");
        return;
      }
      onChange((prev) => prev.map((o) => (o.id === option.id ? json.data : o)));
    } catch (err) {
      setError(err.message || "Failed to rename");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggle = async (option) => {
    setError("");
    setBusyId(option.id);
    try {
      const res = await fetch(apiUrl(`/api/ticket-options/${option.id}`), {
        method: "PATCH",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !option.is_active }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Failed to update");
        return;
      }
      onChange((prev) => prev.map((o) => (o.id === option.id ? json.data : o)));
    } catch (err) {
      setError(err.message || "Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (option) => {
    if (!window.confirm(`Delete "${option.name}"? This cannot be undone.`)) return;
    setError("");
    setBusyId(option.id);
    try {
      const res = await fetch(apiUrl(`/api/ticket-options/${option.id}`), {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Failed to delete");
        return;
      }
      onChange((prev) => prev.filter((o) => o.id !== option.id));
    } catch (err) {
      setError(err.message || "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="flex-1">
      <CardHeader
        icon={icon}
        title={title}
        aside={`${activeCount} active · ${options.length} total`}
      />
      <div className="p-4 flex flex-col gap-3 min-h-0 overflow-hidden">
        <form
          onSubmit={handleAdd}
          className="shrink-0 h-10 flex items-center border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-lpu-gold focus-within:border-lpu-gold bg-white dark:bg-zinc-900"
        >
          <input
            type="text"
            placeholder={`Add a ${title.slice(0, -1).toLowerCase()}...`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 min-w-0 w-full h-full px-3 bg-transparent text-sm font-medium outline-none text-gray-800 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={adding || !name.trim()}
            className="shrink-0 h-8 px-4 mx-1.5 bg-lpu-maroon text-white text-sm font-semibold rounded-md shadow-sm hover:bg-lpu-gold hover:text-lpu-maroon hover:border-lpu-gold active:scale-95 transition-all duration-200 ease-in-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? "Adding..." : "Add"}
          </button>
        </form>

        {error && (
          <div className="text-xs text-red-700 dark:text-red-400 px-3 py-2 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-100 dark:border-red-900/30 shrink-0">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 overflow-y-auto min-h-0">
          {options.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-6">
              None yet. Add one above.
            </p>
          ) : (
            options.map((o, i) => (
              <OptionRow
                key={o.id}
                option={o}
                busy={busyId === o.id}
                dragging={draggingId === o.id}
                onRename={handleRename}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onDragStart={() => handleDragStart(i, o.id)}
                onDragEnter={() => handleDragEnter(i)}
                onDragEnd={handleDragEnd}
              />
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

export default function AdminConfigure() {
  const [all, setAll] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      setLoadError("");
      try {
        const res = await fetch(apiUrl("/api/ticket-options/manage"), {
          headers: getAuthHeader(),
        });
        const json = await res.json();
        if (!json.success) {
          setLoadError(json.message || "Failed to load options");
          return;
        }
        setAll(json.data || []);
      } catch (e) {
        setLoadError(e.message || "Failed to load options");
      }
    })();
  }, []);

  const departments = useMemo(
    () => all.filter((o) => o.type === "department"),
    [all],
  );
  const categories = useMemo(
    () => all.filter((o) => o.type === "category"),
    [all],
  );

  // Column setState helpers that operate on the shared list, scoped per type.
  const setDepartments = (updater) =>
    setAll((prev) => {
      const others = prev.filter((o) => o.type !== "department");
      const current = prev.filter((o) => o.type === "department");
      return [...others, ...updater(current)];
    });
  const setCategories = (updater) =>
    setAll((prev) => {
      const others = prev.filter((o) => o.type !== "category");
      const current = prev.filter((o) => o.type === "category");
      return [...others, ...updater(current)];
    });

  return (
    <section className="w-full px-6 py-4 md:py-6 font-poppins h-full overflow-hidden flex flex-col dark:text-gray-100">
      {loadError ? (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-4 rounded-xl font-semibold text-center border border-red-100 dark:border-red-900/30">
          {loadError}
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OptionColumn
            type="department"
            title="Departments"
            icon={Building2}
            options={departments}
            onChange={setDepartments}
          />
          <OptionColumn
            type="category"
            title="Categories"
            icon={Tag}
            options={categories}
            onChange={setCategories}
          />
        </div>
      )}
    </section>
  );
}
