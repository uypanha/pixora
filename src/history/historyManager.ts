import { PixoraDocument } from '../types/document';
import { HistoryCommand } from './commands';

export class HistoryManager {
  private undoStack: HistoryCommand[] = [];
  private redoStack: HistoryCommand[] = [];
  private maxHistory: number;

  constructor(maxHistory = 50) {
    this.maxHistory = maxHistory;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get lastUndoDescription(): string | null {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1].description;
  }

  get lastRedoDescription(): string | null {
    if (this.redoStack.length === 0) return null;
    return this.redoStack[this.redoStack.length - 1].description;
  }

  execute(command: HistoryCommand, doc: PixoraDocument): PixoraDocument {
    const newDoc = command.execute(doc);
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    // Clear redo stack on new action
    this.redoStack = [];
    return newDoc;
  }

  undo(doc: PixoraDocument): PixoraDocument | null {
    const command = this.undoStack.pop();
    if (!command) return null;

    const newDoc = command.undo(doc);
    this.redoStack.push(command);
    return newDoc;
  }

  redo(doc: PixoraDocument): PixoraDocument | null {
    const command = this.redoStack.pop();
    if (!command) return null;

    const newDoc = command.execute(doc);
    this.undoStack.push(command);
    return newDoc;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
