import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  isSidebarCollapsed = signal(false);

  toggleSidebar() {
    this.isSidebarCollapsed.update(val => !val);
  }

  setSidebarCollapsed(collapsed: boolean) {
    this.isSidebarCollapsed.set(collapsed);
  }
}
