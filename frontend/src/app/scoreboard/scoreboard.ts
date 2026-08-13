import { Component, HostListener, computed, signal } from '@angular/core';
import { HotkeySettingsComponent } from '../hotkey-settings/hotkey-settings';
import { DEFAULT_SHORTCUTS, Shortcut, Throw } from '../shared/scoreboard.models';

const SHORTCUT_STORAGE_KEY = 'dartmaster.shortcuts';

interface ThrowCell {
  id: number;
  score: number;
}

interface ThrowRow {
  round: number;
  scores: [ThrowCell | null, ThrowCell | null];
}

interface PlayerStats {
  dartCount: number;
  average: string;
  lastThrow: number | null;
}

interface PendingCheckout {
  player: number;
  score: number;
}

@Component({
  selector: 'app-scoreboard',
  imports: [HotkeySettingsComponent],
  templateUrl: './scoreboard.html',
  styleUrl: './scoreboard.scss',
})
export class ScoreboardComponent {
  private nextThrowId = 1;
  protected readonly startScore = 501;
  protected readonly players = ['Spieler 1', 'Spieler 2'];
  protected readonly playerScores = signal<[number, number]>([this.startScore, this.startScore]);
  protected readonly activePlayer = signal(0);
  protected readonly scoreInput = signal('');
  protected readonly inputMessage = signal<string | null>(null);
  protected readonly throws = signal<Throw[]>([]);
  protected readonly shortcuts = signal<Shortcut[]>(this.loadShortcuts());
  protected readonly settingsOpen = signal(false);
  protected readonly editingThrowId = signal<number | null>(null);
  protected readonly editScoreInput = signal('');
  protected readonly editError = signal<string | null>(null);
  protected readonly pendingCheckout = signal<PendingCheckout | null>(null);
  protected readonly checkoutDarts = signal(3);
  protected readonly checkoutDoubleAttempts = signal(1);
  protected readonly remaining = computed(() => this.playerScores()[this.activePlayer()]);
  protected readonly entryDisabled = computed(() => this.isFinished() || this.pendingCheckout() !== null);
  protected readonly playerStats = computed<[PlayerStats, PlayerStats]>(() => [0, 1].map((player) => {
    const playerThrows = this.throws().filter((throwItem) => throwItem.player === player);
    const total = playerThrows.reduce((sum, throwItem) => sum + throwItem.score, 0);
    const dartCount = playerThrows.reduce((sum, throwItem) => sum + throwItem.darts, 0);
    return {
      dartCount,
      average: dartCount ? ((total * 3) / dartCount).toFixed(1) : '0.0',
      lastThrow: playerThrows[0]?.score ?? null,
    };
  }) as [PlayerStats, PlayerStats]);
  protected readonly editingThrow = computed(() => {
    const id = this.editingThrowId();
    return id === null ? null : this.throws().find((throwItem) => throwItem.id === id) ?? null;
  });
  protected readonly throwRows = computed<ThrowRow[]>(() => {
    const rows: ThrowRow[] = [];
    const playerThrowCounts: [number, number] = [0, 0];

    for (const throwItem of this.throws().slice().reverse()) {
      playerThrowCounts[throwItem.player] += 1;
      const round = playerThrowCounts[throwItem.player];
      const existingRow = rows[round - 1] ?? { round, scores: [null, null] };

      existingRow.scores[throwItem.player] = { id: throwItem.id, score: throwItem.score };
      rows[round - 1] = existingRow;
    }

    return rows;
  });
  protected readonly winner = computed(() => {
    const winnerIndex = this.playerScores().findIndex((score) => score === 0);
    return winnerIndex === -1 ? null : winnerIndex;
  });
  protected readonly isFinished = computed(() => this.winner() !== null);

  protected addScore(value: string | number): void {
    const score = typeof value === 'number' ? value : Number(value);
    if (!Number.isInteger(score) || score < 0 || score > 180 || this.entryDisabled()) return;

    const remainingBeforeThrow = this.remaining();
    const remainingAfterThrow = remainingBeforeThrow - score;
    if (remainingAfterThrow < 0) {
      this.inputMessage.set('Fehler: Die Aufnahme ist höher als der Restwert.');
      this.scoreInput.set('');
      return;
    }
    if (remainingAfterThrow === 1) {
      this.inputMessage.set('Fehler: Ein Leg muss mit Doppel beendet werden – Restwert 1 ist nicht möglich.');
      this.scoreInput.set('');
      return;
    }

    const player = this.activePlayer();
    if (remainingAfterThrow === 0) {
      this.pendingCheckout.set({ player, score });
      this.checkoutDarts.set(3);
      this.checkoutDoubleAttempts.set(1);
      this.scoreInput.set('');
      this.inputMessage.set(null);
      return;
    }

    this.recordThrow(score, player, 3);
    this.activePlayer.set(player === 0 ? 1 : 0);
    this.scoreInput.set('');
    this.inputMessage.set(null);
  }

  protected setCheckoutDarts(darts: number): void {
    this.checkoutDarts.set(darts);
    if (this.checkoutDoubleAttempts() > darts) this.checkoutDoubleAttempts.set(darts);
  }

  protected setCheckoutDoubleAttempts(attempts: number): void {
    if (attempts <= this.checkoutDarts()) this.checkoutDoubleAttempts.set(attempts);
  }

  protected closeCheckout(): void {
    this.pendingCheckout.set(null);
  }

