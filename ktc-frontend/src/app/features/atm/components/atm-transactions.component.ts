import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { AtmService } from '../services/atm.service';
import { LookupItemDto, TransactionAuditDto, TransactionSearchCriteria } from '../models/atm.models';

type FindMode = 'session' | 'transaction' | 'guid';

@Component({
  selector: 'app-atm-transactions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './atm-transactions.component.html',
  styleUrl: './atm-transactions.component.css'
})
export class AtmTransactionsComponent {
  private readonly atmService = inject(AtmService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly clientId = computed(() => Number(this.route.snapshot.paramMap.get('id') ?? 0));

  readonly isLoadingLookups = signal(false);
  readonly isSearching = signal(false);
  readonly error = signal<string | null>(null);

  readonly typeCodes = signal<LookupItemDto[]>([]);
  readonly reasonCodes = signal<LookupItemDto[]>([]);
  readonly completionCodes = signal<LookupItemDto[]>([]);

  readonly results = signal<TransactionAuditDto[]>([]);

  // UI state for direct find
  readonly findMode = signal<FindMode>('session');

  private readonly nowLocalIso = () => {
    const d = new Date();
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  private readonly daysAgoLocalIso = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  readonly filterForm = this.fb.group({
    from: [this.daysAgoLocalIso(7), Validators.required],
    to: [this.nowLocalIso(), Validators.required],
    amount: [null as number | null],
    typeLookupId: [null as number | null],
    reasonLookupId: [null as number | null],
    completionLookupId: [null as number | null]
  });

  readonly findForm = this.fb.group({
    mode: ['session' as FindMode, Validators.required],
    value: ['' as string, Validators.required]
  });

  ngOnInit() {
    this.loadLookups();
  }

  loadLookups() {
    this.isLoadingLookups.set(true);
    this.error.set(null);

    let pending = 3;
    const done = () => {
      pending--;
      if (pending <= 0) this.isLoadingLookups.set(false);
    };

    this.atmService.getTransactionTypeCodes().pipe(finalize(done)).subscribe({
      next: rows => this.typeCodes.set(rows),
      error: e => this.error.set(e?.error?.message ?? 'Erreur lors du chargement des Type codes')
    });

    this.atmService.getTransactionReasonCodes().pipe(finalize(done)).subscribe({
      next: rows => this.reasonCodes.set(rows),
      error: e => this.error.set(e?.error?.message ?? 'Erreur lors du chargement des Reason codes')
    });

    this.atmService.getTransactionCompletionCodes().pipe(finalize(done)).subscribe({
      next: rows => this.completionCodes.set(rows),
      error: e => this.error.set(e?.error?.message ?? 'Erreur lors du chargement des Completion codes')
    });
  }

  applyFilter() {
    if (this.filterForm.invalid) return;
    this.search(this.buildCriteriaFromFilter());
  }

  findDirect() {
    if (this.findForm.invalid) return;
    const mode = this.findForm.value.mode ?? 'session';
    const raw = (this.findForm.value.value ?? '').trim();

    const criteria: TransactionSearchCriteria = {};
    if (mode === 'guid') {
      criteria.transactionGuid = raw || null;
    } else if (mode === 'transaction') {
      const id = Number(raw);
      criteria.transactionId = Number.isFinite(id) ? id : null;
    } else {
      const id = Number(raw);
      criteria.sessionId = Number.isFinite(id) ? id : null;
    }

    this.search(criteria);
  }

  private buildCriteriaFromFilter(): TransactionSearchCriteria {
    const v = this.filterForm.value;
    return {
      from: v.from ?? null,
      to: v.to ?? null,
      amount: v.amount ?? null,
      typeLookupId: v.typeLookupId ?? null,
      reasonLookupId: v.reasonLookupId ?? null,
      completionLookupId: v.completionLookupId ?? null
    };
  }

  private search(criteria: TransactionSearchCriteria) {
    const clientId = this.clientId();
    if (!clientId) return;

    this.isSearching.set(true);
    this.error.set(null);

    this.atmService.searchAtmTransactions(clientId, criteria)
      .pipe(finalize(() => this.isSearching.set(false)))
      .subscribe({
        next: rows => this.results.set(rows),
        error: e => this.error.set(e?.error?.message ?? 'Erreur lors de la recherche transactions')
      });
  }
}

