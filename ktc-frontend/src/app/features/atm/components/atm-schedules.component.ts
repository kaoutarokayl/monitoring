import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AtmService, AtmScheduleDto, ClientAtm, CreateScheduleRequest, RemoteCommandTypeDto } from '../services/atm.service';
import { GroupService, Group } from '../../group/services/group.service';

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

  readonly clientId = signal<number | null>(null);
  readonly atm = signal<ClientAtm | null>(null);
  readonly schedules = signal<AtmScheduleDto[]>([]);
  readonly groups = signal<Group[]>([]);
  readonly commands = signal<RemoteCommandTypeDto[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly createPaneOpen = signal(false);
  readonly createError = signal<string | null>(null);
  readonly createSuccess = signal<string | null>(null);

  readonly scheduleName = signal('');
  readonly frequency = signal('Once');
  readonly nextDue = signal('');
  readonly selectedGroupId = signal<number>(0);
  readonly selectedCommandId = signal<number>(0);
  readonly comments = signal('');
  readonly performEveryTime = signal(false);

  readonly hasSchedules = computed(() => this.schedules().length > 0);
  readonly sortedSchedules = computed(() => [...this.schedules()].sort((a, b) => a.nextDue.localeCompare(b.nextDue)));

  ngOnInit(): void {
    const id = Number(this.route.parent?.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('id'));
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
      error: () => this.error.set('Impossible de charger les informations de l’ATM.')
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
      error: () => { /* silen */ }
    });

    this.atmService.getRemoteCommandTypes().subscribe({
      next: (rows) => this.commands.set(rows ?? []),
      error: () => { /* silen */ }
    });
  }

  toggleCreatePane(): void {
    this.createPaneOpen.update((v) => !v);
    this.createError.set(null);
    this.createSuccess.set(null);
  }

  onScheduleNameInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.scheduleName.set(target?.value ?? '');
  }

  onGroupChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.selectedGroupId.set(Number(target?.value ?? '0'));
  }

  onCommandChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.selectedCommandId.set(Number(target?.value ?? '0'));
  }

  onFrequencyInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.frequency.set(target?.value ?? '');
  }

  onNextDueInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.nextDue.set(target?.value ?? '');
  }

  onPerformEveryTimeChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.performEveryTime.set(target?.checked ?? false);
  }

  onCommentsInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    this.comments.set(target?.value ?? '');
  }

  createSchedule(): void {
    this.createError.set(null);
    this.createSuccess.set(null);

    const name = this.scheduleName().trim();
    const freq = this.frequency().trim();
    const due = this.nextDue().trim();
    const groupId = this.selectedGroupId();
    const commandId = this.selectedCommandId();
    const atm = this.atm();

    if (!name) {
      this.createError.set('Donnez un nom au schedule.');
      return;
    }
    if (!freq) {
      this.createError.set('La fréquence est requise.');
      return;
    }
    if (!due) {
      this.createError.set('La date/heures de début est requise.');
      return;
    }
    if (groupId === 0) {
      this.createError.set('Sélectionnez un groupe.');
      return;
    }
    if (commandId === 0) {
      this.createError.set('Sélectionnez une commande.');
      return;
    }
    if (!atm) {
      this.createError.set('ATM introuvable.');
      return;
    }

    const nextDueDate = new Date(due);
    if (Number.isNaN(nextDueDate.getTime())) {
      this.createError.set('Date/heure invalide.');
      return;
    }

    const request: CreateScheduleRequest = {
      scheduleName: name,
      frequency: freq,
      nextDue: nextDueDate.toISOString(),
      groupId,
      commandId,
      comments: this.comments().trim(),
      businessId: atm.businessId,
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
        if (this.clientId()) {
          this.atmService.getClientSchedules(this.clientId()!).subscribe({ next: (rows) => this.schedules.set(rows ?? []) });
        }
      },
      error: (err) => {
        this.createError.set(err?.error?.message ?? 'Impossible de créer le schedule.');
      }
    });
  }

  get displayGroupName(): string {
    return this.atm()?.clientName ?? '';
  }
}
