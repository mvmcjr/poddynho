import { Component, signal, output, effect, computed } from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { NgIconComponent } from '@ng-icons/core';
import { PontoInputComponent } from './ponto-input.component';
import { PostoWaypointComponent } from './posto-waypoint.component';
import { PontoGeografico, Posto } from '../models';

type WaypointRegular = {
    tipo: 'regular';
    ponto: PontoGeografico | null;
    label: string;
};

type WaypointPosto = {
    tipo: 'posto';
    posto: Posto;
    label: string;
};

type Waypoint = WaypointRegular | WaypointPosto;

type SnapshotEstado = {
    origem: PontoGeografico | null;
    destino: PontoGeografico | null;
    waypoints: (PontoGeografico | null)[];
};

type ParametrosCalculo = {
    origem: PontoGeografico;
    destino: PontoGeografico;
    waypoints: PontoGeografico[];
};

@Component({
    selector: 'app-rota-builder',
    imports: [DragDropModule, PontoInputComponent, PostoWaypointComponent, NgIconComponent],
    host: { class: 'block w-full' },
    template: `
    <div class="relative overflow-hidden rounded-3xl bg-white/95 shadow ring-1 ring-slate-200/60">
      <header class="flex items-center gap-3 border-b border-slate-200/60 px-5 py-4">
        <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-600">
          <ng-icon name="matRouteOutline" class="h-6 w-6" />
        </span>
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">Planejar</p>
          <h2 class="text-lg font-semibold text-slate-900">Planejar Rota</h2>
        </div>
      </header>

      <div class="flex flex-col gap-5 px-5 pb-5 pt-4">
        <div class="route-steps flex flex-col gap-5">
          <!-- Origem -->
          <div class="route-point relative grid grid-cols-[48px_1fr] items-start gap-3">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 ring-4 ring-white">
              {{ marcadorOrigem }}
            </div>
            <div class="min-w-0">
              <app-ponto-input
                [(ponto)]="origem"
                [(endereco)]="enderecoOrigem"
                label="Origem"
                icon="trip_origin"/>
            </div>
          </div>

          <!-- Paradas Intermediárias -->
          <section
            class="waypoints-section relative flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-slate-50/80 p-4 shadow-lg shadow-slate-900/5"
            aria-label="Paradas intermediárias">
            <header class="flex items-center justify-between px-1">
              <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                <ng-icon name="matLocationOnOutline" class="h-4 w-4" />
                <span>Paradas intermediárias</span>
              </div>
              @if (waypoints().length > 0) {
                <span
                  class="inline-flex h-6 items-center rounded-full bg-indigo-100 px-2.5 text-xs font-semibold text-indigo-600">
                  {{ waypoints().length }}
                </span>
              }
            </header>

            <div
              class="flex flex-col gap-3"
              cdkDropList
              (cdkDropListDropped)="onWaypointsDropped($event)"
              [cdkDropListDisabled]="waypoints().length <= 1">
              @for (waypoint of waypoints(); track waypointIds()[$index]) {
                <div
                  class="route-stop group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md"
                  cdkDrag>
                  <!-- Left: Marker Badge with Drag Handle on Hover -->
                  <div class="relative flex-shrink-0">
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ring-2 ring-white transition-all group-hover:ring-4"
                      [class]="waypoint.tipo === 'posto' ? 'bg-emerald-100 text-emerald-600 group-hover:ring-emerald-50' : 'bg-indigo-100 text-indigo-600 group-hover:ring-indigo-50'"
                      cdkDragHandle
                      [attr.aria-label]="'Parada ' + obterMarcadorParada($index)">
                      <span class="transition-opacity group-hover:opacity-0">{{ obterMarcadorParada($index) }}</span>
                      <ng-icon name="matDragIndicator" class="absolute h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </div>

                  <!-- Middle: Waypoint Content (shrinks on hover) -->
                  <div class="min-w-0 flex-1 transition-all duration-300 group-hover:mr-12">
                    @if (waypoint.tipo === 'posto') {
                      <app-posto-waypoint
                        [posto]="waypoint.posto"/>
                    } @else {
                      <app-ponto-input
                        [(ponto)]="waypoint.ponto"
                        [label]="waypoint.label"
                        [valorInicial]="waypoint.label"
                        [compact]="true"
                        [readonly]="false"
                        icon="location_on"/>
                    }
                  </div>

                  <!-- Right: Remove Button (slides in on hover) -->
                  <button
                    type="button"
                    (click)="removerWaypoint($index)"
                    class="absolute right-3 flex h-9 w-9 translate-x-12 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition-all duration-300 hover:bg-rose-100 hover:text-rose-600 group-hover:translate-x-0 active:scale-95"
                    aria-label="Remover parada {{ $index + 1 }}">
                    <ng-icon name="matCloseOutline" class="h-5 w-5" />
                  </button>
                </div>
              }
            </div>

            <button
              type="button"
              (click)="adicionarWaypoint()"
              class="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100 active:scale-95">
              <ng-icon name="matAddOutline" class="h-4 w-4" />
              Adicionar parada
            </button>
          </section>

          <!-- Destino -->
          <div class="route-point relative grid grid-cols-[48px_1fr] items-start gap-3">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 ring-4 ring-white">
              {{ marcadorDestino() }}
            </div>
            <div class="min-w-0">
              <app-ponto-input
                [(ponto)]="destino"
                [(endereco)]="enderecoDestino"
                label="Destino"
                icon="place"/>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          @if (origem() && destino() && (alteracoesPendentes() || calculando())) {
            <button
              type="button"
              [disabled]="calculando()"
              (click)="calcular()"
              class="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
              @if (calculando()) {
                <ng-icon name="matProgressActivityOutline" class="h-5 w-5 animate-spin" />
              }
              @if (!calculando() && alteracoesPendentes()) {
                <ng-icon name="matRefreshOutline" class="h-5 w-5" />
              }
              {{ calculando() ? 'Calculando...' : 'Calcular Rota' }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
    styles: `
    :host {
      display: block;
    }

    .route-steps {
      position: relative;
    }

    /* Main connector line between origin and destination */
    .route-steps::before {
      content: '';
      position: absolute;
      left: 1.125rem; /* 18px - centers on 36px marker (18px from edge) */
      top: 2.75rem;
      bottom: 2.75rem;
      width: 2px;
      background: linear-gradient(
          180deg,
          rgba(99, 102, 241, 0.3) 0%,
          rgba(148, 163, 184, 0.4) 15%,
          rgba(148, 163, 184, 0.4) 85%,
          rgba(244, 63, 94, 0.3) 100%
      );
      pointer-events: none;
      z-index: 0;
    }

    .route-point {
      position: relative;
      z-index: 1;
    }

    .waypoints-section {
      position: relative;
      z-index: 1;
    }

    /* Drag and drop states */
    .route-stop.cdk-drag-preview {
      box-shadow: 0 20px 40px rgba(79, 70, 229, 0.3), 0 0 0 1px rgba(99, 102, 241, 0.1);
      border-color: rgba(99, 102, 241, 0.4);
      background: #ffffff;
      transform: rotate(2deg);
    }

    .route-stop.cdk-drag-placeholder {
      opacity: 0.3;
      border-style: dashed;
      background: rgba(99, 102, 241, 0.05);
    }

    .route-stop.cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .cdk-drop-list-dragging .route-stop:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0.2, 0, 0.2, 1);
    }
  `
})
export class RotaBuilderComponent {
    origem = signal<PontoGeografico | null>(null);
    destino = signal<PontoGeografico | null>(null);
    waypoints = signal<Waypoint[]>([]);
    waypointIds = signal<string[]>([]);
    calculando = signal(false);
    alteracoesPendentes = signal(false);
    alteracoesPendentesChange = output<boolean>();

    enderecoOrigem = signal('');
    enderecoDestino = signal('');
    readonly marcadorOrigem = 'A';
    marcadorDestino = computed(() => this.indiceParaMarcador(this.waypoints().length + 1));
    private ultimoSnapshotCalculado: SnapshotEstado = this.criarSnapshotAtual();
    private estadoAlterado = false;

    constructor() {
        effect(() => {
            const snapshot = this.criarSnapshotAtual();
            const alterado = !this.snapshotsIguais(snapshot, this.ultimoSnapshotCalculado);
            if (alterado !== this.estadoAlterado) {
                this.estadoAlterado = alterado;
                this.alteracoesPendentes.set(alterado);
                this.alteracoesPendentesChange.emit(alterado);
            }
        });
    }


    calcularRota = output<{
        origem: PontoGeografico;
        destino: PontoGeografico;
        waypoints: PontoGeografico[];
    }>();

    adicionarWaypoint() {
        const newWaypoint: WaypointRegular = {
            tipo: 'regular',
            ponto: null,
            label: this.gerarEtiquetaPadrao(this.waypoints().length)
        };
        this.waypoints.update(w => [...w, newWaypoint]);
        this.waypointIds.update(ids => [...ids, this.gerarWaypointId()]);
    }

    removerWaypoint(index: number) {
        this.waypoints.update(w => w.filter((_, i) => i !== index));
        this.waypointIds.update(ids => ids.filter((_, i) => i !== index));
    }

    onWaypointsDropped(event: CdkDragDrop<(PontoGeografico | null)[]>) {
        if (event.previousIndex === event.currentIndex) return;
        this.reordenarWaypoint(event.previousIndex, event.currentIndex);
    }

    adicionarParada(posto: Posto, etiqueta?: string) {
        const existenteIndex = this.waypoints()
            .findIndex(item =>
                item.tipo === 'posto' &&
                item.posto.localizacao.latitude === posto.localizacao.latitude &&
                item.posto.localizacao.longitude === posto.localizacao.longitude
            );

        if (existenteIndex >= 0) {
            if (etiqueta) {
                this.waypoints.update(waypoints => {
                    const copia = [...waypoints];
                    const waypoint = copia[existenteIndex];
                    if (waypoint.tipo === 'posto') {
                        copia[existenteIndex] = { ...waypoint, label: etiqueta };
                    }
                    return copia;
                });
            }
            return;
        }

        const etiquetaFinal = etiqueta && etiqueta.trim().length > 0
            ? etiqueta.trim()
            : this.gerarEtiquetaPadrao(this.waypoints().length);

        const newWaypoint: WaypointPosto = {
            tipo: 'posto',
            posto,
            label: etiquetaFinal
        };

        this.waypoints.update(w => [...w, newWaypoint]);
        this.waypointIds.update(ids => [...ids, this.gerarWaypointId()]);
    }

    calcular() {
        const origem = this.origem();
        const destino = this.destino();

        if (!origem || !destino) return;

        const waypoints = this.waypoints()
            .map(w => w.tipo === 'posto' ? w.posto.localizacao : w.ponto)
            .filter(p => p !== null) as PontoGeografico[];

        this.calcularRota.emit({ origem, destino, waypoints });
    }

    limpar() {
        this.origem.set(null);
        this.destino.set(null);
        this.waypoints.set([]);
        this.waypointIds.set([]);
        this.enderecoOrigem.set('');
        this.enderecoDestino.set('');
    }

    setCalculando(value: boolean) {
        this.calculando.set(value);
    }

    confirmarCalculoAtual(parametros?: ParametrosCalculo) {
        if (parametros) {
            this.ultimoSnapshotCalculado = {
                origem: this.clonarPonto(parametros.origem),
                destino: this.clonarPonto(parametros.destino),
                waypoints: parametros.waypoints.map(ponto => this.clonarPonto(ponto))
            };
        } else {
            this.ultimoSnapshotCalculado = this.criarSnapshotAtual();
        }

        const atual = this.criarSnapshotAtual();
        const alterado = !this.snapshotsIguais(atual, this.ultimoSnapshotCalculado);
        this.estadoAlterado = alterado;
        this.alteracoesPendentes.set(alterado);
        this.alteracoesPendentesChange.emit(alterado);
    }

    gerarEtiquetaPadrao(indice: number) {
        return `Parada ${indice + 1}`;
    }

    obterMarcadorParada(indice: number) {
        return this.indiceParaMarcador(indice + 1);
    }

    obterWaypointsComoArray(): PontoGeografico[] {
        return this.waypoints()
            .map(w => w.tipo === 'posto' ? w.posto.localizacao : w.ponto)
            .filter((p): p is PontoGeografico => p !== null);
    }

    private reordenarWaypoint(origem: number, destino: number) {
        this.waypoints.update(w => this.moverItem(w, origem, destino));
        this.waypointIds.update(ids => this.moverItem(ids, origem, destino));
    }

    private criarSnapshotAtual(): SnapshotEstado {
        return {
            origem: this.clonarPonto(this.origem()),
            destino: this.clonarPonto(this.destino()),
            waypoints: this.waypoints().map(w =>
                w.tipo === 'posto'
                    ? this.clonarPonto(w.posto.localizacao)
                    : this.clonarPonto(w.ponto)
            )
        };
    }

    private snapshotsIguais(atual: SnapshotEstado, referencia: SnapshotEstado) {
        if (!this.pontosIguais(atual.origem, referencia.origem)) return false;
        if (!this.pontosIguais(atual.destino, referencia.destino)) return false;
        if (atual.waypoints.length !== referencia.waypoints.length) return false;
        for (let i = 0; i < atual.waypoints.length; i += 1) {
            if (!this.pontosIguais(atual.waypoints[i], referencia.waypoints[i])) return false;
        }
        return true;
    }

    private pontosIguais(a: PontoGeografico | null, b: PontoGeografico | null) {
        if (!a && !b) return true;
        if (!a || !b) return false;
        return a.latitude === b.latitude && a.longitude === b.longitude;
    }

    private clonarPonto(ponto: PontoGeografico | null) {
        if (!ponto) return null;
        return { latitude: ponto.latitude, longitude: ponto.longitude };
    }

    private moverItem<T>(lista: T[], origem: number, destino: number) {
        const copia = [...lista];
        const [item] = copia.splice(origem, 1);
        copia.splice(destino, 0, item);
        return copia;
    }

    private indiceParaMarcador(indice: number) {
        let valor = indice;
        let marcador = '';
        while (valor >= 0) {
            marcador = String.fromCharCode(65 + (valor % 26)) + marcador;
            valor = Math.floor(valor / 26) - 1;
        }
        return marcador;
    }

    private gerarWaypointId() {
        const uuid = globalThis.crypto?.randomUUID?.();
        if (uuid) return `wp-${uuid}`;
        return `wp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    }
}
