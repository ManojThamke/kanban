import { describe, expect, it } from "vitest";
import { addCard, deleteCard, initialColumns, moveCard, renameColumn } from "./board";

describe("board state", () => {
  it("starts with five columns and populated sample cards", () => {
    expect(initialColumns).toHaveLength(5);
    expect(initialColumns.every((column) => column.cards.length > 0)).toBe(true);
    expect(initialColumns[0].cards[0]).toHaveProperty("title");
    expect(initialColumns[0].cards[0]).toHaveProperty("details");
  });

  it("adds a card to the selected column", () => {
    const result = addCard(initialColumns, "todo", { id: "new", title: "Ship the idea", details: "Make it real" });
    expect(result.find((column) => column.id === "todo")?.cards.at(-1)?.id).toBe("new");
    expect(initialColumns[1].cards).toHaveLength(2);
  });

  it("deletes a card from its column", () => {
    const result = deleteCard(initialColumns, "backlog", "c1");
    expect(result[0].cards.some((card) => card.id === "c1")).toBe(false);
    expect(initialColumns[0].cards).toHaveLength(3);
  });

  it("renames a column and ignores a blank name", () => {
    expect(renameColumn(initialColumns, "todo", "  Ready soon  ")[1].name).toBe("Ready soon");
    expect(renameColumn(initialColumns, "todo", "   ")[1].name).toBe("To do");
  });

  it("moves a card to another column", () => {
    const result = moveCard(initialColumns, "c1", "todo");
    expect(result[0].cards.some((card) => card.id === "c1")).toBe(false);
    expect(result[1].cards.map((card) => card.id)).toEqual(["c4", "c5", "c1"]);
  });

  it("reorders cards within a column", () => {
    const result = moveCard(initialColumns, "c1", "c3");
    expect(result[0].cards.map((card) => card.id)).toEqual(["c2", "c3", "c1"]);
  });
});
