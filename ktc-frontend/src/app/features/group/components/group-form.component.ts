import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService, Group, CreateGroupRequest, UpdateGroupRequest } from '../services/group.service';

@Component({
  selector: 'app-group-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './group-form.component.html',
  styleUrls: ['./group-form.component.css']
})
export class GroupFormComponent implements OnInit {
  /**
   * Quand utilisé en tant que composant embarqué (ex: group-details),
   * on peut passer le groupe directement via @Input.
   * En navigation route (/admin/groups/:id/edit), le composant charge
   * le groupe depuis l'API via l'id de la route.
   */
  @Input() group: Group | null = null;
  @Output() saved     = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb           = inject(FormBuilder);
  private readonly groupService = inject(GroupService);
  private readonly router       = inject(Router);
  private readonly route        = inject(ActivatedRoute);

  isSaving   = signal(false);
  error      = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  isLoading  = signal(false);

  /** true si on est en mode édition (group != null ou route :id présent) */
  isEdit = false;

  form: FormGroup = this.fb.group({
    groupName:          ['', [Validators.required, Validators.minLength(2)]],
    groupTypeId:        [2],
    groupDescription:   [''],
    groupQuery:         [''],
    includeMothballed:  [false],
    evaluationInterval: [0]
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    // Cas 1 : groupe passé via @Input (composant embarqué)
    if (this.group) {
      this.isEdit = true;
      this.patchForm(this.group);
      return;
    }

    // Cas 2 : route /admin/groups/:id/edit → charger le groupe depuis l'API
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId) {
      const id = Number(routeId);
      if (Number.isFinite(id) && id > 0) {
        this.isEdit = true;
        this.isLoading.set(true);
        this.groupService.getGroupDetails(id).subscribe({
          next: (g) => {
            this.group = g;
            this.patchForm(g);
            this.isLoading.set(false);
          },
          error: () => {
            this.error.set('Impossible de charger le groupe à modifier.');
            this.isLoading.set(false);
          }
        });
      }
    }
    // Cas 3 : pas d'id → création
  }

  private patchForm(g: Group): void {
    this.form.patchValue({
      groupName:          g.groupName,
      groupTypeId:        g.groupTypeId ?? 2,
      groupDescription:   g.groupDescription ?? '',
      groupQuery:         g.groupQuery ?? '',
      includeMothballed:  g.includeMothballed ?? false,
      evaluationInterval: g.evaluationInterval ?? 0
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isSaving.set(true);
    this.error.set(null);

    if (this.isEdit && this.group) {
      const payload: UpdateGroupRequest = {
        groupId: this.group.groupId,
        ...this.form.value,
        groupTypeId:        Number(this.form.value.groupTypeId),
        evaluationInterval: Number(this.form.value.evaluationInterval)
      };
      this.groupService.updateGroup(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.successMsg.set('Groupe mis à jour avec succès !');
          setTimeout(() => {
            // Si utilisé en route standalone → retour arrière
            if (this.saved.observers.length === 0) {
              this.goBack();
            } else {
              this.saved.emit();
            }
          }, 800);
        },
        error: err => {
          this.isSaving.set(false);
          this.error.set(err?.error?.message ?? 'Erreur lors de la mise à jour');
        }
      });
    } else {
      const payload: CreateGroupRequest = {
        ...this.form.value,
        groupTypeId:        Number(this.form.value.groupTypeId),
        evaluationInterval: Number(this.form.value.evaluationInterval)
      };
      this.groupService.createGroup(payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.successMsg.set('Groupe créé avec succès !');
          setTimeout(() => {
            if (this.saved.observers.length === 0) {
              this.goBack();
            } else {
              this.saved.emit();
            }
          }, 800);
        },
        error: err => {
          this.isSaving.set(false);
          this.error.set(err?.error?.message ?? 'Erreur lors de la création');
        }
      });
    }
  }

  /**
   * Annuler : émet l'événement si utilisé en composant embarqué,
   * sinon navigue en arrière dans l'historique du navigateur.
   */
  cancel(): void {
    if (this.cancelled.observers.length > 0) {
      this.cancelled.emit();
    } else {
      this.goBack();
    }
  }

  /**
   * Retour arrière : utilise l'historique du navigateur.
   * Si pas d'historique disponible, navigue vers /admin/groups.
   */
  private goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/admin/groups']);
    }
  }
}