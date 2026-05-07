import { Component, OnInit, computed, inject, signal, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AtmService, AtmScheduleDto, ClientAtm, CreateScheduleRequest, RemoteCommandTypeDto } from '../services/atm.service';
import { GroupService, Group } from '../../group/services/group.service';

export interface FrequencyOption {
  value: string;
  label: string;
}

export interface GanttCol {
  index: number;
  label: string;
  date: Date;
  isToday: boolean;
  leftPct: number;
  widthPct: number;
}

export interface BarPosition {
  startPct: number;
  width: number;
  inRange: boolean;
}

/** Couleurs des barres par fréquence */
const FREQ_BAR_COLORS: Record<string, { bg: string; text: string }> = {
  Once:      { bg: '#e2e8f0', text: '#475569' },
  Hourly:    { bg: '#ede9fe', text: '#4338ca' },
  Daily:     { bg: '#dbeafe', text: '#1d4ed8' },
  Weekly:    { bg: '#e0f2fe', text: '#0369a1' },
  BiWeekly:  { bg: '#cffafe', text: '#0e7490' },
  Monthly:   { bg: '#fef3c7', text: '#92400e' },
  Quarterly: { bg: '#fce7f3', text: '#9d174d' },
  Yearly:    { bg: '#f0fdf4', text: '#166534' },
};

/** Couleurs des points indicateurs */
const FREQ_DOT_COLORS: Record<string, string> = {
  Once:      '#94a3b8',
  Hourly:    '#7c3aed',
  Daily:     '#2563eb',
  Weekly:    '#0284c7',
  BiWeekly:  '#0891b2',
  Monthly:   '#d97706',
  Quarterly: '#db2777',
  Yearly:    '#16a34a',
};

@Component({
  selector: 'app-atm-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './atm-schedules.component.html',
  styleUrls: ['./atm-schedules.component.css']
})
export class AtmSchedulesComponent implements OnInit {
  private readonly route       = inject(ActivatedRoute);
  private readonly atmService  = inject(AtmService);
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

  // ── Gantt state ────────────────────────────────────────────────
  readonly ganttView   = signal<'month' | 'quarter' | 'year'>('quarter');
  readonly ganttOffset = signal(0);
  readonly activeFreqs = signal<Set<string>>(new Set(Object.keys(FREQ_BAR_COLORS)));

  // ── Tooltip state ──────────────────────────────────────────────
  readonly tooltipVisible  = signal(false);
  readonly tooltipSchedule = signal<AtmScheduleDto | null>(null);
  readonly tooltipX        = signal(0);
  readonly tooltipY        = signal(0);
  // ── Selected schedule highlight ────────────────────────────────────
  readonly selectedScheduleId = signal<number | null>(null);
  // ── Reference date (today) ─────────────────────────────────────
  private readonly today = new Date();

  // ── Frequency chip options ─────────────────────────────────────
  readonly frequencyOptions: FrequencyOption[] = [
    { value: 'Once',      label: 'Une fois'           },
    { value: 'Hourly',    label: 'Toutes les heures'  },
    { value: 'Daily',     label: 'Quotidien'          },
    { value: 'Weekly',    label: 'Hebdomadaire'       },
    { value: 'BiWeekly',  label: 'Bi-hebdomadaire'   },
    { value: 'Monthly',   label: 'Mensuel'            },
    { value: 'Quarterly', label: 'Trimestriel'        },
    { value: 'Yearly',    label: 'Annuel'             },
  ];

  // ── Computed: basic ────────────────────────────────────────────
  readonly hasSchedules = computed(() => this.schedules().length > 0);

  readonly filteredSchedules = computed(() =>
    this.schedules().filter(s => this.activeFreqs().has(s.frequency))
  );

  // ── Computed: Gantt period ─────────────────────────────────────
  readonly ganttPeriod = computed(() => {
    const view   = this.ganttView();
    const offset = this.ganttOffset();
    const today  = this.today;

    if (view === 'month') {
      const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      return {
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end:   new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
      };
    }

    if (view === 'quarter') {
      const baseMonth = today.getMonth() + offset * 3;
      const d = new Date(today.getFullYear(), baseMonth, 1);
      const qStart = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
      return {
        start: qStart,
        end:   new Date(qStart.getFullYear(), qStart.getMonth() + 3, 0, 23, 59, 59),
      };
    }

    // year
    const yr = today.getFullYear() + offset;
    return {
      start: new Date(yr, 0, 1),
      end:   new Date(yr, 11, 31, 23, 59, 59),
    };
  });

