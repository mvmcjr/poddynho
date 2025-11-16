import { Component, model, signal, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TipoCombustivel } from '../models';
import { RotaService } from '../services/rota.service';

@Component({
  selector: 'app-filtros-rota',
  imports: [FormsModule],
  host: { class: 'block w-full' },
  template: `
    <section class="relative overflow-hidden rounded-3xl bg-white/95 shadow ring-1 ring-slate-200/60">
      <header class="flex items-center gap-3 border-b border-slate-200/60 px-6 py-5">
        <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M3.75 6H7.5m-3.75 6h9.75m3.75 0h3.75M10.5 18h9.75m-16.5 0H7.5" />
          </svg>
        </span>
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">Filtros</p>
          <h2 class="text-lg font-semibold text-slate-900">Ajustes de rota</h2>
        </div>
      </header>

      <div class="flex flex-col gap-6 px-6 pb-6 pt-5 text-sm text-slate-600">
        <section class="flex flex-col gap-3">
          <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5l2.25-3 2.25 3m-2.25-3V21m12-10.5l2.25-3 2.25 3M18 7.5V12" />
            </svg>
            Tipos de combustível
          </h3>

          <div class="flex flex-wrap gap-2">
            @for (tipo of todosCombustiveis(); track tipo.valor) {
              <button
                type="button"
                [class]="classeOpcaoCombustivel(tipo.valor)"
                (click)="toggleCombustivel(tipo.valor)">
                {{ tipo.nome }}
              </button>
            }
          </div>
        </section>

        <section class="flex flex-col gap-4">
          <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18m-9-9v18" />
            </svg>
            Distância máxima
          </h3>

          <label class="flex flex-col gap-3">
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              [(ngModel)]="distanciaMaximaEmKm"
              class="h-1 w-full appearance-none rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500 accent-indigo-600" />
            <span class="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {{ distanciaMaximaEmKm() }} km
            </span>
          </label>
        </section>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: #2563eb;
      border: 3px solid #fff;
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
      cursor: pointer;
    }

    input[type="range"]::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: #2563eb;
      border: 3px solid #fff;
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
      cursor: pointer;
    }
  `
})
export class FiltrosRotaComponent {
  private rotaService = inject(RotaService);
  
  todosCombustiveis = signal<TipoCombustivel[]>([]);
  tiposCombustivel = model<string[]>([]);
  distanciaMaximaEmKm = model<number>(20);

  constructor() {
    this.rotaService.listarTiposCombustivel().subscribe({
      next: tipos => {
        this.todosCombustiveis.set(tipos);
        const selecionados = tipos
          .filter(t => t.iniciarSelecionado)
          .map(t => t.valor);
        this.tiposCombustivel.set(selecionados);
      },
      error: err => console.error('Erro ao carregar tipos de combustível:', err)
    });
  }

  toggleCombustivel(valor: string) {
    const tipos = this.tiposCombustivel();
    if (tipos.includes(valor)) {
      this.tiposCombustivel.set(tipos.filter(t => t !== valor));
    } else {
      this.tiposCombustivel.set([...tipos, valor]);
    }
  }

  classeOpcaoCombustivel(valor: string) {
    const base = 'rounded-full border px-3 py-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600';
    const ativa = this.tiposCombustivel().includes(valor);
    if (ativa) {
      return `${base} border-sky-300 bg-sky-500 text-white shadow-[0_8px_18px_rgba(14,165,233,0.28)] hover:bg-sky-600`;
    }
    return `${base} border-slate-200 bg-white/70 text-slate-600 hover:border-sky-200 hover:text-sky-600`;
  }
}
