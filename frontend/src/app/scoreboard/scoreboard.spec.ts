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

  it('alternates turns after a score is entered', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['addScore'](60);

    expect(scoreboard['playerScores']()).toEqual([441, 501]);
    expect(scoreboard['activePlayer']()).toBe(1);
  });

  it('groups throw history by player throw number', () => {
    const fixture = TestBed.createComponent(ScoreboardComponent);
    const scoreboard = fixture.componentInstance;

    scoreboard['addScore'](60);
    scoreboard['addScore'](45);
    scoreboard['addScore'](100);

    expect(scoreboard['throwRows']()).toEqual([
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
    expect(scoreboard['throwRows']()).toEqual([{ round: 1, scores: [0, null] }]);
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

    expect(scoreboard['winner']()).toBe(0);
    expect(scoreboard['activePlayer']()).toBe(0);
  });
});
