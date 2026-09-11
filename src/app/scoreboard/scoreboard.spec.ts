import { TestBed } from '@angular/core/testing';
import { ScoreboardComponent } from './scoreboard';

describe('ScoreboardComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ScoreboardComponent],
    }).compileComponents();
  });

  it('starts a 501 game', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    expect(fixture.componentInstance['remaining']()).toBe(501);
  });

  it('uses the fixed hotkey configuration', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    expect(Array.from(scoreboard['hotkeyScores'])).toEqual([26, 40, 41, 43, 45, 60, 81, 85, 100, 140]);
    expect(scoreboard['bestOfLegs']).toBe(3);
    expect(scoreboard['currentLeg']()).toBe(1);
  });

  it('alternates turns after a score is entered', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['addScore'](60);

    expect(scoreboard['playerScores']()).toEqual([441, 501]);
    expect(scoreboard['activePlayer']()).toBe(1);
  });

  it('calculates player throw statistics', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['addScore'](60);
    scoreboard['addScore'](45);
    scoreboard['addScore'](100);

    expect(scoreboard['playerStats']()).toEqual([
      { dartCount: 6, average: '80.0', lastThrow: 100 },
      { dartCount: 3, average: '45.0', lastThrow: 45 },
    ]);
  });

  it('groups throw history by player throw number', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['addScore'](60);
    scoreboard['addScore'](45);
    scoreboard['addScore'](100);

    expect(scoreRows(scoreboard)).toEqual([
      { round: 1, scores: [60, 45] },
      { round: 2, scores: [100, null] },
    ]);
  });

  it('shows each player score and remaining score in the history', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['addScore'](100);
    scoreboard['addScore'](120);
    scoreboard['addScore'](180);
    scoreboard['addScore'](60);

    expect(scoreboard['throwHistoryRows']().map((row) => row.remaining)).toEqual([
      [401, 381],
      [221, 321],
    ]);
  });

  it('shows only the three most recent throw rounds', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['addScore'](100);
    scoreboard['addScore'](120);
    scoreboard['addScore'](180);
    scoreboard['addScore'](60);

    scoreboard['addScore'](20);
    scoreboard['addScore'](40);
    scoreboard['addScore'](10);

    expect(scoreboard['recentThrowHistoryRows']().map((row) => ({
      round: row.round,
      scores: row.scores.map((score) => score?.score ?? null),
    }))).toEqual([
      { round: 2, scores: [180, 60] },
      { round: 3, scores: [20, 40] },
      { round: 4, scores: [10, null] },
    ]);
  });

  it('submits a miss as zero without typed input', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['noScore']();

    expect(scoreboard['playerScores']()).toEqual([501, 501]);
    expect(scoreboard['activePlayer']()).toBe(1);
    expect(scoreRows(scoreboard)).toEqual([{ round: 1, scores: [0, null] }]);
  });

  it('uses back to undo the last throw when no score is being entered', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['addScore'](60);
    scoreboard['clearOrUndo']();

    expect(scoreboard['throws']()).toEqual([]);
    expect(scoreboard['playerScores']()).toEqual([501, 501]);
    expect(scoreboard['activePlayer']()).toBe(0);
  });

  it('uses clear to empty a score being entered', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['appendDigit']('6');
    scoreboard['clearOrUndo']();

    expect(scoreboard['scoreInput']()).toBe('');
    expect(scoreboard['throws']()).toEqual([]);
  });

  it('submits typed touchscreen digits', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['appendDigit']('1');
    scoreboard['appendDigit']('4');
    scoreboard['appendDigit']('0');
    scoreboard['submitInput']();

    expect(scoreboard['playerScores']()).toEqual([361, 501]);
    expect(scoreboard['scoreInput']()).toBe('');
  });

  it('uses the 180 key as zero after typing starts', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['submitDynamicZeroOr180']();
    scoreboard['appendDigit']('1');
    scoreboard['submitDynamicZeroOr180']();
    scoreboard['submitInput']();

    expect(scoreboard['playerScores']()).toEqual([321, 491]);
  });

  it('submits the score needed to reach the entered remaining score', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['addScore'](180);
    scoreboard['addScore'](180);
    scoreboard['addScore'](141);
    scoreboard['addScore'](141);
    scoreboard['appendDigit']('6');
    scoreboard['appendDigit']('0');
    scoreboard['submitRemainingScore']();

    expect(scoreboard['playerScores']()).toEqual([60, 180]);
    expect(scoreboard['activePlayer']()).toBe(1);
    expect(scoreboard['pendingCheckout']()).toBeNull();
  });

  it('rejects a remaining-score entry that would require more than 180 points', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['appendDigit']('1');
    scoreboard['appendDigit']('8');
    scoreboard['appendDigit']('0');
    scoreboard['submitRemainingScore']();

    expect(scoreboard['inputMessage']()).toBe('Fehler: Die daraus berechnete Aufnahme ist höher als 180 Punkte.');
    expect(scoreboard['throws']()).toEqual([]);
  });

  it('rejects a remaining-score entry of one or zero', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['playerScores'].set([100, 501]);
    scoreboard['appendDigit']('1');
    scoreboard['submitRemainingScore']();

    expect(scoreboard['inputMessage']()).toBe('Fehler: Restwert 1 oder 0 ist nicht möglich – bitte CHECKOUT verwenden.');
    expect(scoreboard['playerScores']()).toEqual([100, 501]);
  });

  it('offers a checkout only for a possible three-dart finish', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['playerScores'].set([170, 501]);
    expect(scoreboard['checkoutAvailable']()).toBe(true);

    scoreboard['playerScores'].set([169, 501]);
    expect(scoreboard['checkoutAvailable']()).toBe(false);
  });

  it('starts the checkout dialog from the checkout button', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['playerScores'].set([170, 501]);
    scoreboard['startCheckout']();

    expect(scoreboard['pendingCheckout']()).toEqual({ player: 0, score: 170 });
  });

  it('records double attempts after a missed checkout', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['playerScores'].set([52, 501]);
    scoreboard['addScore'](20);

    expect(scoreboard['playerScores']()).toEqual([32, 501]);
    expect(scoreboard['pendingMissedCheckout']()).toMatchObject({ player: 0, score: 52, maxDoubleAttempts: 2 });
    expect(scoreboard['missedCheckoutDoubleAttempts']()).toBeNull();

    scoreboard['setMissedCheckoutDoubleAttempts'](2);
    scoreboard['saveMissedCheckoutDoubleAttempts']();

    expect(scoreboard['pendingMissedCheckout']()).toBeNull();
    expect(scoreboard['throws']()[0].doubleAttempts).toBe(2);
  });

  it('does not ask for double attempts when the resulting score is above 50', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['playerScores'].set([141, 501]);
    scoreboard['addScore'](57);

    expect(scoreboard['playerScores']()).toEqual([84, 501]);
    expect(scoreboard['pendingMissedCheckout']()).toBeNull();
  });

  it('allows at most one double attempt when 141 is reduced into the double range', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['playerScores'].set([141, 501]);
    scoreboard['addScore'](100);

    expect(scoreboard['pendingMissedCheckout']()).toMatchObject({ score: 141, maxDoubleAttempts: 1 });
    scoreboard['setMissedCheckoutDoubleAttempts'](2);
    expect(scoreboard['missedCheckoutDoubleAttempts']()).toBeNull();
  });

  it('limits double attempts by the darts needed for the scored value', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['playerScores'].set([83, 501]);
    scoreboard['addScore'](35);

    expect(scoreboard['playerScores']()).toEqual([48, 501]);
    expect(scoreboard['pendingMissedCheckout']()).toMatchObject({ score: 83, maxDoubleAttempts: 1 });
    scoreboard['setMissedCheckoutDoubleAttempts'](2);
    expect(scoreboard['missedCheckoutDoubleAttempts']()).toBeNull();
  });

  it('starts the next leg automatically after a checkout', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    finishLegForPlayerOne(scoreboard);

    expect(scoreboard['legWins']()).toEqual([1, 0]);
    expect(scoreboard['currentLeg']()).toBe(2);
    expect(scoreboard['playerScores']()).toEqual([501, 501]);
    expect(scoreboard['activePlayer']()).toBe(0);
    expect(scoreboard['winner']()).toBeNull();
    expect(scoreboard['playerStats']()[0]).toEqual({ dartCount: 0, average: '0.0', lastThrow: null });
    expect(scoreboard['gameStats']()[0]).toEqual({ dartCount: 9, average: '167.0', lastThrow: 141 });
  });

  it('limits a 141 checkout to three darts and one double attempt', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['pendingCheckout'].set({ player: 0, score: 141 });

    expect(scoreboard['checkoutDartOptions']()).toEqual([{ darts: 3, maxDoubleAttempts: 1 }]);
    scoreboard['setCheckoutDarts'](2);
    scoreboard['setCheckoutDoubleAttempts'](2);
    expect(scoreboard['checkoutDarts']()).toBe(3);
    expect(scoreboard['checkoutDoubleAttempts']()).toBe(1);
  });

  it('ends the match after a player wins two legs', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    finishLegForPlayerOne(scoreboard);
    finishLegForPlayerOne(scoreboard);

    expect(scoreboard['legWins']()).toEqual([2, 0]);
    expect(scoreboard['winner']()).toBe(0);
    expect(scoreboard['isFinished']()).toBe(true);
    expect(scoreboard['playerScores']()).toEqual([0, 501]);
  });

  it('shows the final statistics and starts a clean game from the header', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;
    finishLegForPlayerOne(scoreboard);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.statistics')).toBeNull();
    finishLegForPlayerOne(scoreboard);
    fixture.detectChanges();

    expect(scoreboard['legResults']().map((leg) => leg.players)).toEqual([
      [{ average: '167.0', dartCount: 9, doubleRate: { percentage: '100.0 %', hits: 1, attempts: 1 }, remaining: 0, checkout: 141 },
        { average: '0.0', dartCount: 6, doubleRate: { percentage: '–', hits: 0, attempts: 0 }, remaining: 501, checkout: null }],
      [{ average: '167.0', dartCount: 9, doubleRate: { percentage: '100.0 %', hits: 1, attempts: 1 }, remaining: 0, checkout: 141 },
        { average: '0.0', dartCount: 6, doubleRate: { percentage: '–', hits: 0, attempts: 0 }, remaining: 501, checkout: null }],
    ]);
    expect(Array.from(fixture.nativeElement.querySelectorAll('.result-score'), (node: any) => node.textContent.trim())).toEqual(['2', '0']);
    expect(fixture.nativeElement.querySelector('.result-player.winner').getAttribute('aria-label')).toContain('Spieler 1');
    expect(fixture.nativeElement.querySelectorAll('[role="tab"]').length).toBe(3);
    expect(Array.from(fixture.nativeElement.querySelectorAll('.statistic-line dt'), (node: any) => node.textContent.trim())).toEqual([
      '3-Dart AVG', 'First 9-Darts AVG', 'CHECKOUT in %', 'CHECKOUTS', 'Höchstes Finish', 'Höchste Aufnahme', 'Anzahl Darts',
      '180', '160+', '140+', '120+', '100+', '80+', '60+', '40+',
    ]);
    expect(fixture.nativeElement.querySelector('[data-stat="180"] .player-one').textContent.trim()).toBe('4');
    expect(fixture.nativeElement.querySelector('[data-stat="160+"] .player-one').textContent.trim()).toBe('0');
    expect(fixture.nativeElement.querySelector('[data-stat="140+"] .player-one').textContent.trim()).toBe('2');
    expect(fixture.nativeElement.querySelector('[data-stat="Höchstes Finish"] .player-one').textContent.trim()).toBe('141');
    expect(fixture.nativeElement.querySelector('[data-stat="Höchste Aufnahme"] .player-one').textContent.trim()).toBe('180');

    expect(fixture.nativeElement.querySelector('.statistic-line').getAttribute('data-stat')).toBe('3-Dart AVG');
    fixture.nativeElement.querySelector('#stats-tab-1').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#stats-tab-1').getAttribute('aria-selected')).toBe('true');
    expect(fixture.nativeElement.querySelector('.touch-entry')).toBeNull();
    scoreboard['onKeydown'](new KeyboardEvent('keydown', { key: 'Backspace' }));
    expect(scoreboard['playerScores']()).toEqual([0, 501]);
    const button = fixture.nativeElement.querySelector('header button');
    expect(button.textContent.trim()).toBe('Neues Spiel beginnen');
    expect(fixture.nativeElement.querySelector('.statistics').contains(button)).toBe(false);
    button.click();
    fixture.detectChanges();
    expect(scoreboard['legResults']()).toEqual([]);
    expect(scoreboard['legWins']()).toEqual([0, 0]);
    expect(scoreboard['playerScores']()).toEqual([501, 501]);
    expect(fixture.nativeElement.querySelector('.statistics')).toBeNull();
  });

  it('weights match averages and double rates by darts and attempts across all three legs', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;
    finishLegForPlayerOne(scoreboard);
    scoreboard['addScore'](0);
    scoreboard['addScore'](180);
    scoreboard['addScore'](0);
    scoreboard['addScore'](180);
    scoreboard['addScore'](0);
    scoreboard['addScore'](101);
    scoreboard['setMissedCheckoutDoubleAttempts'](1);
    scoreboard['saveMissedCheckoutDoubleAttempts']();
    scoreboard['addScore'](0);
    scoreboard['addScore'](40);
    scoreboard['setCheckoutDarts'](1);
    scoreboard['saveCheckout']();
    finishLegForPlayerOne(scoreboard);

    expect(scoreboard['legWins']()).toEqual([2, 1]);
    expect(scoreboard['legResults']().length).toBe(3);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-stat="First 9-Darts AVG"] .player-two').textContent.trim()).toBe('65.9');
    expect(fixture.nativeElement.querySelector('[data-stat="Höchste Aufnahme"] .better-value')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-stat="3-Dart AVG"] .player-one').classList.contains('better-value')).toBe(true);
    expect(fixture.nativeElement.querySelector('[data-stat="Höchstes Finish"] .player-two').classList.contains('better-value')).toBe(false);

    fixture.nativeElement.querySelector('#stats-tab-2').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-stat="CHECKOUTS"] .player-two').classList.contains('better-value')).toBe(true);
    expect(fixture.nativeElement.querySelector('[data-stat="CHECKOUTS"] .player-one').classList.contains('better-value')).toBe(false);
    expect(fixture.nativeElement.querySelector('[data-stat="3-Dart AVG"] .player-two').classList.contains('better-value')).toBe(true);
    expect(fixture.nativeElement.querySelector('[data-stat="160+"] .better-value')).toBeNull();

    expect(fixture.nativeElement.querySelector('[data-stat="First 9-Darts AVG"] .player-two').textContent.trim()).toBe('153.7');

    expect(scoreboard['legResults']()[1].players[1]).toEqual({
      average: '150.3', dartCount: 10, doubleRate: { percentage: '50.0 %', hits: 1, attempts: 2 }, remaining: 0, checkout: 40,
    });
    expect(scoreboard['gameStats']().map((stats) => stats.average)).toEqual(['100.2', '68.3']);
    expect(scoreboard['gameDoubleRates']()).toEqual([{ percentage: '100.0 %', hits: 2, attempts: 2 }, { percentage: '50.0 %', hits: 1, attempts: 2 }]);
  });

  it('shows checkout counts with the percentage, including no attempts', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;
    finishLegForPlayerOne(scoreboard);
    finishLegForPlayerOne(scoreboard);
    const result = scoreboard['doubleRate']([
      { id: 1, score: 40, at: new Date(), player: 0, darts: 3, doubleAttempts: 8 },
    ], 0, 1);
    expect(result).toEqual({ percentage: '12.5 %', hits: 1, attempts: 8 });
    scoreboard['legResults'].update((legs) => legs.map((leg) => ({
      ...leg, players: leg.players.map((stats, player) => player === 0 ? { ...stats, doubleRate: result } : stats),
    })));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('#stats-tab-1').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-stat="CHECKOUT in %"] .player-one').textContent).toContain('12.5%');
    expect(fixture.nativeElement.querySelector('[data-stat="CHECKOUTS"] .player-one').textContent.trim()).toBe('1 / 8');
    expect(fixture.nativeElement.querySelector('[data-stat="CHECKOUTS"] .player-two').textContent.trim()).toBe('0 / 0');
  });

  it('rejects a throw that would leave a remaining score of one', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['addScore'](180);
    scoreboard['addScore'](0);
    scoreboard['addScore'](180);
    scoreboard['addScore'](0);
    scoreboard['addScore'](140);

    expect(scoreboard['playerScores']()).toEqual([141, 501]);
    expect(scoreboard['activePlayer']()).toBe(0);
    expect(scoreboard['inputMessage']()).toContain('mit Doppel beendet');
  });

  it('edits a throw and recalculates the scores', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['addScore'](60);
    scoreboard['addScore'](45);
    const firstThrowId = scoreboard['throwRows']()[0].scores[0]!.id;
    scoreboard['openEditThrow'](firstThrowId);
    scoreboard['updateEditScore']('100');
    scoreboard['saveEditedThrow']();

    expect(scoreboard['playerScores']()).toEqual([401, 456]);
    expect(scoreRows(scoreboard)).toEqual([{ round: 1, scores: [100, 45] }]);
  });

  it('rejects an edited score outside the supported range', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['addScore'](180);
    scoreboard['addScore'](0);
    scoreboard['addScore'](100);
    const secondPlayerOneThrowId = scoreboard['throwRows']()[1].scores[0]!.id;
    scoreboard['openEditThrow'](secondPlayerOneThrowId);
    scoreboard['updateEditScore']('400');
    scoreboard['saveEditedThrow']();

    expect(scoreboard['editError']()).toBe('Bitte einen Wert von 0 bis 180 eingeben.');
    expect(scoreboard['playerScores']()).toEqual([221, 501]);
  });
});

function scoreRows(scoreboard: ScoreboardComponent): Array<{ round: number; scores: Array<number | null> }> {
  return scoreRowsFrom(scoreboard['throwRows']());
}

function scoreRowsFrom(rows: Array<{ round: number; scores: Array<{ score: number } | null> }>): Array<{ round: number; scores: Array<number | null> }> {
  return rows.map((row) => ({
    round: row.round,
    scores: row.scores.map((score) => score?.score ?? null),
  }));
}

function finishLegForPlayerOne(scoreboard: ScoreboardComponent): void {
  scoreboard['addScore'](180);
  scoreboard['addScore'](0);
  scoreboard['addScore'](180);
  scoreboard['addScore'](0);
  scoreboard['addScore'](141);
  scoreboard['setCheckoutDarts'](2);
  scoreboard['setCheckoutDoubleAttempts'](2);
  scoreboard['saveCheckout']();
}
