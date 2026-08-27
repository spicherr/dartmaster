import { Component, HostListener, computed, signal } from '@angular/core';
import { SCOREBOARD_CONFIG } from '../config/scoreboard.config';
import { Throw } from '../shared/scoreboard.models';

interface ThrowCell {
  id: number;
  score: number;
}

interface ThrowRow {
  round: number;
  scores: [ThrowCell | null, ThrowCell | null];
}

interface ThrowHistoryRow extends ThrowRow {
  remaining: [number | null, number | null];
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

interface CheckoutDartOption {
  darts: number;
  maxDoubleAttempts: number;
}

interface PendingMissedCheckout {
  throwId: number;
  player: number;
  score: number;
  maxDoubleAttempts: number;
}

@Component({
  selector: 'app-scoreboard',
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
  protected readonly completedLegThrows = signal<Throw[]>([]);
  protected readonly currentLeg = signal(1);
  protected readonly legStartingPlayer = signal(0);
  protected readonly legWins = signal<[number, number]>([0, 0]);
  protected readonly bestOfLegs = SCOREBOARD_CONFIG.bestOfLegs;
  protected readonly legsToWin = Math.ceil(this.bestOfLegs / 2);
  protected readonly hotkeyScores = SCOREBOARD_CONFIG.hotkeyScores;
  protected readonly editingThrowId = signal<number | null>(null);
  protected readonly editScoreInput = signal('');
  protected readonly editError = signal<string | null>(null);
  protected readonly pendingCheckout = signal<PendingCheckout | null>(null);
  protected readonly checkoutDarts = signal(3);
  protected readonly checkoutDoubleAttempts = signal(1);
  protected readonly pendingMissedCheckout = signal<PendingMissedCheckout | null>(null);
  protected readonly missedCheckoutDoubleAttempts = signal<number | null>(null);
  protected readonly remaining = computed(() => this.playerScores()[this.activePlayer()]);
  protected readonly matchWinner = computed(() => {
    const winnerIndex = this.legWins().findIndex((wins) => wins >= this.legsToWin);
    return winnerIndex === -1 ? null : winnerIndex;
  });
  protected readonly entryDisabled = computed(() => this.matchWinner() !== null || this.pendingCheckout() !== null || this.pendingMissedCheckout() !== null);
  protected readonly hasRestScoreInput = computed(() => Number(this.scoreInput()) > 0);
  protected readonly checkoutAvailable = computed(() => this.isThreeDartCheckout(this.remaining()));
  protected readonly checkoutDartOptions = computed<CheckoutDartOption[]>(() => {
    const checkout = this.pendingCheckout();
    if (!checkout) return [];

    const minimumDarts = this.minimumCheckoutDarts(checkout.score);
    if (minimumDarts === null) return [];

    return [1, 2, 3]
      .filter((darts) => darts >= minimumDarts)
      .map((darts) => ({ darts, maxDoubleAttempts: darts - minimumDarts + 1 }));
  });
  protected readonly setLegScores = computed<[string, string]>(() => this.legWins().map((wins) => `0 / ${wins}`) as [string, string]);
  protected readonly playerStats = computed(() => this.calculateStats(this.throws()));
  protected readonly gameStats = computed(() => this.calculateStats([...this.completedLegThrows(), ...this.throws()]));
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
  protected readonly throwHistoryRows = computed<ThrowHistoryRow[]>(() => {
    const remainingScores: [number, number] = [this.startScore, this.startScore];

    return this.throwRows().map((throwRow) => {
      const remaining: [number | null, number | null] = [null, null];
      for (const player of [0, 1] as const) {
        const throwItem = throwRow.scores[player];
        if (!throwItem) continue;
        remainingScores[player] -= throwItem.score;
        remaining[player] = remainingScores[player];
      }
      return { ...throwRow, remaining };
    });
  });
  protected readonly winner = computed(() => this.matchWinner());
  protected readonly isFinished = computed(() => this.matchWinner() !== null);

  protected addScore(value: string | number): void {
    const score = typeof value === 'number' ? value : Number(value);
    if (!Number.isInteger(score) || score < 0 || this.entryDisabled()) return;
    if (score > 180) {
      this.inputMessage.set('Fehler: Eine Aufnahme darf maximal 180 Punkte betragen.');
      this.scoreInput.set('');
      return;
    }

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

    const throwId = this.recordThrow(score, player, 3);
    this.activePlayer.set(player === 0 ? 1 : 0);
    this.scoreInput.set('');
    this.inputMessage.set(null);
    if (remainingAfterThrow <= 50) {
      this.pendingMissedCheckout.set({
        throwId,
        player,
        score: remainingBeforeThrow,
        maxDoubleAttempts: this.maximumDoubleAttemptsForScore(score),
      });
      this.missedCheckoutDoubleAttempts.set(null);
    }
  }

  protected setCheckoutDarts(darts: number): void {
    const option = this.checkoutOption(darts);
    if (!option) return;
    this.checkoutDarts.set(darts);
    if (this.checkoutDoubleAttempts() > option.maxDoubleAttempts) this.checkoutDoubleAttempts.set(option.maxDoubleAttempts);
  }

  protected setCheckoutDoubleAttempts(attempts: number): void {
    const option = this.checkoutOption(this.checkoutDarts());
    if (option && attempts >= 1 && attempts <= option.maxDoubleAttempts) this.checkoutDoubleAttempts.set(attempts);
  }

  protected closeCheckout(): void {
    this.pendingCheckout.set(null);
  }

  protected setMissedCheckoutDoubleAttempts(attempts: number): void {
    const missedCheckout = this.pendingMissedCheckout();
    if (missedCheckout && attempts >= 0 && attempts <= missedCheckout.maxDoubleAttempts) this.missedCheckoutDoubleAttempts.set(attempts);
  }

  protected saveMissedCheckoutDoubleAttempts(): void {
    const missedCheckout = this.pendingMissedCheckout();
    const attempts = this.missedCheckoutDoubleAttempts();
    if (!missedCheckout || attempts === null) return;

    this.throws.update((throws) => throws.map((throwItem) =>
      throwItem.id === missedCheckout.throwId ? { ...throwItem, doubleAttempts: attempts } : throwItem,
    ));
    this.pendingMissedCheckout.set(null);
    this.missedCheckoutDoubleAttempts.set(null);
  }

  protected saveCheckout(): void {
    const checkout = this.pendingCheckout();
    const darts = this.checkoutDarts();
    const doubleAttempts = this.checkoutDoubleAttempts();
    const option = this.checkoutOption(darts);
    if (!checkout || !option || doubleAttempts < 1 || doubleAttempts > option.maxDoubleAttempts) return;

    this.recordThrow(checkout.score, checkout.player, darts, doubleAttempts);
    const updatedLegWins = this.legWins().map((wins, player) => player === checkout.player ? wins + 1 : wins) as [number, number];
    this.legWins.set(updatedLegWins);
    this.activePlayer.set(checkout.player);
    this.pendingCheckout.set(null);
    this.pendingMissedCheckout.set(null);
    this.missedCheckoutDoubleAttempts.set(null);

    if (updatedLegWins[checkout.player] >= this.legsToWin) return;

    this.completedLegThrows.update((throws) => [...throws, ...this.throws()]);
    this.startNextLeg();
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

  protected submitRemainingScore(): void {
    if (this.entryDisabled()) return;

    if (!this.scoreInput()) {
      this.inputMessage.set('Fehler: Bitte den gewünschten Restscore eingeben.');
      return;
    }

    const targetRemaining = Number(this.scoreInput());
    const score = this.remaining() - targetRemaining;
    if (score > 180) {
      this.inputMessage.set('Fehler: Die daraus berechnete Aufnahme ist höher als 180 Punkte.');
      return;
    }
    if (score < 0) {
      this.inputMessage.set('Fehler: Der gewünschte Restscore ist höher als der aktuelle Restwert.');
      return;
    }
    if (targetRemaining <= 1) {
      this.inputMessage.set('Fehler: Restwert 1 oder 0 ist nicht möglich – bitte CHECKOUT verwenden.');
      return;
    }

    this.scoreInput.set(String(score));
    this.submitInput();
  }

  protected startCheckout(): void {
    if (!this.checkoutAvailable() || this.entryDisabled()) return;
    this.addScore(this.remaining());
  }

  protected activateShortcut(index: number): void {
    const score = this.hotkeyScores[index];
    if (score === undefined) return;
    this.addScore(score);
  }

  protected shortcutScore(index: number): number | null {
    return this.hotkeyScores[index] ?? null;
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
    this.completedLegThrows.set([]);
    this.scoreInput.set('');
    this.inputMessage.set(null);
    this.pendingCheckout.set(null);
    this.currentLeg.set(1);
    this.legStartingPlayer.set(0);
    this.legWins.set([0, 0]);
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

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (this.editingThrowId() !== null || this.pendingCheckout() !== null || event.ctrlKey || event.metaKey || event.altKey) return;
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

  }

  private recordThrow(score: number, player: number, darts: number, doubleAttempts?: number): number {
    const id = this.nextThrowId++;
    this.playerScores.update((scores) => scores.map((remaining, index) => index === player ? remaining - score : remaining) as [number, number]);
    this.throws.update((throws) => [{ id, score, at: new Date(), player, darts, doubleAttempts }, ...throws]);
    return id;
  }

  private recalculateGame(throwsNewestFirst: Throw[]): { scores: [number, number]; activePlayer: number } | null {
    const scores: [number, number] = [this.startScore, this.startScore];
    const chronologicalThrows = throwsNewestFirst.slice().reverse();
    let activePlayer = this.legStartingPlayer();

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

  private startNextLeg(): void {
    this.currentLeg.update((leg) => leg + 1);
    const startingPlayer = 0;
    this.legStartingPlayer.set(startingPlayer);
    this.playerScores.set([this.startScore, this.startScore]);
    this.activePlayer.set(startingPlayer);
    this.throws.set([]);
    this.scoreInput.set('');
    this.inputMessage.set(null);
    this.pendingMissedCheckout.set(null);
    this.missedCheckoutDoubleAttempts.set(null);
  }

  private isThreeDartCheckout(score: number): boolean {
    return this.minimumCheckoutDarts(score) !== null;
  }

  protected checkoutOption(darts: number): CheckoutDartOption | null {
    return this.checkoutDartOptions().find((option) => option.darts === darts) ?? null;
  }

  private minimumCheckoutDarts(score: number): number | null {
    if (score < 2 || score > 170) return null;

    const scoringDarts = new Set<number>([25, 50]);
    const finishingDarts = new Set<number>([50]);
    for (let number = 1; number <= 20; number += 1) {
      scoringDarts.add(number);
      scoringDarts.add(number * 2);
      scoringDarts.add(number * 3);
      finishingDarts.add(number * 2);
    }

    for (const finishingDart of finishingDarts) {
      if (finishingDart === score) return 1;
    }
    for (const scoringDart of scoringDarts) {
      for (const finishingDart of finishingDarts) {
        if (scoringDart + finishingDart === score) return 2;
      }
    }
    for (const firstDart of scoringDarts) {
      for (const secondDart of scoringDarts) {
        for (const finishingDart of finishingDarts) {
          if (firstDart + secondDart + finishingDart === score) return 3;
        }
      }
    }

    return null;
  }

  private maximumDoubleAttemptsForScore(score: number): number {
    return 3 - this.minimumDartsForScore(score);
  }

  private minimumDartsForScore(score: number): number {
    if (score === 0) return 0;

    const dartScores = new Set<number>([0, 25, 50]);
    for (let number = 1; number <= 20; number += 1) {
      dartScores.add(number);
      dartScores.add(number * 2);
      dartScores.add(number * 3);
    }

    if (dartScores.has(score)) return 1;
    for (const firstDart of dartScores) {
      for (const secondDart of dartScores) {
        if (firstDart + secondDart === score) return 2;
      }
    }

    return 3;
  }

  private calculateStats(throws: Throw[]): [PlayerStats, PlayerStats] {
    return [0, 1].map((player) => {
      const playerThrows = throws.filter((throwItem) => throwItem.player === player);
      const total = playerThrows.reduce((sum, throwItem) => sum + throwItem.score, 0);
      const dartCount = playerThrows.reduce((sum, throwItem) => sum + throwItem.darts, 0);
      return {
        dartCount,
        average: dartCount ? ((total * 3) / dartCount).toFixed(1) : '0.0',
        lastThrow: playerThrows[0]?.score ?? null,
      };
    }) as [PlayerStats, PlayerStats];
  }

}
