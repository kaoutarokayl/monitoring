import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { AppCounterDto, AtmService } from '../services/atm.service';

@Component({
  selector: 'app-app-counters-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-counters-table.component.html',
  styleUrls: ['./app-counters-table.component.css']
})
export class AppCountersTableComponent implements OnChanges {
  @Input({ required: true }) clientId!: number;
  @Input({ required: true }) componentId!: number;

  private readonly atmService = inject(AtmService);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rows = signal<AppCounterDto[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['clientId'] || changes['componentId']) && this.clientId && this.componentId >= 0) {
      this.load();
    }
  }

  private load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.atmService.getApplicationCounters(this.clientId, this.componentId).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Erreur lors du chargement des Application Counters.');
        this.isLoading.set(false);
      }
    });
  }

  formatDenomination(row: AppCounterDto): string {
    if (row.denominationValue == null) return '-';
    return `${row.denominationValue}`;
  }

  formatCurrency(row: AppCounterDto): string {
    if (!row.currencyCode) {
      return '-';
    }

    return row.currencyCode;
  }
}
