import { Component, signal, output, effect, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PontoInputComponent } from './ponto-input.component';
import { PontoGeografico } from '../models';

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
  imports: [
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule,
    PontoInputComponent
  ],
  host: { class: 'overlay-panel overlay-panel--narrow' },
  template: `
    <mat-card class="overlay-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>directions</mat-icon>
          Planejar Rota
        </mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <app-ponto-input 
          [(ponto)]="origem" 
          [(endereco)]="enderecoOrigem"
          label="Origem" 
          icon="trip_origin" />
        
        @for (waypoint of waypoints(); track $index) {
          <div class="waypoint-container">
            <app-ponto-input 
              [(ponto)]="waypoints()[$index]" 
              [label]="obterEtiquetaParada($index)" 
              icon="location_on" />
            <button 
              mat-icon-button 
              color="warn"
              (click)="removerWaypoint($index)"
              class="remove-button">
              <mat-icon>remove_circle</mat-icon>
            </button>
          </div>
        }
        
        <button 
          mat-stroked-button 
          (click)="adicionarWaypoint()"
          class="add-waypoint-button">
          <mat-icon>add_location</mat-icon>
          Adicionar Parada
        </button>
        
        <app-ponto-input 
          [(ponto)]="destino" 
          [(endereco)]="enderecoDestino"
          label="Destino" 
          icon="place" />
      </mat-card-content>
      
      <mat-card-actions>
        <button 
          mat-raised-button 
          class="calcular-button"
          [class.calcular-button--primary]="!estadoWarn()"
          [class.calcular-button--warn]="estadoWarn()"
          [style.color]="corTextoBotao()"
          [style.--mdc-filled-button-label-text-color]="corTextoBotao()"
          [style.--mdc-filled-button-icon-color]="corTextoBotao()"
          [disabled]="!origem() || !destino() || calculando()"
          (click)="calcular()">
          @if (calculando()) {
            <mat-spinner 
              [color]="estadoWarn() ? 'warn' : 'primary'"
              diameter="20" 
              style="display: inline-block; margin-right: 8px;">
            </mat-spinner>
          }
          @if (!calculando()) {
            <mat-icon>route</mat-icon>
          }
          {{ calculando() ? 'Calculando...' : alteracoesPendentes() ? 'Recalcular Rota' : 'Calcular Rota' }}
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
    }

    .overlay-card {
      width: 100%;
      overflow: visible;
      padding: 20px 20px 12px 20px;
    }

    mat-card-header {
      padding-bottom: 12px;
      margin-bottom: 16px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
    }

    mat-card-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-bottom: 8px;
    }

    .waypoint-container {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .waypoint-container app-ponto-input {
      flex: 1;
    }

    .remove-button {
      margin-top: 4px;
    }

    .add-waypoint-button {
      width: 100%;
      margin: 8px 0;
    }

    mat-card-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      padding-top: 12px;
      border-top: 1px solid rgba(0,0,0,0.08);
    }

    .calcular-button {
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
      border: none;
      border-radius: 999px;
      padding: 0 24px;
      min-height: 46px;
      color: #f8fafc;
      --mdc-filled-button-container-color: transparent;
    }

    .calcular-button mat-icon {
      color: inherit;
    }

    .calcular-button--primary {
      background: linear-gradient(135deg, #2563eb, #6366f1 45%, #a855f7);
      box-shadow: 0 12px 28px rgba(79, 70, 229, 0.28);
    }

    .calcular-button--primary:hover:not([disabled]) {
      transform: translateY(-1px);
      filter: brightness(1.05);
      box-shadow: 0 14px 32px rgba(79, 70, 229, 0.36);
    }

    .calcular-button:disabled {
      background: linear-gradient(135deg, #bfdbfe, #ddd6fe);
      color: rgba(30, 41, 59, 0.7);
      --mdc-filled-button-disabled-label-text-color: rgba(30, 41, 59, 0.7);
      --mdc-filled-button-icon-color: rgba(30, 41, 59, 0.7);
      box-shadow: none;
      transform: none;
      filter: none;
    }

    .calcular-button:disabled .mdc-button__label {
      color: rgba(30, 41, 59, 0.7) !important;
    }

    .calcular-button .mdc-button__label {
      color: inherit !important;
      text-shadow: 0 1px 2px rgba(15, 23, 42, 0.25);
    }

    .calcular-button--warn {
      background: linear-gradient(135deg, #f97316, #f43f5e 40%, #d946ef);
      box-shadow: 0 12px 28px rgba(244, 63, 94, 0.32);
      text-shadow: 0 1px 2px rgba(119, 29, 29, 0.35);
    }

    .calcular-button--warn:hover:not([disabled]) {
      transform: translateY(-1px);
      filter: brightness(1.05);
      box-shadow: 0 14px 32px rgba(244, 63, 94, 0.4);
    }
  `
})
export class RotaBuilderComponent {
  origem = signal<PontoGeografico | null>(null);
  destino = signal<PontoGeografico | null>(null);
  waypoints = signal<(PontoGeografico | null)[]>([]);
  waypointsLabels = signal<string[]>([]);
  calculando = signal(false);
  alteracoesPendentes = signal(false);
  alteracoesPendentesChange = output<boolean>();
  
