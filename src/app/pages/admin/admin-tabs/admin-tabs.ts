import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHeartHandshake, lucideUsersRound } from '@ng-icons/lucide';

@Component({
  selector: 'app-admin-tabs',
  imports: [RouterLink, RouterLinkActive, NgIcon],
  viewProviders: [provideIcons({ lucideUsersRound, lucideHeartHandshake })],
  template: `
    <nav class="flex gap-2 px-7 pt-5 bg-[var(--color-bg)]">
      <a
        routerLink="/admin/usuarios"
        routerLinkActive="bg-[var(--color-surface)] text-[var(--color-primary-dark)] border-[var(--color-border)]"
        [routerLinkActiveOptions]="{ exact: false }"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl border border-transparent border-b-0 text-sm font-semibold text-[var(--color-ink-soft)] cursor-pointer transition-colors"
      >
        <ng-icon name="lucideUsersRound" size="16" />
        Médicos y familiares
      </a>
      <a
        routerLink="/admin/pacientes"
        routerLinkActive="bg-[var(--color-surface)] text-[var(--color-primary-dark)] border-[var(--color-border)]"
        [routerLinkActiveOptions]="{ exact: false }"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl border border-transparent border-b-0 text-sm font-semibold text-[var(--color-ink-soft)] cursor-pointer transition-colors"
      >
        <ng-icon name="lucideHeartHandshake" size="16" />
        Pacientes
      </a>
    </nav>
  `,
})
export class AdminTabs {}
