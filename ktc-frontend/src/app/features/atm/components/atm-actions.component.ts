import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AtmActionDto, AtmService } from '../services/atm.service';
import { formatCommandDisplayLabel } from '../remote-toolbar-commands';

@Component({
  selector: 'app-atm-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './atm-actions.component.html',
  styleUrls: ['./atm-actions.component.css']
})
export class AtmActionsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly atmService = inject(AtmService);

  readonly clientId = signal<number | null>(null);

  /** Fenêtre mobile comme l’outil desktop (jours glissants) */
  readonly days = signal(7);

  /** Filtre « Added by User » ; chaîne vide = tous */
  readonly addedByUser = signal('');

  /** Utilisateurs distincts présents dans la fenêtre (XML comments → User) */
  readonly addedByUsers = signal<string[]>([]);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rows = signal<AtmActionDto[]>([]);

  readonly isEmpty = computed(() => !this.isLoading() && !this.error() && this.rows().length === 0);

  ngOnInit(): void {
    const idStr = this.route.parent?.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('id');
    this.clientId.set(idStr ? Number(idStr) : null);

    this.refresh();
  }

  bumpDays(delta: number): void {
    const n = Math.min(365, Math.max(1, this.days() + delta));
    this.days.set(n);
  }

  onDaysInput(ev: Event): void {
    const v = Number((ev.target as HTMLInputElement).value);
    if (!Number.isFinite(v)) return;
    this.days.set(Math.min(365, Math.max(1, Math.round(v))));
  }

  onUserFilterChange(ev: Event): void {
    const v = (ev.target as HTMLSelectElement).value;
    this.addedByUser.set(v);
  }

  /** Libellé sans préfixe ktc_ (aligné sur le menu Actions distantes). */
  displayCommandLabel(name: string): string {
    return formatCommandDisplayLabel(name);
  }

  /** Tolère JSON camelCase ou PascalCase depuis l’API. */
  private normalizeActionRow(x: Record<string, unknown>): AtmActionDto {
    const pick = (a: string, b: string): string | null => {
      const v = x[a] ?? x[b];
      if (v == null || v === '') return null;
      const t = String(v).trim();
      return t === '' ? null : t;
    };
    return {
      actionId: Number(x['actionId'] ?? x['ActionId'] ?? 0),
      user: pick('user', 'User') ?? '',
      command: pick('command', 'Command') ?? '',
      status: pick('status', 'Status') ?? '',
      addedTime: pick('addedTime', 'AddedTime'),
      started: pick('started', 'Started'),
      finished: pick('finished', 'Finished'),
      lastComment: pick('lastComment', 'LastComment') ?? '',
    };
  }

  refresh(): void {
    const id = this.clientId();
    if (!id) return;

    this.isLoading.set(true);
    this.error.set(null);

    const user = this.addedByUser().trim();
    this.atmService
      .getClientActions(id, {
        days: this.days(),
        addedByUser: user ? user : undefined
      })
      .subscribe({
        next: (res) => {
          const items = (res.items ?? []).map((r) => this.normalizeActionRow(r as unknown as Record<string, unknown>));
          this.rows.set(items);
          this.addedByUsers.set(res.addedByUsers ?? []);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set("Erreur lors du chargement des Actions.");
          this.isLoading.set(false);
        }
      });
  }
}
