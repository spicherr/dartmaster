import { Component, computed, input, signal } from '@angular/core';
import { Throw } from '../shared/scoreboard.models';

export interface DoubleRate {
  percentage: string;
  hits: number;
  attempts: number;
}

export interface LegResult {
  number: number;
  throws: Throw[];
  players: Array<{ average: string; dartCount: number; doubleRate: DoubleRate; remaining: number; checkout: number | null }>;
}

@Component({
  selector: 'app-game-statistics',
  templateUrl: './game-statistics.html',
  styleUrl: './game-statistics.scss',
})
export class GameStatisticsComponent {
  readonly selectedTab = signal(0);
  readonly tabs = computed(() => [0, ...this.legResults().map((leg) => leg.number)]);
  readonly rows = computed(() => {
    const leg = this.legResults().find((item) => item.number === this.selectedTab());
    const legs = leg ? [leg] : this.legResults();
    const stats = this.players().map((_, player) => {
      const playerLegs = legs.map((item) => item.players[player]);
      const throws = legs.flatMap((item) => item.throws.filter((dart) => dart.player === player));
      let firstPoints = 0;
      let firstDarts = 0;
      for (const item of legs) {
        const opening = item.throws.filter((dart) => dart.player === player).slice().reverse().slice(0, 3);
        firstPoints += opening.reduce((sum, dart) => sum + dart.score, 0);
        firstDarts += opening.reduce((sum, dart) => sum + dart.darts, 0);
      }
      const hits = playerLegs.reduce((sum, item) => sum + item.doubleRate.hits, 0);
      const attempts = playerLegs.reduce((sum, item) => sum + item.doubleRate.attempts, 0);
      const darts = throws.reduce((sum, item) => sum + item.darts, 0);
      const points = throws.reduce((sum, item) => sum + item.score, 0);
      return {
        average: darts ? (points * 3 / darts).toFixed(1) : '0.0',
        firstAverage: firstDarts ? (firstPoints * 3 / firstDarts).toFixed(1) : '0.0',
        rate: attempts ? `${(hits * 100 / attempts).toFixed(1)}%` : '–',
        checkouts: `${hits} / ${attempts}`,
        highestFinish: Math.max(0, ...playerLegs.map((item) => item.checkout ?? 0)),
        highestScore: Math.max(0, ...throws.map((item) => item.score)),
        darts, hits, attempts, throws,
      };
    });
    const row = (label: string, values: Array<string | number>, scores = values.map((value) => {
      const parsed = Number.parseFloat(String(value));
      return Number.isFinite(parsed) ? parsed : null;
    })) => {
      const [left, right] = scores;
      return { label, values, better: [
        left !== null && right !== null && left > right,
        left !== null && right !== null && right > left,
      ] };
    };
    const checkoutScores = stats[0].hits !== stats[1].hits
      ? stats.map((item) => item.hits)
      : stats.map((item) => item.hits > 0 ? -item.attempts : 0);
    return [
      row('3-Dart AVG', stats.map((item) => item.average)),
      row('First 9-Darts AVG', stats.map((item) => item.firstAverage)),
      row('CHECKOUT in %', stats.map((item) => item.rate)),
      row('CHECKOUTS', stats.map((item) => item.checkouts), checkoutScores),
      row('Höchstes Finish', stats.map((item) => item.highestFinish || '–'), stats.map((item) => item.highestFinish)),
      row('Höchste Aufnahme', stats.map((item) => item.highestScore)),
      row('Anzahl Darts', stats.map((item) => item.darts), [null, null]),
      ...[180, 160, 140, 120, 100, 80, 60, 40].map((minimum) =>
        row(minimum === 180 ? '180' : `${minimum}+`, stats.map((item) =>
          item.throws.filter((dart) => dart.score >= minimum && dart.score < (minimum === 180 ? 181 : minimum + 20)).length)),
      ),
    ];
  });

  onTabKey(event: KeyboardEvent, tab: number): void {
    const tabs = this.tabs();
    const index = tabs.indexOf(tab);
    let next: number;
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % tabs.length; break;
      case 'ArrowLeft': next = (index - 1 + tabs.length) % tabs.length; break;
      case 'Home': next = 0; break;
      case 'End': next = tabs.length - 1; break;
      default: return;
    }
    event.preventDefault();
    this.selectedTab.set(tabs[next]);
    const list = (event.currentTarget as HTMLElement).parentElement;
    list?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  readonly players = input.required<string[]>();
  readonly legWins = input.required<number[]>();
  readonly winner = input.required<number>();
  readonly legResults = input.required<LegResult[]>();
}
