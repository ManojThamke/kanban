"use client";

import { useMemo, useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Ellipsis, LayoutGrid, Plus, Sparkles, X } from "lucide-react";
import { addCard, Column, deleteCard, getBoardProgress, getCardProgress, initialColumns, moveCard, renameColumn } from "./board";

function CardFace({ card, columnId, onDelete }: { card: Column["cards"][number]; columnId: string; onDelete: (columnId: string, cardId: string) => void }) {
  const progress = getCardProgress(columnId);
  return <>
    <div className="card-top"><span className="card-grip" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span><button className="icon-button card-delete" aria-label={`Delete ${card.title}`} onPointerDown={(event) => event.stopPropagation()} onTouchStart={(event) => event.stopPropagation()} onClick={() => onDelete(columnId, card.id)}><X size={15} /></button></div>
    <h3>{card.title}</h3><p>{card.details}</p>
    <div className="card-progress">
      <div className="card-progress-track" role="progressbar" aria-label={`${card.title} stage progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span className={`card-progress-fill ${columnId}`} style={{ width: `${progress}%` }} /></div>
      <span>{progress}%</span>
    </div>
  </>;
}

function DraggableCard({ card, columnId, onDelete }: { card: Column["cards"][number]; columnId: string; onDelete: (columnId: string, cardId: string) => void }) {
  const isComplete = columnId === "done";
  const { listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id, disabled: isComplete });
  return <article ref={setNodeRef} {...listeners} tabIndex={isComplete ? undefined : 0} role="group" aria-roledescription={isComplete ? undefined : "draggable task"} aria-label={isComplete ? `${card.title}, complete and locked` : `${card.title}, drag anywhere on the card to move`} style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.3 : 1 }} className={`task-card${isComplete ? " task-card-locked" : ""}`} title={isComplete ? "Completed tasks are locked" : "Drag anywhere on the card to move"}><CardFace card={card} columnId={columnId} onDelete={onDelete} /></article>;
}

function CardItem({ card, columnId, onDelete, overlay = false }: { card: Column["cards"][number]; columnId: string; onDelete: (columnId: string, cardId: string) => void; overlay?: boolean }) {
  return overlay ? <article className="task-card task-card-overlay"><CardFace card={card} columnId={columnId} onDelete={onDelete} /></article> : <DraggableCard card={card} columnId={columnId} onDelete={onDelete} />;
}

function BoardColumn({ column, onRename, onDelete, onAdd }: { column: Column; onRename: (id: string, name: string) => void; onDelete: (columnId: string, cardId: string) => void; onAdd: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  function finishRename() { onRename(column.id, name); setName(name.trim() || column.name); setEditing(false); }
  return <section ref={setNodeRef} className={`board-column${isOver ? " column-over" : ""}`}>
    <header className="column-header">
      <div className="column-title-wrap"><span className={`status-dot ${column.id}`} />{editing ? <input autoFocus className="rename-input" value={name} aria-label="Column name" onChange={(e) => setName(e.target.value)} onBlur={finishRename} onKeyDown={(e) => { if (e.key === "Enter") finishRename(); if (e.key === "Escape") { setName(column.name); setEditing(false); } }} /> : <button className="column-name" onClick={() => setEditing(true)} title="Rename column">{column.name}</button>}<span className="column-count">{column.cards.length}</span></div>
      <button className="icon-button column-menu" aria-label={`Rename ${column.name}`} onClick={() => setEditing(true)}><Ellipsis size={19} /></button>
    </header>
    <div className="card-list">{column.cards.map((card) => <CardItem key={card.id} card={card} columnId={column.id} onDelete={onDelete} />)}
      {column.cards.length === 0 && <div className="empty-drop">Drop a card here</div>}
    </div>
    <button className="add-card" onClick={() => onAdd(column.id)}><Plus size={16} strokeWidth={2.2} /> Add a card</button>
  </section>;
}

function NewCardDialog({ onClose, onSave }: { onClose: () => void; onSave: (title: string, details: string) => void }) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><form className="new-card-modal" onSubmit={(e) => { e.preventDefault(); if (title.trim()) onSave(title.trim(), details.trim()); }}>
    <div className="modal-heading"><div><span className="eyebrow">NEW TASK</span><h2>Add a card</h2></div><button type="button" className="icon-button" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
    <label htmlFor="task-title">Title</label><input autoFocus id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to get done?" maxLength={90} required />
    <label htmlFor="task-details">Details <span>Optional</span></label><textarea id="task-details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Add a little context..." rows={4} maxLength={240} />
    <div className="modal-actions"><button type="button" className="button-quiet" onClick={onClose}>Cancel</button><button type="submit" className="button-primary"><Plus size={16} /> Create card</button></div>
  </form></div>;
}

export default function Home() {
  const [columns, setColumns] = useState(initialColumns);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<{ card: Column["cards"][number]; columnId: string } | null>(null);
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }), useSensor(KeyboardSensor));
  const totalCards = useMemo(() => columns.reduce((sum, column) => sum + column.cards.length, 0), [columns]);
  const boardProgress = useMemo(() => getBoardProgress(columns), [columns]);
  function handleDragEnd(event: DragEndEvent) { if (event.over) setColumns((current) => moveCard(current, String(event.active.id), String(event.over!.id))); setActiveCard(null); }
  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><span /><span /><span /></span><span>northstar</span></div>
      <div className="workspace-select"><span className="workspace-avatar">S</span><span className="workspace-copy"><b>Studio North</b><small>Product team</small></span></div>
      <span className="nav-label">WORKSPACE</span>
      <nav className="main-nav"><a className="nav-item active" href="#board" aria-label="Project board"><LayoutGrid size={17} /><span>Project board</span></a></nav>
      <div className="sidebar-bottom"><div className="sidebar-promo"><div className="promo-icon"><Sparkles size={16} /></div><b>A little more focus.</b><p>Good work starts with a clear next step.</p><div className="promo-line"><span /></div></div><div className="profile"><div className="profile-avatar">AM</div><div className="profile-copy"><b>Alex Morgan</b><small>Product designer</small></div></div></div>
    </aside>
    <section className="workspace" id="board">
      <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><b>Project board</b></div><div className="top-actions"><div className="top-avatar">AM</div></div></header>
      <div className="board-page">
        <div className="board-intro"><div><div className="board-kicker"><span className="kicker-line" /> YOUR SPACE, IN MOTION</div><h1>Project board<span className="title-period">.</span></h1><p className="board-subtitle">A little progress, every day.</p></div><div className="board-intro-actions"><div className="board-progress"><div className="board-progress-heading"><span>Board progress</span><strong>{boardProgress}%</strong></div><div className="board-progress-track" role="progressbar" aria-label="Overall board progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={boardProgress}><span style={{ width: `${boardProgress}%` }} /></div></div><button className="button-primary top-add" onClick={() => setAddingTo(columns[0].id)}><Plus size={17} /> New task</button></div></div>
        <div className="board-toolbar"><div className="board-tabs"><span className="board-tab active"><LayoutGrid size={15} /> Board</span></div><div className="board-hint"><span className="hint-dot" /> {totalCards} cards · Drag to move</div></div>
        <div className="board-scroll"><DndContext id="northstar-board" sensors={sensors} onDragStart={(event) => { const column = columns.find((item) => item.cards.some((card) => card.id === event.active.id)); const card = column?.cards.find((item) => item.id === event.active.id); setActiveCard(card && column ? { card, columnId: column.id } : null); }} onDragEnd={handleDragEnd} onDragCancel={() => setActiveCard(null)}>
          <div className="board-grid">{columns.map((column) => <BoardColumn key={column.id} column={column} onRename={(id, name) => setColumns((current) => renameColumn(current, id, name))} onDelete={(columnId, cardId) => setColumns((current) => deleteCard(current, columnId, cardId))} onAdd={setAddingTo} />)}</div>
          <DragOverlay>{activeCard ? <CardItem card={activeCard.card} columnId={activeCard.columnId} onDelete={() => {}} overlay /> : null}</DragOverlay>
        </DndContext></div>
        <footer className="board-footer"><span><Sparkles size={12} className="footer-spark" /> Small steps make great things.</span><span>{totalCards} cards across {columns.length} columns</span></footer>
      </div>
    </section>
    {addingTo && <NewCardDialog onClose={() => setAddingTo(null)} onSave={(title, details) => { const card = { id: crypto.randomUUID(), title, details }; setColumns((current) => addCard(current, addingTo, card)); setAddingTo(null); }} />}
  </main>;
}
