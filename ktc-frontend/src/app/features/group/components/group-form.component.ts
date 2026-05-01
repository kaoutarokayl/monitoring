import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GroupService, Group, CreateGroupRequest, UpdateGroupRequest } from '../services/group.service';

@Component({
  selector: 'app-group-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './group-form.component.html',
  styleUrls: ['./group-form.component.css']
})
export class GroupFormComponent implements OnInit {
  @Input() group: Group | null = null;
  @Output() saved    = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb           = inject(FormBuilder);
  private groupService = inject(GroupService);

  isSaving   = signal(false);
  error      = signal<string | null>(null);
  successMsg = signal<string | null>(null);

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
    if (this.group) {
      this.isEdit = true;
      this.form.patchValue({
        groupName:          this.group.groupName,
        groupTypeId:        this.group.groupTypeId ?? 2,
        groupDescription:   this.group.groupDescription ?? '',
        groupQuery:         this.group.groupQuery ?? '',
        includeMothballed:  this.group.includeMothballed ?? false,
        evaluationInterval: this.group.evaluationInterval ?? 0
      });
    }
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
        next: () => { this.isSaving.set(false); this.successMsg.set('Groupe mis à jour !'); setTimeout(() => this.saved.emit(), 800); },
        error: err => { this.isSaving.set(false); this.error.set(err?.error?.message ?? 'Erreur lors de la mise à jour'); }
      });
    } else {
      const payload: CreateGroupRequest = {
        ...this.form.value,
        groupTypeId:        Number(this.form.value.groupTypeId),
        evaluationInterval: Number(this.form.value.evaluationInterval)
      };
      this.groupService.createGroup(payload).subscribe({
        next: () => { this.isSaving.set(false); this.successMsg.set('Groupe créé !'); setTimeout(() => this.saved.emit(), 800); },
        error: err => { this.isSaving.set(false); this.error.set(err?.error?.message ?? 'Erreur lors de la création'); }
      });
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
