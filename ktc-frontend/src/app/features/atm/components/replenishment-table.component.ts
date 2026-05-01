import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { AtmService, ReplenishmentDto } from '../services/atm.service';

@Component({
  selector: 'app-replenishment-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './replenishment-table.component.html',
  styleUrls: ['./replenishment-table.component.css']
})
export class ReplenishmentTableComponent implements OnChanges {
  @Input({ required: true }) clientId!: number;
  @Input({ required: true }) componentId!: number;

  private readonly atmService = inject(AtmService);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rows = signal<ReplenishmentDto[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['clientId'] || changes['componentId']) && this.clientId && this.componentId >= 0) {
      this.load();
    }
  }

  private load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.atmService.getReplenishments(this.clientId, this.componentId).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Erreur lors du chargement des opérations de replenishment.');
        this.isLoading.set(false);
      }
    });
  }

  formatDenomination(row: ReplenishmentDto): string {
    if (row.denominationValue == null) {
      return row.denominationId ? `#${row.denominationId}` : '-';
    }

    return row.denominationId ? `${row.denominationValue} (#${row.denominationId})` : `${row.denominationValue}`;
  }
}
