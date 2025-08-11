import React, { useMemo, useRef, useState, useEffect } from "react";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Board />
    </div>
  );
}

function Header() {
  return (
    <header className="h-12 w-full border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
        <h1 className="text-sm font-semibold text-gray-800">Painel 2×2 — Post-its & Totais</h1>
      </div>
      <div className="text-[11px] text-gray-500">Arraste os cards entre os quadrantes</div>
    </header>
  );
}

const COLOR_OPTIONS = [
  "bg-blue-50","bg-green-50","bg-violet-50","bg-orange-50","bg-rose-50","bg-teal-50","bg-sky-50","bg-lime-50"
];

function Board() {
  const [items, setItems] = useState<Record<number, Item[]>>({0: [],1: [],2: [],3: []});
  const [settings, setSettings] = useState<Record<number, { name: string; color: string }>>({
    0: { name: "Quadrante 1", color: COLOR_OPTIONS[0] },
    1: { name: "Quadrante 2", color: COLOR_OPTIONS[1] },
    2: { name: "Quadrante 3", color: COLOR_OPTIONS[2] },
    3: { name: "Quadrante 4", color: COLOR_OPTIONS[3] },
  });

  useEffect(() => {
    const savedItems = localStorage.getItem("board-items");
    const savedSettings = localStorage.getItem("board-settings");
    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  useEffect(() => {
    localStorage.setItem("board-items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("board-settings", JSON.stringify(settings));
  }, [settings]);

  const [modalOpen, setModalOpen] = useState(false);
  const [targetQuadrant, setTargetQuadrant] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTarget, setSettingsTarget] = useState<number | null>(null);

  function openModal(q: number) { setTargetQuadrant(q); setModalOpen(true);} 
  function closeModal() { setModalOpen(false); setTargetQuadrant(null);} 
  function openSettings(q: number) { setSettingsTarget(q); setSettingsOpen(true);} 
  function closeSettings() { setSettingsOpen(false); setSettingsTarget(null);} 
  function saveSettings(q: number, next: { name: string; color: string }) { setSettings((p) => ({ ...p, [q]: next })); }
  function addItemToQuadrant(q: number, item: Item) { setItems((p) => ({ ...p, [q]: [...p[q], item] })); }
  function moveItem(id: string, fromQ: number, toQ: number) {
    if (fromQ === toQ) return;
    setItems((p) => {
      const fromList = p[fromQ].filter((it) => it.id !== id);
      const moved = p[fromQ].find((it) => it.id === id);
      if (!moved) return p;
      return { ...p, [fromQ]: fromList, [toQ]: [...p[toQ], moved] };
    });
  }

  return (
    <main className="h-[calc(100vh-3rem)] p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-2 h-full">
        {[0, 1, 2, 3].map((q) => (
          <Quadrant
            key={q}
            idx={q}
            name={settings[q].name}
            className={settings[q].color}
            items={items[q]}
            onAdd={() => openModal(q)}
            onSettings={() => openSettings(q)}
            onMove={moveItem}
          />
        ))}
      </div>
      {modalOpen && targetQuadrant !== null && (<AddItemModal onClose={closeModal} onSubmit={(item) => { addItemToQuadrant(targetQuadrant, item); closeModal(); }} />)}
      {settingsOpen && settingsTarget !== null && (
        <QuadrantSettingsModal initial={settings[settingsTarget]} onClose={closeSettings} onSubmit={(conf) => { saveSettings(settingsTarget, conf); closeSettings(); }} />
      )}
    </main>
  );
}

function Quadrant({ idx, name, className, items, onAdd, onSettings, onMove }: { idx: number; name: string; className?: string; items: Item[]; onAdd: () => void; onSettings: () => void; onMove: (id: string, fromQ: number, toQ: number) => void; }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const total = useMemo(() => items.reduce((sum, it) => sum + (isFinite(it.value) ? it.value : 0), 0), [items]);
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); ref.current?.classList.add("ring-2","ring-emerald-400"); }
  function handleDragLeave() { ref.current?.classList.remove("ring-2","ring-emerald-400"); }
  function handleDrop(e: React.DragEvent) { e.preventDefault(); handleDragLeave(); const id = e.dataTransfer.getData("text/id"); const fromQ = Number(e.dataTransfer.getData("text/from")); if (id) onMove(id, fromQ, idx);} 
  return (
    <section ref={ref} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`relative rounded-2xl border border-black/5 shadow-sm p-3 md:p-4 overflow-auto ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2"><span className="text-xs uppercase tracking-wide text-gray-600 font-medium">{name}</span><TotalPill value={total} /></div>
        <div className="flex items-center gap-1">
          <button onClick={onSettings} className="px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-full hover:bg-gray-50 shadow-sm" title="Configurar quadrante">⚙️</button>
          <button onClick={onAdd} className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-full hover:bg-gray-50 shadow-sm active:scale-[0.98]">+ Adicionar</button>
        </div>
      </div>
      {items.length === 0 ? <EmptyState /> : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">{items.map((it) => (<PostIt key={it.id} item={it} fromQ={idx} />))}</div>}
    </section>
  );
}

function EmptyState() { return (<div className="h-40 border border-dashed border-gray-300 rounded-xl bg-white/40 text-gray-400 text-xs flex items-center justify-center">Sem post-its. Clique em "Adicionar" ou arraste aqui.</div>); }
function TotalPill({ value }: { value: number }) { const fmt = useMemo(() => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }), []); return (<span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-medium px-2.5 py-1 border border-emerald-200">Total: {fmt.format(value)}</span>); }
function PostIt({ item, fromQ }: { item: Item; fromQ: number }) { const { bg, ring, text } = useMemo(() => colorClassesForDate(item.date), [item.date]); function onDragStart(e: React.DragEvent) { e.dataTransfer.setData("text/id", item.id); e.dataTransfer.setData("text/from", String(fromQ)); e.dataTransfer.effectAllowed = "move"; } const fmtBRL = useMemo(() => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }), []); return (<article draggable onDragStart={onDragStart} className={`group select-none cursor-grab active:cursor-grabbing rounded-xl shadow-sm border ${ring} ${bg} ${text} p-3 transition hover:shadow-md`} title="Arraste para outro quadrante"><div className="flex items-center justify-between mb-1.5"><h3 className="text-sm font-semibold line-clamp-1">{item.description}</h3><span className="text-[10px] bg-black/10 px-1.5 rounded-full">{formatDate(item.date)}</span></div><p className="text-xs text-gray-600 line-clamp-3 mb-2">{item.obs || ""}</p><div className="text-sm font-semibold">{fmtBRL.format(item.value || 0)}</div></article>); }
function AddItemModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (item: Item) => void }) { const [description, setDescription] = useState(""); const [date, setDate] = useState(isoToday()); const [value, setValue] = useState<string>(""); const [obs, setObs] = useState(""); const [error, setError] = useState<string | null>(null); function handleSubmit(e: React.FormEvent) { e.preventDefault(); setError(null); const v = parseFloat(value.replace(",", ".")); if (!description.trim()) return setError("Informe a descrição."); if (!date) return setError("Informe a data."); if (!isFinite(v)) return setError("Informe um valor numérico."); onSubmit({ id: crypto.randomUUID(), description: description.trim(), date, value: v, obs: obs.trim() }); } return (<div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/40" onClick={onClose} /><div className="relative bg-white w-[95vw] max-w-md rounded-2xl shadow-xl border border-gray-200 p-4"><div className="flex items-center justify-between mb-2"><h2 className="text-base font-semibold">Novo post-it</h2><button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-sm">Fechar</button></div><form onSubmit={handleSubmit} className="space-y-3"><div><label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label><input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" value={description} onChange={(e) => setDescription(e.target.value)} autoFocus /></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-medium text-gray-600 mb-1">Data</label><input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" value={date} onChange={(e) => setDate(e.target.value)} /></div><div><label className="block text-xs font-medium text-gray-600 mb-1">Valor</label><input type="text" inputMode="decimal" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" value={value} onChange={(e) => setValue(e.target.value)} /></div></div><div><label className="block text-xs font-medium text-gray-600 mb-1">Obs.</label><textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[80px]" value={obs} onChange={(e) => setObs(e.target.value)} /></div>{error && <p className="text-xs text-red-600">{error}</p>}<div className="flex items-center justify-end gap-2 pt-1"><button type="button" onClick={onClose} className="px-3 py-2 text-xs rounded-lg border border-gray-300">Cancelar</button><button type="submit" className="px-3 py-2 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Adicionar</button></div></form></div></div>); }
function QuadrantSettingsModal({ initial, onClose, onSubmit }: { initial: { name: string; color: string }; onClose: () => void; onSubmit: (v: { name: string; color: string }) => void }) { const [name, setName] = useState(initial.name); const [color, setColor] = useState(initial.color); function handleSubmit(e: React.FormEvent) { e.preventDefault(); onSubmit({ name: name.trim() || initial.name, color }); } return (<div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/40" onClick={onClose} /><div className="relative bg-white w-[95vw] max-w-md rounded-2xl shadow-xl border border-gray-200 p-4"><div className="flex items-center justify-between mb-2"><h2 className="text-base font-semibold">Configurar quadrante</h2><button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-sm">Fechar</button></div><form onSubmit={handleSubmit} className="space-y-3"><div><label className="block text-xs font-medium text-gray-600 mb-1">Nome do quadrante</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" /></div><div><label className="block text-xs font-medium text-gray-600 mb-2">Cor de fundo</label><div className="grid grid-cols-4 gap-2">{COLOR_OPTIONS.map((opt) => (<label key={opt} className="cursor-pointer"><input type="radio" name="quadrant-color" value={opt} checked={color === opt} onChange={() => setColor(opt)} className="hidden" /><div className={`h-10 rounded-xl border ${color === opt ? "ring-2 ring-emerald-400" : "border-gray-200"} ${opt}`} /></label>))}</div></div><div className="flex items-center justify-end gap-2 pt-1"><button type="button" onClick={onClose} className="px-3 py-2 text-xs rounded-lg border border-gray-300">Cancelar</button><button type="submit" className="px-3 py-2 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Salvar</button></div></form></div></div>); }
function isoToday() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`; }
function formatDate(iso: string) { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; }
function colorClassesForDate(iso: string) { const today = isoToday(); const cmp = iso < today ? -1 : iso > today ? 1 : 0; if (cmp < 0) return { bg: "bg-red-50", ring: "border-red-200", text: "text-red-900" }; if (cmp === 0) return { bg: "bg-yellow-50", ring: "border-yellow-200", text: "text-yellow-900" }; return { bg: "bg-white", ring: "border-gray-200", text: "text-gray-900" }; }
type Item = { id: string; description: string; date: string; value: number; obs?: string; };
