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

  it('keeps the winning player active after checkout', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['addScore'](180);
    scoreboard['addScore'](0);
    scoreboard['addScore'](180);
    scoreboard['addScore'](0);
    scoreboard['addScore'](141);

    expect(scoreboard['pendingCheckout']()).toEqual({ player: 0, score: 141 });
    scoreboard['setCheckoutDarts'](2);
    scoreboard['setCheckoutDoubleAttempts'](2);
    scoreboard['saveCheckout']();

    expect(scoreboard['winner']()).toBe(0);
    expect(scoreboard['activePlayer']()).toBe(0);
    expect(scoreboard['playerStats']()[0]).toEqual({ dartCount: 8, average: '187.9', lastThrow: 141 });
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
  return scoreboard['throwRows']().map((row) => ({
    round: row.round,
    scores: row.scores.map((score) => score?.score ?? null),
  }));
}