  // ── Computed: Gantt columns ────────────────────────────────────
  readonly ganttCols = computed<GanttCol[]>(() => {
    const { start, end } = this.ganttPeriod();
    const view = this.ganttView();
    const totalMs = end.getTime() - start.getTime();
    const cols: GanttCol[] = [];

    if (view === 'month') {
      const d = new Date(start);
      let i = 0;
      while (d <= end) {
        const colStart = new Date(d);
        const colEnd   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
        const leftPct  = ((colStart.getTime() - start.getTime()) / totalMs) * 100;
        const widthPct = ((colEnd.getTime() - colStart.getTime()) / totalMs) * 100;
        cols.push({
          index: i++,
          label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }).replace('.', ''),
          date: new Date(d),
          isToday: this.isSameDay(d, this.today),
          leftPct,
          widthPct,
        });
        d.setDate(d.getDate() + 1);
      }
    } else {
      const d = new Date(start.getFullYear(), start.getMonth(), 1);
      let i = 0;
      while (d <= end) {
        const colStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const colEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        const leftPct  = ((colStart.getTime() - start.getTime()) / totalMs) * 100;
        const widthPct = ((Math.min(colEnd.getTime(), end.getTime()) - colStart.getTime()) / totalMs) * 100;
        const isTodayMonth = d.getMonth() === this.today.getMonth() && d.getFullYear() === this.today.getFullYear();
        cols.push({
          index: i++,
          label: d.toLocaleDateString('fr-FR', { month: 'short' }),
          date: new Date(d),
          isToday: isTodayMonth,
          leftPct,
          widthPct,
        });
        d.setMonth(d.getMonth() + 1);
      }
    }
    return cols;
  });

  // ── Computed: period label ────────────────────────────────────
  readonly periodLabel = computed(() => {
    const { start } = this.ganttPeriod();
    const view = this.ganttView();
    if (view === 'month')   return start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (view === 'quarter') return `T${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
    return `${start.getFullYear()}`;
  });

  // ── Computed: today line position ────────────────────────────
  readonly todayLinePct = computed(() => {
    const { start, end } = this.ganttPeriod();
    const totalMs = end.getTime() - start.getTime();
    return ((this.today.getTime() - start.getTime()) / totalMs) * 100;
  });

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
      error: () => this.error.set("Impossible de charger les informations de l'ATM.")
    });

    this.atmService.getClientSchedules(clientId).subscribe({
      next: (rows) => { this.schedules.set(rows ?? []); this.isLoading.set(false); },
      error: () => { this.error.set('Impossible de charger les schedules.'); this.isLoading.set(false); }
    });

    this.groupService.getAllGroups().subscribe({
      next: (rows) => this.groups.set(rows ?? []),
      error: () => {}
    });

    this.atmService.getRemoteCommandTypes().subscribe({
      next: (rows) => this.commands.set(rows ?? []),
      error: () => {}
    });
  }

  // ── Gantt controls ────────────────────────────────────────────
  setGanttView(v: 'month' | 'quarter' | 'year'): void {
    this.ganttView.set(v);
    this.ganttOffset.set(0);
  }

  navigate(dir: -1 | 1): void {
    this.ganttOffset.update(o => o + dir);
  }

  goToday(): void {
    this.ganttOffset.set(0);
  }

  toggleFreq(value: string): void {
    this.activeFreqs.update(set => {
      const next = new Set(set);
      if (next.has(value)) {
        if (next.size > 1) next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }

  // ── Gantt bar helper ──────────────────────────────────────────
  getBarPosition(schedule: AtmScheduleDto): BarPosition {
    const { start, end } = this.ganttPeriod();
    const totalMs = end.getTime() - start.getTime() || 1;

    const due  = new Date(schedule.nextDue);
    const last = schedule.lastActioned ? new Date(schedule.lastActioned) : null;

    let barStart = last ?? this.shiftBack(new Date(due), schedule.frequency);
    const barEnd = new Date(due);

    const startPct = Math.max(0, ((barStart.getTime() - start.getTime()) / totalMs) * 100);
    const endPct   = Math.min(100, ((barEnd.getTime() - start.getTime()) / totalMs) * 100);
    const width    = Math.max(endPct - startPct, 1.5);
    const inRange  = barEnd >= start && barStart <= end;

    return { startPct, width, inRange };
  }

  private shiftBack(date: Date, frequency: string): Date {
    const d = new Date(date);
    switch (frequency) {
      case 'Hourly':    d.setHours(d.getHours() - 1);        break;
      case 'Daily':     d.setDate(d.getDate() - 1);          break;
      case 'Weekly':    d.setDate(d.getDate() - 7);          break;
      case 'BiWeekly':  d.setDate(d.getDate() - 14);         break;
      case 'Monthly':   d.setMonth(d.getMonth() - 1);        break;
      case 'Quarterly': d.setMonth(d.getMonth() - 3);        break;
      case 'Yearly':    d.setFullYear(d.getFullYear() - 1);  break;
      default:          d.setDate(d.getDate() - 1);
    }
    return d;
  }

  // ── Color helpers ─────────────────────────────────────────────
  freqBarColor(frequency: string): { bg: string; text: string } {
    return FREQ_BAR_COLORS[frequency] ?? FREQ_BAR_COLORS['Once'];
  }

  freqDotColor(frequency: string): string {
    return FREQ_DOT_COLORS[frequency] ?? FREQ_DOT_COLORS['Once'];
  }

  // ── Tooltip ───────────────────────────────────────────────────
  showTooltip(event: MouseEvent, schedule: AtmScheduleDto): void {
    this.tooltipSchedule.set(schedule);
    this.tooltipVisible.set(true);
    this.updateTooltipPosition(event);
  }

  hideTooltip(): void {
    this.tooltipVisible.set(false);
  }

  scrollToSchedule(schedule: AtmScheduleDto): void {
    const targetOffset = this.getScheduleOffset(schedule);
    if (targetOffset !== null && targetOffset !== this.ganttOffset()) {
      this.ganttOffset.set(targetOffset);
      setTimeout(() => this.scrollToSchedule(schedule), 50);
      return;
    }

    const bar = document.getElementById(`schedule-bar-${schedule.scheduleId}`);
    if (!(bar instanceof HTMLElement)) {
      return;
    }

    this.selectedScheduleId.set(schedule.scheduleId);
    setTimeout(() => {
      if (this.selectedScheduleId() === schedule.scheduleId) {
        this.selectedScheduleId.set(null);
      }
    }, 2200);

    const ganttOuter = document.querySelector('.gantt-outer');
    if (ganttOuter instanceof HTMLElement) {
      const barRect = bar.getBoundingClientRect();
      const outerRect = ganttOuter.getBoundingClientRect();
      const scrollDelta = barRect.left - outerRect.left - outerRect.width / 2 + barRect.width / 2;
      ganttOuter.scrollBy({ left: scrollDelta, behavior: 'smooth' });
      return;
    }

    bar.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  private getScheduleOffset(schedule: AtmScheduleDto): number | null {
    const due = new Date(schedule.nextDue);
    const view = this.ganttView();
    const today = this.today;
    const currentOffset = this.ganttOffset();

    if (view === 'month') {
      const currentMonth = today.getMonth() + currentOffset;
      const currentYear = today.getFullYear() + Math.floor(currentMonth / 12);
      const normalizedCurrentMonth = ((currentMonth % 12) + 12) % 12;
      const monthDiff = (due.getFullYear() - currentYear) * 12 + due.getMonth() - normalizedCurrentMonth;
      return currentOffset + monthDiff;
    }

    if (view === 'quarter') {
      const currentQuarter = Math.floor(today.getMonth() / 3) + currentOffset;
      const targetQuarter = Math.floor(due.getMonth() / 3) + (due.getFullYear() - today.getFullYear()) * 4;
      return currentOffset + (targetQuarter - currentQuarter);
    }

    if (view === 'year') {
      const displayedYear = today.getFullYear() + currentOffset;
      return currentOffset + (due.getFullYear() - displayedYear);
    }

    return null;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.tooltipVisible()) this.updateTooltipPosition(event);
  }

  private updateTooltipPosition(event: MouseEvent): void {
    this.tooltipX.set(Math.min(event.clientX + 14, window.innerWidth - 240));
    this.tooltipY.set(Math.min(event.clientY + 14, window.innerHeight - 200));
  }

  // ── Toggle builder ────────────────────────────────────────────
  toggleCreatePane(): void {
    this.createPaneOpen.update(v => !v);
    this.createError.set(null);
    this.createSuccess.set(null);
  }

  // ── Frequency chip handler ────────────────────────────────────
  setFrequency(value: string): void {
    this.frequency.set(value);
  }

  // ── Form event handlers ───────────────────────────────────────
  onScheduleNameInput(event: Event): void {
    this.scheduleName.set((event.target as HTMLInputElement)?.value ?? '');
  }

  onGroupChange(event: Event): void {
    this.selectedGroupId.set(Number((event.target as HTMLSelectElement)?.value ?? '0'));
  }

  onCommandChange(event: Event): void {
    this.selectedCommandId.set(Number((event.target as HTMLSelectElement)?.value ?? '0'));
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

  // ── Create ────────────────────────────────────────────────────
  createSchedule(): void {
    this.createError.set(null);
    this.createSuccess.set(null);

    const name      = this.scheduleName().trim();
    const freq      = this.frequency().trim();
    const due       = this.nextDue().trim();
    const groupId   = this.selectedGroupId();
    const commandId = this.selectedCommandId();
    const atm       = this.atm();

    if (!name)          { this.createError.set('Donnez un nom au schedule.');          return; }
    if (!freq)          { this.createError.set('La fréquence est requise.');            return; }
    if (!due)           { this.createError.set('La date/heure de début est requise.'); return; }
    if (groupId === 0)  { this.createError.set('Sélectionnez un groupe.');             return; }
    if (commandId === 0){ this.createError.set('Sélectionnez une commande.');          return; }
    if (!atm)           { this.createError.set('ATM introuvable.');                    return; }

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
        this.resetForm();
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

  private resetForm(): void {
    this.scheduleName.set('');
    this.frequency.set('Once');
    this.nextDue.set('');
    this.selectedGroupId.set(0);
    this.selectedCommandId.set(0);
    this.comments.set('');
    this.performEveryTime.set(false);
  }

  // ── Utility ───────────────────────────────────────────────────
  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth()    === b.getMonth()    &&
           a.getDate()     === b.getDate();
  }

  get displayGroupName(): string {
    return this.atm()?.clientName ?? '';
  }
}