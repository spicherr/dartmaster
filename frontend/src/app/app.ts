import { Component } from '@angular/core';
import { ScoreboardComponent } from './scoreboard/scoreboard';

@Component({
  selector: 'app-root',
  imports: [ScoreboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