  protected saveCheckout(): void {
    const checkout = this.pendingCheckout();
    const darts = this.checkoutDarts();
    const doubleAttempts = this.checkoutDoubleAttempts();
    if (!checkout || darts < 1 || darts > 3 || doubleAttempts < 1 || doubleAttempts > darts) return;

    this.recordThrow(checkout.score, checkout.player, darts, doubleAttempts);
    this.activePlayer.set(checkout.player);
    this.pendingCheckout.set(null);
  }

  protected appendDigit(digit: string): void {
    if (this.entryDisabled()) return;
    const nextValue = `${this.scoreInput()}${digit}`.replace(/^0+(?=\d)/, '').slice(0, 3);
    const score = Number(nextValue);
    if (!Number.isInteger(score) || score > 180) return;
    this.scoreInput.set(nextValue);
    this.inputMessage.set(null);
  }

  protected submitInput(): void {
    if (!this.scoreInput()) return;
    this.addScore(this.scoreInput());
  }

  protected clearInput(): void {
    this.scoreInput.set('');
    this.inputMessage.set(null);
  }

  protected clearOrUndo(): void {
    if (this.scoreInput()) {
      this.clearInput();
      return;
    }

    this.undo();
  }

  protected submitDynamicZeroOr180(): void {
    if (this.scoreInput()) {
      this.appendDigit('0');
      return;
    }

    this.addScore(180);
  }

  protected noScore(): void {
    this.addScore(0);
  }

  protected activateShortcut(index: number): void {
    const shortcut = this.shortcuts()[index];
    if (!shortcut) return;
    this.addScore(shortcut.score);
  }

  protected shortcutScore(index: number): number | null {
    return this.shortcuts()[index]?.score ?? null;
  }

  protected undo(): void {
    const [last, ...rest] = this.throws();
    if (!last) return;
    this.playerScores.update((scores) => scores.map((remaining, index) => index === last.player ? remaining + last.score : remaining) as [number, number]);
    this.activePlayer.set(last.player);
    this.throws.set(rest);
    this.inputMessage.set(null);
  }

  protected reset(): void {
    this.playerScores.set([this.startScore, this.startScore]);
    this.activePlayer.set(0);
    this.throws.set([]);
    this.scoreInput.set('');
    this.inputMessage.set(null);
    this.pendingCheckout.set(null);
    this.nextThrowId = 1;
  }

  protected openEditThrow(id: number): void {
    const throwItem = this.throws().find((item) => item.id === id);
    if (!throwItem) return;

    this.editingThrowId.set(id);
    this.editScoreInput.set(String(throwItem.score));
    this.editError.set(null);
  }

  protected updateEditScore(value: string): void {
    this.editScoreInput.set(value);
    this.editError.set(null);
  }

  protected closeEditThrow(): void {
    this.editingThrowId.set(null);
    this.editScoreInput.set('');
    this.editError.set(null);
  }

  protected saveEditedThrow(): void {
    const id = this.editingThrowId();
    const score = Number(this.editScoreInput());
    if (id === null || !Number.isInteger(score) || score < 0 || score > 180) {
      this.editError.set('Bitte einen Wert von 0 bis 180 eingeben.');
      return;
    }

    const editedThrows = this.throws().map((throwItem) => throwItem.id === id ? { ...throwItem, score } : throwItem);
    const gameState = this.recalculateGame(editedThrows);
    if (!gameState) {
      this.editError.set('Dieser Wert ist für den Restwert an dieser Stelle nicht gültig.');
      return;
    }

    this.throws.set(editedThrows);
    this.playerScores.set(gameState.scores);
    this.activePlayer.set(gameState.activePlayer);
    this.closeEditThrow();
  }

  protected saveShortcuts(shortcuts: Shortcut[]): void {
    this.shortcuts.set(shortcuts);
    localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(shortcuts));
    this.settingsOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (this.settingsOpen() || this.editingThrowId() !== null || this.pendingCheckout() !== null || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      this.appendDigit(event.key);
      return;
    }

    if (event.key === 'Enter') {
      this.submitInput();
      return;
    }

    if (event.key === 'Escape') {
      this.clearInput();
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      this.undo();
      return;
    }

    const shortcut = this.shortcuts().find((item) => item.key.toLowerCase() === event.key.toLowerCase());
    if (shortcut) {
      event.preventDefault();
      this.addScore(shortcut.score);
    }
  }

  private loadShortcuts(): Shortcut[] {
    try {
      const stored = localStorage.getItem(SHORTCUT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SHORTCUTS;
    } catch {
      return DEFAULT_SHORTCUTS;
    }
  }

  private recordThrow(score: number, player: number, darts: number, doubleAttempts?: number): void {
    this.playerScores.update((scores) => scores.map((remaining, index) => index === player ? remaining - score : remaining) as [number, number]);
    this.throws.update((throws) => [{ id: this.nextThrowId++, score, at: new Date(), player, darts, doubleAttempts }, ...throws]);
  }

  private recalculateGame(throwsNewestFirst: Throw[]): { scores: [number, number]; activePlayer: number } | null {
    const scores: [number, number] = [this.startScore, this.startScore];
    const chronologicalThrows = throwsNewestFirst.slice().reverse();
    let activePlayer = 0;

    for (let index = 0; index < chronologicalThrows.length; index += 1) {
      const throwItem = chronologicalThrows[index];
      if (throwItem.player !== activePlayer || throwItem.score > scores[throwItem.player]) return null;

      scores[throwItem.player] -= throwItem.score;
      if (scores[throwItem.player] === 1) return null;
      if (scores[throwItem.player] === 0) {
        return index === chronologicalThrows.length - 1 ? { scores, activePlayer: throwItem.player } : null;
      }

      activePlayer = activePlayer === 0 ? 1 : 0;
    }

    return { scores, activePlayer };
  }

}
