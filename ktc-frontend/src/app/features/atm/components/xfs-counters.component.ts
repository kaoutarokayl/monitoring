import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, computed, inject, signal } from '@angular/core';
import { AtmService, XfsCountersResponseDto } from '../services/atm.service';

@Component({
  selector: 'app-xfs-counters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './xfs-counters.component.html',
  styleUrls: ['./xfs-counters.component.css']
})
export class XfsCountersComponent implements OnChanges {
  @Input({ required: true }) clientId!: number;
  @Input({ required: true }) componentId!: number;

  private readonly atmService = inject(AtmService);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<XfsCountersResponseDto>({ logicalView: [], physicalView: [] });

  readonly hasAnyData = computed(() => {
    const current = this.data();
    return current.logicalView.length > 0;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['clientId'] || changes['componentId']) && this.clientId && this.componentId >= 0) {
      this.load();
    }
  }

  private load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.atmService.getXfsCounters(this.clientId, this.componentId).subscribe({
      next: (data) => {
        this.data.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Erreur lors du chargement des XFS Counters.');
        this.isLoading.set(false);
      }
    });
  }

  formatDenomination(value: number | null | undefined, id: number | null | undefined): string {
    if (value == null) {
      return id ? `#${id}` : '-';
    }

    return id ? `${value} (#${id})` : `${value}`;
  }

  getTypeMeaning(typeId: number): string {
    const map: Record<number, string> = {
      2: 'Reject Cassette',
      3: 'Retract Cassette',
      5: 'Cash-Out Cassette',
      16: 'Cash-In Unit',
      17: 'Escrow Unit',
      18: 'Retract Unit',
      19: 'Reject Unit',
      20: 'Recycling Unit'
    };

    return map[typeId] ?? `Type ${typeId}`;
  }

  getStatusMeaning(statusId: number): string {
    const map: Record<number, string> = {
      1: 'OK',
      2: 'Low',
      3: 'High',
      4: 'Full',
      5: 'Inoperative',
      6: 'Missing',
      7: 'No Value',
      8: 'Unknown'
    };

    return map[statusId] ?? `Status ${statusId}`;
  }
}
