import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Posto, PostoComDistancias } from '../models';

@Component({
  selector: 'app-posto-waypoint',
  imports: [DecimalPipe],
  template: `
    <div class="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-3 shadow-sm">
      <!-- Header: Name, Brand, Icon -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <div class="flex items-baseline gap-2">
            <span class="truncate text-sm font-semibold text-slate-800">
              {{ posto().nome }}
            </span>
            @if (posto().cidade || posto().estado) {
              <span class="truncate text-[10px] font-medium text-slate-400">
                {{ posto().cidade }}@if (posto().cidade && posto().estado) {, }{{ posto().estado }}
              </span>
            }
          </div>
          @if (posto().bandeira) {
            <div class="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <span class="truncate">{{ posto().bandeira }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Distance Information -->
      @if (postoComDistancias()) {
        <div class="flex gap-2 text-[10px] font-medium">
          <div class="flex items-center gap-1 text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ postoComDistancias()!.distanciaDaOrigemEmKm | number:'1.1-1' }} km</span>
          </div>
          <div class="flex items-center gap-1 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            <span>{{ postoComDistancias()!.distanciaDaRotaEmKm | number:'1.1-1' }} km</span>
          </div>
        </div>
      }

      <!-- Fuel Types -->
      @if (postoComDistancias()?.combustiveisDto && postoComDistancias()!.combustiveisDto.length > 0) {
        <div class="min-w-0 overflow-hidden">
          <div class="flex gap-1.5 overflow-x-auto scrollbar-hide">
            @for (combustivel of postoComDistancias()!.combustiveisDto; track combustivel.valor) {
              <span class="inline-flex flex-shrink-0 items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm ring-1 ring-emerald-200/60">
                {{ combustivel.nome }}
              </span>
            }
          </div>
        </div>
      } @else if (posto().combustiveis && posto().combustiveis.length > 0) {
        <div class="min-w-0 overflow-hidden">
          <div class="flex gap-1.5 overflow-x-auto scrollbar-hide">
            @for (combustivel of posto().combustiveis; track combustivel) {
              <span class="inline-flex flex-shrink-0 items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm ring-1 ring-emerald-200/60">
                {{ combustivel }}
              </span>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `
})
export class PostoWaypointComponent {
  posto = input.required<Posto>();
  label = input('Parada');
  
  postoComDistancias = (): PostoComDistancias | null => {
    const p = this.posto() as PostoComDistancias;
    return p.distanciaDaOrigemEmKm !== undefined ? p : null;
  };
}
