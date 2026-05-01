import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AtmService,
  BusinessDto,
  CreateBranchRequest
} from '../../atm/services/atm.service';

@Component({
  selector: 'app-branch-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './branch-form.component.html',
  styleUrls: ['./branch-form.component.css']
})
export class BranchFormComponent implements OnInit {
  private fb         = inject(FormBuilder);
  private atmService = inject(AtmService);
  private router     = inject(Router);
  private route      = inject(ActivatedRoute);

  // ── State ──────────────────────────────────────────────────────────────────
  isEdit     = signal(false);
  editId     = signal<number | null>(null);
  isLoading  = signal(true);
  isSaving   = signal(false);
  error      = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  businesses = signal<BusinessDto[]>([]);

  // ── Form ───────────────────────────────────────────────────────────────────
  form: FormGroup = this.fb.group({
    branchName:     ['', [Validators.required, Validators.minLength(2)]],
    displayId:      [''],
    businessId:     [0,  [Validators.required, Validators.min(1)]],
    level1RegionId: [0],
    level2RegionId: [0],
    level3RegionId: [0],
    level4RegionId: [0],
    level5RegionId: [0],
    additionalInfo: ['']
  });

  get f() { return this.form.controls; }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit.set(true);
      this.editId.set(Number(idParam));
    }

    forkJoin({
      businesses: this.atmService.getBusinesses()
    }).subscribe({
      next: ({ businesses }) => {
        this.businesses.set(businesses);

        if (this.isEdit() && this.editId()) {
          this.atmService.getBranchById(this.editId()!).subscribe({
            next: branch => {
              this.form.patchValue({
                branchName:     branch.branchName,
                displayId:      branch.displayId,
                businessId:     branch.businessId,
                level1RegionId: branch.level1RegionId,
                level2RegionId: branch.level2RegionId,
                level3RegionId: branch.level3RegionId,
                level4RegionId: branch.level4RegionId,
                level5RegionId: branch.level5RegionId,
                additionalInfo: branch.additionalInfo ?? ''
              });
              this.isLoading.set(false);
            },
            error: () => {
              this.error.set('Branche introuvable');
              this.isLoading.set(false);
            }
          });
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.error.set('Impossible de charger les données de référence');
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

const payload: CreateBranchRequest = {
  branchName: this.form.value.branchName.trim(),

  displayId: this.form.value.displayId?.trim() || '',

  businessId: Number(this.form.value.businessId),

  level1RegionId: Number(this.form.value.level1RegionId) || 0,
  level2RegionId: Number(this.form.value.level2RegionId) || 0,
  level3RegionId: Number(this.form.value.level3RegionId) || 0,
  level4RegionId: Number(this.form.value.level4RegionId) || 0,
  level5RegionId: Number(this.form.value.level5RegionId) || 0,

  additionalInfo: this.form.value.additionalInfo?.trim() || ''
};
console.log("BRANCH PAYLOAD =", payload);

    const obs = this.isEdit()
      ? this.atmService.updateBranch(this.editId()!, payload)
      : this.atmService.createBranch(payload);

    obs.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.successMsg.set(res.message);
        setTimeout(() => this.router.navigate(['/admin/branches']), 1000);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.error.set(err?.error?.message ?? 'Erreur lors de l\'enregistrement');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/branches']);
  }
}

