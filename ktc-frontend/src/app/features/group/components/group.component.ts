import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupListComponent } from './group-list.component';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, GroupListComponent],
  template: '<app-group-list></app-group-list>',
  styles: [':host { display: flex; flex-direction: column; height: 100%; min-height: 0; }']
})
export class GroupComponent {}
