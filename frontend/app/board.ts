export type Card = { id: string; title: string; details: string };
export type Column = { id: string; name: string; cards: Card[] };

export const initialColumns: Column[] = [
  { id: "backlog", name: "Backlog", cards: [
    { id: "c1", title: "Map the customer journey", details: "Document the moments that matter from first visit to first value." },
    { id: "c2", title: "Audit the current experience", details: "Collect friction points from support and recent user interviews." },
    { id: "c3", title: "Explore onboarding directions", details: "Sketch a few ways to make setup feel effortless." },
  ] },
  { id: "todo", name: "To do", cards: [
    { id: "c4", title: "Set up the design system", details: "Define the foundations for color, type, spacing, and components." },
    { id: "c5", title: "Write product principles", details: "Align the team around a small set of decisions we can return to." },
  ] },
  { id: "progress", name: "In progress", cards: [
    { id: "c6", title: "Design the new dashboard", details: "Bring the most useful information into one clear view." },
    { id: "c7", title: "Build the responsive shell", details: "Make the core workspace feel natural at every screen size." },
    { id: "c8", title: "Refine empty states", details: "Give first-time users a friendly, useful next step." },
  ] },
  { id: "review", name: "In review", cards: [
    { id: "c9", title: "Review navigation structure", details: "Check labels and hierarchy with a few quick usability sessions." },
    { id: "c10", title: "Polish the icon set", details: "Bring the key actions into a consistent visual language." },
  ] },
  { id: "done", name: "Done", cards: [
    { id: "c11", title: "Kickoff and project brief", details: "Agree on the audience, the opportunity, and what success looks like." },
    { id: "c12", title: "Gather early feedback", details: "Share the first ideas and bring the team into the process." },
  ] },
];

export function addCard(columns: Column[], columnId: string, card: Card): Column[] {
  return columns.map((column) => column.id === columnId ? { ...column, cards: [...column.cards, card] } : column);
}

export function deleteCard(columns: Column[], columnId: string, cardId: string): Column[] {
  return columns.map((column) => column.id === columnId ? { ...column, cards: column.cards.filter((card) => card.id !== cardId) } : column);
}

export function renameColumn(columns: Column[], columnId: string, name: string): Column[] {
  const trimmed = name.trim();
  return columns.map((column) => column.id === columnId && trimmed ? { ...column, name: trimmed } : column);
}

export function moveCard(columns: Column[], activeId: string, overId: string): Column[] {
  const source = columns.find((column) => column.cards.some((card) => card.id === activeId));
  const target = columns.find((column) => column.id === overId || column.cards.some((card) => card.id === overId));
  if (!source || !target) return columns;
  const card = source.cards.find((item) => item.id === activeId)!;
  if (source.id === target.id) {
    const from = source.cards.findIndex((item) => item.id === activeId);
    const to = overId === target.id ? source.cards.length - 1 : source.cards.findIndex((item) => item.id === overId);
    if (from === to || to < 0) return columns;
    const cards = [...source.cards];
    cards.splice(from, 1);
    cards.splice(to, 0, card);
    return columns.map((column) => column.id === source.id ? { ...column, cards } : column);
  }
  return columns.map((column) => {
    if (column.id === source.id) return { ...column, cards: column.cards.filter((item) => item.id !== activeId) };
    if (column.id === target.id) {
      const index = overId === target.id ? column.cards.length : column.cards.findIndex((item) => item.id === overId);
      const cards = [...column.cards];
      cards.splice(index < 0 ? cards.length : index, 0, card);
      return { ...column, cards };
    }
    return column;
  });
}
