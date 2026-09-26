import { describe, expect, it } from "vitest";
import { addCard, deleteCard, getBoardProgress, getCardProgress, initialColumns, moveCard, renameColumn } from "./board";

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

  it("locks a card after it is moved to Done", () => {
    const completed = moveCard(initialColumns, "c1", "done");
    expect(completed.find((column) => column.id === "done")?.cards.map((card) => card.id)).toContain("c1");
    expect(moveCard(completed, "c1", "todo")).toBe(completed);
  });

  it("reorders cards within a column", () => {
    const result = moveCard(initialColumns, "c1", "c3");
    expect(result[0].cards.map((card) => card.id)).toEqual(["c2", "c3", "c1"]);
  });

  it("maps each board stage to a progress percentage", () => {
    expect(["backlog", "todo", "progress", "review", "done"].map(getCardProgress)).toEqual([0, 25, 50, 75, 100]);
  });

  it("calculates board progress from its cards and returns zero for an empty board", () => {
    expect(getBoardProgress(initialColumns)).toBe(46);
    expect(getBoardProgress(initialColumns.map((column) => ({ ...column, cards: [] })))).toBe(0);
  });
});
