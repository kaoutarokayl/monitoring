import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AtmService, AtmScheduleDto, ClientAtm, CreateScheduleRequest, RemoteCommandTypeDto } from '../services/atm.service';
import { GroupService, Group } from '../../group/services/group.service';

/** Choix de fréquence proposés en chips */
export interface FrequencyOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-atm-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './atm-schedules.component.html',
  styleUrls: ['./atm-schedules.component.css']
})
export class AtmSchedulesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly atmService = inject(AtmService);
  private readonly groupService = inject(GroupService);

  // ── Data signals ───────────────────────────────────────────────
  readonly clientId  = signal<number | null>(null);
  readonly atm       = signal<ClientAtm | null>(null);
  readonly schedules = signal<AtmScheduleDto[]>([]);
  readonly groups    = signal<Group[]>([]);
  readonly commands  = signal<RemoteCommandTypeDto[]>([]);

  // ── UI state ───────────────────────────────────────────────────
  readonly isLoading      = signal(false);
  readonly error          = signal<string | null>(null);
  readonly createPaneOpen = signal(false);
  readonly createError    = signal<string | null>(null);
  readonly createSuccess  = signal<string | null>(null);

  // ── Form fields ────────────────────────────────────────────────
  readonly scheduleName      = signal('');
  readonly frequency         = signal('Once');
  readonly nextDue           = signal('');
  readonly selectedGroupId   = signal<number>(0);
  readonly selectedCommandId = signal<number>(0);
  readonly comments          = signal('');
  readonly performEveryTime  = signal(false);

  // ── Computed ───────────────────────────────────────────────────
  readonly hasSchedules    = computed(() => this.schedules().length > 0);
  readonly sortedSchedules = computed(() =>
    [...this.schedules()].sort((a, b) => a.nextDue.localeCompare(b.nextDue))
  );

  // ── Frequency chip options ─────────────────────────────────────
  readonly frequencyOptions: FrequencyOption[] = [
    { value: 'Once',      label: 'Une fois'      },
    { value: 'Hourly',    label: 'Toutes les heures' },
    { value: 'Daily',     label: 'Quotidien'     },
    { value: 'Weekly',    label: 'Hebdomadaire'  },
    { value: 'BiWeekly',  label: 'Bi-hebdomadaire' },
    { value: 'Monthly',   label: 'Mensuel'       },
    { value: 'Quarterly', label: 'Trimestriel'   },
    { value: 'Yearly',    label: 'Annuel'        },
  ];

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit(): void {
    const id = Number(
      this.route.parent?.snapshot.paramMap.get('id') ??
      this.route.snapshot.paramMap.get('id')
    );
    if (!Number.isFinite(id) || id <= 0) {
      this.error.set('ID ATM invalide.');
      return;
    }
    this.clientId.set(id);
    this.loadData(id);
  }

  loadData(clientId: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.createSuccess.set(null);

    this.atmService.getClientById(clientId).subscribe({
      next: (atm) => this.atm.set(atm),
      error: () => this.error.set('Impossible de charger les informations de l\'ATM.')
    });

    this.atmService.getClientSchedules(clientId).subscribe({
      next: (rows) => {
        this.schedules.set(rows ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les schedules.');
        this.isLoading.set(false);
      }
    });

    this.groupService.getAllGroups().subscribe({
      next: (rows) => this.groups.set(rows ?? []),
      error: () => { /* silent */ }
    });

    this.atmService.getRemoteCommandTypes().subscribe({
      next: (rows) => this.commands.set(rows ?? []),
      error: () => { /* silent */ }
    });
  }

  // ── Toggle builder ─────────────────────────────────────────────
  toggleCreatePane(): void {
    this.createPaneOpen.update((v) => !v);
    this.createError.set(null);
    this.createSuccess.set(null);
  }

  // ── Frequency chip handler ─────────────────────────────────────
  setFrequency(value: string): void {
    this.frequency.set(value);
  }

  // ── Form event handlers ────────────────────────────────────────
  onScheduleNameInput(event: Event): void {
    this.scheduleName.set((event.target as HTMLInputElement)?.value ?? '');
  }

  onGroupChange(event: Event): void {
    this.selectedGroupId.set(Number((event.target as HTMLSelectElement)?.value ?? '0'));
  }

  onCommandChange(event: Event): void {
    this.selectedCommandId.set(Number((event.target as HTMLSelectElement)?.value ?? '0'));
  }

  onFrequencyInput(event: Event): void {
    this.frequency.set((event.target as HTMLInputElement)?.value ?? '');
  }

  onNextDueInput(event: Event): void {
    this.nextDue.set((event.target as HTMLInputElement)?.value ?? '');
  }

  onPerformEveryTimeChange(event: Event): void {
    this.performEveryTime.set((event.target as HTMLInputElement)?.checked ?? false);
  }

  onCommentsInput(event: Event): void {
    this.comments.set((event.target as HTMLTextAreaElement)?.value ?? '');
  }

  // ── Create ─────────────────────────────────────────────────────
  createSchedule(): void {
    this.createError.set(null);
    this.createSuccess.set(null);

    const name      = this.scheduleName().trim();
    const freq      = this.frequency().trim();
    const due       = this.nextDue().trim();
    const groupId   = this.selectedGroupId();
    const commandId = this.selectedCommandId();
    const atm       = this.atm();

    if (!name)          { this.createError.set('Donnez un nom au schedule.');              return; }
    if (!freq)          { this.createError.set('La fréquence est requise.');               return; }
    if (!due)           { this.createError.set('La date/heure de début est requise.');     return; }
    if (groupId   === 0) { this.createError.set('Sélectionnez un groupe.');                return; }
    if (commandId === 0) { this.createError.set('Sélectionnez une commande.');             return; }
    if (!atm)           { this.createError.set('ATM introuvable.');                        return; }

    const nextDueDate = new Date(due);
    if (Number.isNaN(nextDueDate.getTime())) {
      this.createError.set('Date/heure invalide.');
      return;
    }

    const request: CreateScheduleRequest = {
      scheduleName:           name,
      frequency:              freq,
      nextDue:                nextDueDate.toISOString(),
      groupId,
      commandId,
      comments:               this.comments().trim(),
      businessId:             atm.businessId,
      performActionEveryTime: this.performEveryTime()
    };

    this.atmService.createSchedule(request).subscribe({
      next: () => {
        this.createSuccess.set('Schedule créé avec succès.');
        this.createPaneOpen.set(false);
        this.scheduleName.set('');
        this.frequency.set('Once');
        this.nextDue.set('');
        this.selectedGroupId.set(0);
        this.selectedCommandId.set(0);
        this.comments.set('');
        this.performEveryTime.set(false);
        const id = this.clientId();
        if (id) {
          this.atmService.getClientSchedules(id).subscribe({
            next: (rows) => this.schedules.set(rows ?? [])
          });
        }
      },
      error: (err) => {
        this.createError.set(err?.error?.message ?? 'Impossible de créer le schedule.');
      }
    });
  }

  // ── Badge helper (tableau) ─────────────────────────────────────
  freqBadgeClass(frequency: string): string {
    const f = (frequency ?? '').toLowerCase();
    if (f === 'once')                    return 'freq-badge--once';
    if (f === 'daily' || f === 'hourly') return 'freq-badge--daily';
    if (f.includes('week'))              return 'freq-badge--weekly';
    if (f.includes('month') || f.includes('quarter')) return 'freq-badge--monthly';
    if (f === 'yearly')                  return 'freq-badge--yearly';
    return 'freq-badge--other';
  }

  get displayGroupName(): string {
    return this.atm()?.clientName ?? '';
  }
}