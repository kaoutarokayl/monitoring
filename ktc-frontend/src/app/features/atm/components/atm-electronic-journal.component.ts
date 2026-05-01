import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AtmService, ElectronicJournalEntryDto } from '../services/atm.service';

@Component({
  selector: 'app-atm-electronic-journal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './atm-electronic-journal.component.html',
  styleUrls: ['./atm-electronic-journal.component.css']
})
export class AtmElectronicJournalComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly atmService = inject(AtmService);

  readonly clientId = signal<number | null>(null);

  readonly from = signal<string>('');
  readonly to = signal<string>('');

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rows = signal<ElectronicJournalEntryDto[]>([]);

  readonly isEmpty = computed(() => !this.isLoading() && !this.error() && this.rows().length === 0);

  ngOnInit(): void {
    const idStr = this.route.parent?.snapshot.paramMap.get('id') ?? this.route.snapshot.paramMap.get('id');
    this.clientId.set(idStr ? Number(idStr) : null);

    const now = new Date();
    const to = this.toLocalInput(now);
    const from = this.toLocalInput(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    this.from.set(from);
    this.to.set(to);

    this.refresh();
  }

  refresh(): void {
    const id = this.clientId();
    if (!id) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.atmService.getElectronicJournal(id, this.from(), this.to()).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set("Erreur lors du chargement de l'Electronic Journal.");
        this.isLoading.set(false);
      }
    });
  }

  getDisplayRows(): ElectronicJournalEntryDto[] {
    // UI requirement: show one row even if empty (DB might be empty).
    if (this.rows().length > 0) return this.rows();

    return [
      {
        transactionId: 0,
        timestamp: new Date().toISOString(),
        type: 'No data (sample row)',
        amount: null,
        effectiveAmount: null,
        ejStartId: null,
        ejEndId: null
      }
    ];
  }

  private toLocalInput(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}

