"use client";

import { useEffect, useState } from "react";
import {
  CATEGORIES,
  categoryLabels,
  type EquipmentCategory,
  type EquipmentData,
  type EquipmentItem,
  type Move,
  type WeightType,
} from "@/lib/equipment";

const WEIGHT_TYPE_LABELS: Record<WeightType, string> = {
  barbell: "Barbell",
  dumbbell_pair: "Dumbbell pair",
  dumbbell_single: "Dumbbell (single)",
  plates: "Plates (no bar)",
  selector: "Weight selector",
};

const WEIGHT_TYPES = Object.keys(WEIGHT_TYPE_LABELS) as WeightType[];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function allItems(data: EquipmentData): { id: string; name: string }[] {
  return CATEGORIES.flatMap((cat) =>
    (data[cat] ?? []).map((item) => ({ id: item.id, name: item.name })),
  );
}

function WeightTypeSelect({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: WeightType | undefined;
  onChange: (v: WeightType | undefined) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? undefined : (e.target.value as WeightType))
      }
      className={
        "bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--accent)] " +
        (className ?? "")
      }
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {WEIGHT_TYPES.map((wt) => (
        <option key={wt} value={wt}>
          {WEIGHT_TYPE_LABELS[wt]}
        </option>
      ))}
    </select>
  );
}

