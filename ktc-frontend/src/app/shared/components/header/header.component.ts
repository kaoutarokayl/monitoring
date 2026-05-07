import { Component, HostListener, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AtmRemoteCommandsMenuComponent } from '../../../features/atm/components/atm-remote-commands-menu.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, AtmRemoteCommandsMenuComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  themeMode = signal<'light' | 'dark'>('light');
  private readonly themeStorageKey = 'ktc-theme';

  roles = this.authService.currentUserRoles;
  user  = this.authService.currentUser;

  isProfileOpen = signal(false);

  userInitial = computed(() => {
    const name = this.user()?.username || '?';
    return name.charAt(0).toUpperCase();
  });

  primaryRole = computed(() => {
    const r = this.roles();
    if (!r || r.length === 0) return 'Utilisateur';
    return r[0];
  });

  get themeIcon() {
    return this.themeMode() === 'dark' ? '☀️' : '🌙';
  }

  get themeLabel() {
    return this.themeMode() === 'dark' ? 'Mode clair' : 'Mode sombre';
  }

  constructor() {
    this.initializeTheme();
  }

  toggleTheme() {
    this.applyTheme(this.themeMode() === 'dark' ? 'light' : 'dark');
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem(this.themeStorageKey) as 'light' | 'dark' | null;
    const theme = savedTheme === 'dark' || savedTheme === 'light'
      ? savedTheme
      : this.getPreferredTheme();

    this.applyTheme(theme);
  }

  private getPreferredTheme(): 'light' | 'dark' {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: 'light' | 'dark') {
    this.themeMode.set(theme);
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    document.body.classList.toggle('theme-dark', theme === 'dark');
    document.body.classList.toggle('theme-light', theme === 'light');
    localStorage.setItem(this.themeStorageKey, theme);
  }

  toggleProfile(event?: Event) {
    event?.stopPropagation();
    this.isProfileOpen.update(v => !v);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.isProfileOpen.set(false);
  }

  logout() {
    this.authService.logout();
  }

  // Nouvelle méthode : clic sur Administration → va sur la liste des ATMs
  goToAdministration() {
    this.isProfileOpen.set(false);
    this.router.navigate(['/admin']);   // Va sur le layout admin (qui redirige vers /admin/atms)
  }
}
