import { Component, HostListener, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

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