function MoveRow({
  move,
  itemDefaultWeightType,
  otherItems,
  onChangeName,
  onChangeWeightType,
  onMoveTo,
  onDelete,
}: {
  move: Move;
  itemDefaultWeightType: WeightType | undefined;
  otherItems: { id: string; name: string }[];
  onChangeName: (name: string) => void;
  onChangeWeightType: (wt: WeightType | undefined) => void;
  onMoveTo: (targetItemId: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2 border-b border-neutral-800 last:border-0">
      <input
        type="text"
        value={move.name}
        onChange={(e) => onChangeName(e.target.value)}
        className="flex-1 min-w-32 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
        placeholder="Exercise name"
      />
      <WeightTypeSelect
        value={move.weight_type}
        onChange={onChangeWeightType}
        placeholder={
          itemDefaultWeightType
            ? `Inherit (${WEIGHT_TYPE_LABELS[itemDefaultWeightType]})`
            : "Inherit from item"
        }
      />
      <select
        value=""
        onChange={(e) => {
          if (e.target.value) onMoveTo(e.target.value);
        }}
        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-neutral-400 focus:outline-none focus:border-[var(--accent)]"
      >
        <option value="">Move to…</option>
        {otherItems.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <button
        onClick={onDelete}
        className="text-neutral-500 hover:text-red-400 transition-colors px-1.5 py-1 text-lg leading-none"
        title="Remove exercise"
      >
        ×
      </button>
    </div>
  );
}

function ItemCard({
  item,
  category,
  data,
  onUpdateItem,
  onDeleteItem,
  onMoveExercise,
}: {
  item: EquipmentItem;
  category: EquipmentCategory;
  data: EquipmentData;
  onUpdateItem: (updated: EquipmentItem, newCategory?: EquipmentCategory) => void;
  onDeleteItem: () => void;
  onMoveExercise: (moveIndex: number, targetItemId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const others = allItems(data).filter((i) => i.id !== item.id);

  function updateMove(index: number, patch: Partial<Move>) {
    const moves = [...(item.moves ?? [])];
    moves[index] = { ...moves[index], ...patch };
    onUpdateItem({ ...item, moves });
  }

  function deleteMove(index: number) {
    const moves = [...(item.moves ?? [])];
    moves.splice(index, 1);
    onUpdateItem({ ...item, moves });
  }

  function addMove() {
    const moves = [...(item.moves ?? []), { id: `move_${Date.now()}`, name: "" }];
    onUpdateItem({ ...item, moves });
    setExpanded(true);
  }

  return (
    <div className="border border-neutral-700 rounded-lg overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 transition-colors text-left"
      >
        <span className="text-white font-medium flex-1">
          {item.name || <em className="text-neutral-500">Unnamed</em>}
        </span>
        {item.weight_type && (
          <span className="text-xs text-neutral-400 hidden sm:inline">
            {WEIGHT_TYPE_LABELS[item.weight_type]}
          </span>
        )}
        <span className="text-neutral-500 text-xs">
          {item.moves?.length ?? 0} exercise
          {(item.moves?.length ?? 0) !== 1 ? "s" : ""}
        </span>
        <span className="text-neutral-500 ml-1">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-4 py-3 bg-neutral-950 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-neutral-400 mb-1">Name</label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => onUpdateItem({ ...item, name: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
                placeholder="Equipment name"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) =>
                  onUpdateItem(item, e.target.value as EquipmentCategory)
                }
                className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryLabels[cat]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Default weight type</label>
              <WeightTypeSelect
                value={item.weight_type}
                onChange={(wt) => onUpdateItem({ ...item, weight_type: wt })}
                placeholder="None"
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wider">
              Exercises
            </div>
            {(item.moves ?? []).length === 0 && (
              <p className="text-sm text-neutral-600 italic mb-2">No exercises yet.</p>
            )}
            {(item.moves ?? []).map((move, idx) => (
              <MoveRow
                key={`${move.id}-${idx}`}
                move={move}
                itemDefaultWeightType={item.weight_type}
                otherItems={others}
                onChangeName={(name) => updateMove(idx, { name })}
                onChangeWeightType={(wt) => updateMove(idx, { weight_type: wt })}
                onMoveTo={(targetId) => onMoveExercise(idx, targetId)}
                onDelete={() => deleteMove(idx)}
              />
            ))}
            <button
              onClick={addMove}
              className="mt-2 text-sm text-[var(--accent)] hover:text-red-300 transition-colors"
            >
              + Add exercise
            </button>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={onDeleteItem}
              className="text-xs text-neutral-600 hover:text-red-400 transition-colors"
            >
              Delete equipment item
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewItemForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: EquipmentItem, category: EquipmentCategory) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<EquipmentCategory>("free_weights");
  const [weightType, setWeightType] = useState<WeightType | undefined>(undefined);

  function submit() {
    if (!name.trim()) return;
    onAdd(
      {
        id: slugify(name.trim()) || `item_${Date.now()}`,
        name: name.trim(),
        muscles: [],
        moves: [],
        weight_type: weightType,
      },
      category,
    );
  }

  return (
    <div className="border border-[var(--accent)] rounded-lg px-4 py-3 mb-6 bg-neutral-950 space-y-3">
      <p className="text-sm font-medium text-white">New equipment item</p>
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Equipment name"
          autoFocus
          className="flex-1 min-w-48 bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
          className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--accent)]"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {categoryLabels[cat]}
            </option>
          ))}
        </select>
        <WeightTypeSelect
          value={weightType}
          onChange={setWeightType}
          placeholder="No default weight type"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={!name.trim()}
          className="px-3 py-1.5 text-sm rounded bg-[var(--accent)] text-white font-medium disabled:opacity-40"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm rounded text-neutral-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function AdminView() {
  const [data, setData] = useState<EquipmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    fetch("/api/admin/equipment")
      .then((r) => r.json())
      .then((d: EquipmentData) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  function updateItem(
    cat: EquipmentCategory,
    itemId: string,
    updated: EquipmentItem,
    newCat?: EquipmentCategory,
  ) {
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      if (newCat && newCat !== cat) {
        next[cat] = (prev[cat] ?? []).filter((i) => i.id !== itemId);
        next[newCat] = [...(prev[newCat] ?? []), updated];
      } else {
        next[cat] = (prev[cat] ?? []).map((i) => (i.id === itemId ? updated : i));
      }
      return next;
    });
  }

  function deleteItem(cat: EquipmentCategory, itemId: string) {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, [cat]: (prev[cat] ?? []).filter((i) => i.id !== itemId) };
    });
  }

  function addItem(item: EquipmentItem, cat: EquipmentCategory) {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, [cat]: [...(prev[cat] ?? []), item] };
    });
    setShowNewForm(false);
  }

  // Move a single exercise from one equipment item to another atomically
  function moveExercise(
    sourceItemId: string,
    moveIndex: number,
    targetItemId: string,
  ) {
    setData((prev) => {
      if (!prev) return prev;
      let movedMove: Move | undefined;
      const next = { ...prev };

      // Remove from source
      for (const cat of CATEGORIES) {
        next[cat] = (prev[cat] ?? []).map((item) => {
          if (item.id !== sourceItemId) return item;
          const moves = [...(item.moves ?? [])];
          [movedMove] = moves.splice(moveIndex, 1);
          return { ...item, moves };
        });
      }

      if (!movedMove) return prev;
      const move = movedMove;

      // Add to target
      for (const cat of CATEGORIES) {
        next[cat] = next[cat].map((item) => {
          if (item.id !== targetItemId) return item;
          return { ...item, moves: [...(item.moves ?? []), move] };
        });
      }

      return next;
    });
  }

  async function save() {
    if (!data) return;
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch("/api/admin/equipment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error((err as { error?: string }).error ?? "Save failed");
      }
      setToast({ msg: "Saved!", ok: true });
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Save failed", ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  }

  if (loading) {
    return <p className="text-neutral-400 text-sm">Loading catalog…</p>;
  }
  if (!data) {
    return <p className="text-red-400 text-sm">Failed to load catalog.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setShowNewForm(true)}
          disabled={showNewForm}
          className="text-sm text-[var(--accent)] hover:text-red-300 transition-colors disabled:opacity-40"
        >
          + New equipment item
        </button>
        <div className="flex items-center gap-3">
          {toast && (
            <span className={"text-sm " + (toast.ok ? "text-green-400" : "text-red-400")}>
              {toast.msg}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-full bg-[var(--accent)] text-white font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {showNewForm && (
        <NewItemForm onAdd={addItem} onCancel={() => setShowNewForm(false)} />
      )}

      {CATEGORIES.map((cat) => {
        const items = data[cat] ?? [];
        return (
          <section key={cat} className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-3">
              {categoryLabels[cat]}
              <span className="ml-2 font-normal normal-case text-neutral-700">
                ({items.length})
              </span>
            </h2>
            {items.length === 0 && (
              <p className="text-sm text-neutral-700 italic mb-2">
                No items in this category.
              </p>
            )}
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                category={cat}
                data={data}
                onUpdateItem={(updated, newCat) =>
                  updateItem(cat, item.id, updated, newCat)
                }
                onDeleteItem={() => deleteItem(cat, item.id)}
                onMoveExercise={(moveIndex, targetItemId) =>
                  moveExercise(item.id, moveIndex, targetItemId)
                }
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}
