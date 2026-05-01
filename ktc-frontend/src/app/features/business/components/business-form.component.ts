import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AtmService,
  CreateBusinessRequest
} from '../../atm/services/atm.service';

@Component({
  selector: 'app-business-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './business-form.component.html',
  styleUrls: ['./business-form.component.css']
})
export class BusinessFormComponent implements OnInit {
  private fb         = inject(FormBuilder);
  private atmService = inject(AtmService);
  private router     = inject(Router);
  private route      = inject(ActivatedRoute);

  // ── State ──────────────────────────────────────────────────────────────────
  isEdit     = signal(false);
  editId     = signal<number | null>(null);
  isLoading  = signal(false);
  isSaving   = signal(false);
  error      = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  // ── Form ───────────────────────────────────────────────────────────────────
  form: FormGroup = this.fb.group({
    businessName:   ['', [Validators.required, Validators.minLength(2)]],
    displayId:      [''],
    additionalInfo: ['']
  });

  get f() { return this.form.controls; }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.editId.set(Number(idParam));
      this.loadBusiness(Number(idParam));
    }
  }

  private loadBusiness(id: number): void {
    this.isLoading.set(true);
    this.atmService.getBusinessById(id).subscribe({
      next: b => {
        this.form.patchValue({
          businessName:   b.businessName,
          displayId:      b.displayId,
          additionalInfo: b.additionalInfo ?? ''
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Business introuvable');
        this.isLoading.set(false);
      }
    });
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);
    this.successMsg.set(null);

const payload: CreateBusinessRequest = {
  businessName: this.form.value.businessName.trim(),
  displayId: this.form.value.displayId?.trim() || '',
  additionalInfo: this.form.value.additionalInfo?.trim() || ''
};

console.log(payload);

    const obs = this.isEdit()
      ? this.atmService.updateBusiness(this.editId()!, payload)
      : this.atmService.createBusiness(payload);

    obs.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.successMsg.set(res.message);
        setTimeout(() => this.router.navigate(['/admin/businesses']), 1000);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(err?.error?.message ?? 'Erreur lors de l\'enregistrement');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/businesses']);
  }
}

