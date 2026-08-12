import { Component, HostListener, computed, signal } from '@angular/core';
import { HotkeySettingsComponent } from '../hotkey-settings/hotkey-settings';
import { DEFAULT_SHORTCUTS, Shortcut, Throw } from '../shared/scoreboard.models';

const SHORTCUT_STORAGE_KEY = 'dartmaster.shortcuts';

interface ThrowRow {
  round: number;
  scores: [number | null, number | null];
}

@Component({
  selector: 'app-scoreboard',
  imports: [HotkeySettingsComponent],
  templateUrl: './scoreboard.html',
  styleUrl: './scoreboard.scss',
})
export class ScoreboardComponent {
  protected readonly startScore = 501;
  protected readonly players = ['Spieler 1', 'Spieler 2'];
  protected readonly playerScores = signal<[number, number]>([this.startScore, this.startScore]);
  protected readonly activePlayer = signal(0);
  protected readonly scoreInput = signal('');
  protected readonly throws = signal<Throw[]>([]);
  protected readonly shortcuts = signal<Shortcut[]>(this.loadShortcuts());
  protected readonly settingsOpen = signal(false);
  protected readonly remaining = computed(() => this.playerScores()[this.activePlayer()]);
  protected readonly throwRows = computed<ThrowRow[]>(() => {
    const rows: ThrowRow[] = [];
    const playerThrowCounts: [number, number] = [0, 0];

    for (const throwItem of this.throws().slice().reverse()) {
      playerThrowCounts[throwItem.player] += 1;
      const round = playerThrowCounts[throwItem.player];
      const existingRow = rows[round - 1] ?? { round, scores: [null, null] };

      existingRow.scores[throwItem.player] = throwItem.score;
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
    if (!Number.isInteger(score) || score < 0 || score > 180 || this.isFinished()) return;

    const remainingBeforeThrow = this.remaining();
    if (score > remainingBeforeThrow) {
      this.scoreInput.set('');
      return;
    }

    const player = this.activePlayer();
    this.playerScores.update((scores) => scores.map((remaining, index) => index === player ? remaining - score : remaining) as [number, number]);
    this.throws.update((throws) => [{ score, at: new Date(), player }, ...throws]);
    if (remainingBeforeThrow - score > 0) this.activePlayer.set(player === 0 ? 1 : 0);
    this.scoreInput.set('');
  }

  protected appendDigit(digit: string): void {
    if (this.isFinished()) return;
    const nextValue = `${this.scoreInput()}${digit}`.replace(/^0+(?=\d)/, '').slice(0, 3);
    const score = Number(nextValue);
    if (!Number.isInteger(score) || score > 180) return;
    this.scoreInput.set(nextValue);
  }

  protected submitInput(): void {
    if (!this.scoreInput()) return;
    this.addScore(this.scoreInput());
  }

  protected clearInput(): void {
    this.scoreInput.set('');
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
  }

  protected reset(): void {
    this.playerScores.set([this.startScore, this.startScore]);
    this.activePlayer.set(0);
    this.throws.set([]);
    this.scoreInput.set('');
  }

  protected saveShortcuts(shortcuts: Shortcut[]): void {
    this.shortcuts.set(shortcuts);
    localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(shortcuts));
    this.settingsOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (this.settingsOpen() || event.ctrlKey || event.metaKey || event.altKey) return;
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
}