  enderecoOrigem = signal('');
  enderecoDestino = signal('');
  estadoWarn = computed(() => this.alteracoesPendentes() && !this.calculando());
  corTextoBotao = computed(() => (this.estadoWarn() ? '#fff5f5' : '#f8fafc'));
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
    this.waypoints.update(w => [...w, null]);
    this.waypointsLabels.update(labels => [...labels, this.gerarEtiquetaPadrao(labels.length)]);
  }
  
  removerWaypoint(index: number) {
    this.waypoints.update(w => w.filter((_, i) => i !== index));
    this.waypointsLabels.update(labels => this.reindexarEtiquetasPadrao(labels.filter((_, i) => i !== index)));
  }

  adicionarParada(ponto: PontoGeografico, etiqueta?: string) {
    const existenteIndex = this.waypoints()
      .findIndex(item => item && item.latitude === ponto.latitude && item.longitude === ponto.longitude);

    if (existenteIndex >= 0) {
      if (etiqueta) {
        this.waypointsLabels.update(labels => {
          const copia = [...labels];
          copia[existenteIndex] = etiqueta;
          return copia;
        });
      }
      return;
    }

    const etiquetaFinal = etiqueta && etiqueta.trim().length > 0
      ? etiqueta.trim()
      : this.gerarEtiquetaPadrao(this.waypointsLabels().length);

    this.waypoints.update(w => [...w, ponto]);
    this.waypointsLabels.update(labels => [...labels, etiquetaFinal]);
  }
  
  calcular() {
    const origem = this.origem();
    const destino = this.destino();
    
    if (!origem || !destino) return;
    
    const waypoints = this.waypoints().filter(w => w !== null) as PontoGeografico[];
    
    this.calcularRota.emit({ origem, destino, waypoints });
  }
  
  limpar() {
    this.origem.set(null);
    this.destino.set(null);
    this.waypoints.set([]);
    this.waypointsLabels.set([]);
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

  obterEtiquetaParada(indice: number) {
    const labels = this.waypointsLabels();
    return labels[indice] ?? this.gerarEtiquetaPadrao(indice);
  }

  private gerarEtiquetaPadrao(indice: number) {
    return `Parada ${indice + 1}`;
  }

  private reindexarEtiquetasPadrao(labels: string[]) {
    return labels.map((label, indice) =>
      label.startsWith('Parada ')
        ? this.gerarEtiquetaPadrao(indice)
        : label
    );
  }

  private criarSnapshotAtual(): SnapshotEstado {
    return {
      origem: this.clonarPonto(this.origem()),
      destino: this.clonarPonto(this.destino()),
      waypoints: this.waypoints().map(ponto => this.clonarPonto(ponto))
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
}
