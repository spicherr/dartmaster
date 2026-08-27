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
