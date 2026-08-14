import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Shortcut } from '../shared/scoreboard.models';

@Component({
  selector: 'app-hotkey-settings',
  imports: [FormsModule],
  templateUrl: './hotkey-settings.html',
  styleUrl: './hotkey-settings.scss',
})
export class HotkeySettingsComponent {
  readonly shortcuts = input.required<Shortcut[]>();
  readonly close = output<void>();
  readonly save = output<Shortcut[]>();
  protected readonly draftShortcuts = signal<Shortcut[]>([]);

  constructor() {
    effect(() => {
      this.draftShortcuts.set(this.shortcuts().map((shortcut) => ({ ...shortcut })));
    });
  }

  protected updateShortcut(index: number, field: keyof Shortcut, value: string): void {
    this.draftShortcuts.update((shortcuts) => shortcuts.map((shortcut, currentIndex) => {
      if (currentIndex !== index) return shortcut;
      return field === 'score'
        ? { ...shortcut, score: Number(value) }
        : { ...shortcut, key: value.slice(-1).toUpperCase() };
    }));
  }

  protected addShortcut(): void {
    this.draftShortcuts.update((shortcuts) => [...shortcuts, { key: '', score: 60 }]);
  }

  protected removeShortcut(index: number): void {
    this.draftShortcuts.update((shortcuts) => shortcuts.filter((_, currentIndex) => currentIndex !== index));
  }

  protected saveShortcuts(): void {
    const validShortcuts = this.draftShortcuts().filter((shortcut) => shortcut.key && Number.isInteger(shortcut.score) && shortcut.score >= 0 && shortcut.score <= 180);
    this.save.emit(validShortcuts);
  }
}
