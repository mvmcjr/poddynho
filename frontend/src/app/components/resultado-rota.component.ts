import { Component, signal, input, computed, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PostoComDistancias, RotaDto } from '../models';

type ResumoErro = {
  status?: number;
  mensagem: string;
  detalhes: string;
};

@Component({
  selector: 'app-resultado-rota',
  imports: [DecimalPipe],
  host: { class: 'block w-full' },
  template: `
    <div class="flex h-full flex-col gap-4">
      @if (erro()) {
        <section class="rounded-3xl border border-rose-200/60 bg-white/95 px-6 py-5 text-sm text-slate-600 shadow-lg shadow-rose-200/40">
          <header class="flex items-center gap-3 text-rose-500">
            <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12V16.5zm9-4.5a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div class="flex flex-col">
              <span class="text-xs font-semibold uppercase tracking-[0.3em]">Falha ao calcular rota</span>
              <span class="text-sm font-semibold text-slate-800">Verifique os detalhes abaixo</span>
            </div>
          </header>

          <div class="mt-4 space-y-3">
            <div class="space-y-1">
              @if (erro()?.status) {
                <span class="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">HTTP {{ erro()!.status }}</span>
              }
              <p class="text-sm font-medium text-slate-700">{{ erro()!.mensagem }}</p>
            </div>

            <button
              type="button"
              (click)="alternarDetalhes()"
              class="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-600 transition hover:border-rose-300 hover:bg-rose-100">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                @if (mostrarDetalhes()) {
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18 15l-6-6-6 6" />
                } @else {
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
                }
              </svg>
              {{ mostrarDetalhes() ? 'Ocultar detalhes' : 'Mostrar detalhes' }}
            </button>

            @if (mostrarDetalhes()) {
              <pre class="max-h-52 overflow-auto rounded-2xl bg-rose-50/70 p-4 text-[12px] leading-relaxed text-rose-900 shadow-inner">{{ detalhesFormatados() }}</pre>
            }
          </div>
        </section>
      }

      @if (rota()) {
        <section class="flex h-full flex-col overflow-hidden rounded-3xl bg-white/95 shadow-xl ring-1 ring-slate-200/60">
          <header class="flex items-center gap-3 border-b border-slate-200/60 px-6 py-5">
            <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </span>
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">Resultado</p>
              <h2 class="text-lg font-semibold text-slate-900">Detalhes da rota</h2>
            </div>
          </header>

          @if (googleMapsUrl()) {
            <div class="border-b border-slate-200/60 px-6 py-4">
              <a
                class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
                [href]="googleMapsUrl()!"
                target="_blank"
                rel="noopener">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.6" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 10.5L21 6m0 0h-5.25M21 6v5.25" />
                </svg>
                Abrir no Google Maps
              </a>
            </div>
          }

          <div class="flex-1 overflow-y-auto px-6 pb-6 pt-4">
            <div class="grid gap-4">
              <div class="grid gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-600">
                <div class="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                  <span class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 12h1.5M19.5 12H21M12 3v1.5m0 15V21m-6-9a6 6 0 0112 0v0a6 6 0 01-12 0v0z" />
                    </svg>
                  </span>
                  <div class="flex flex-1 items-center justify-between">
                    <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Distância</span>
                    <span class="text-base font-bold text-indigo-600">{{ rota()!.distanciaEmMetros / 1000 | number:'1.1-1' }} km</span>
                  </div>
                </div>

                <div class="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                  <span class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l3 3" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div class="flex flex-1 items-center justify-between">
                    <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Duração</span>
                    <span class="text-base font-bold text-emerald-600">{{ rota()!.duracao }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class ResultadoRotaComponent {
  rota = input<RotaDto | null>(null);
  postosProximos = input<PostoComDistancias[]>([]);
  googleMapsUrl = input<string | null>(null);
  erro = input<ResumoErro | null>(null);

  mostrarDetalhes = signal(false);
  detalhesFormatados = computed(() => this.erro()?.detalhes ?? 'Nenhuma informação adicional disponível.');

  constructor() {
    effect(() => {
      this.erro();
      this.rota();
      this.mostrarDetalhes.set(false);
    });
  }

  alternarDetalhes() {
    this.mostrarDetalhes.update(valor => !valor);
  }
}
