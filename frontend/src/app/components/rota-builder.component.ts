import { Component, signal, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PontoInputComponent } from './ponto-input.component';
import { PontoGeografico } from '../models';

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
          color="primary" 
          [disabled]="!origem() || !destino() || calculando()"
          (click)="calcular()">
          @if (calculando()) {
            <mat-spinner diameter="20" style="display: inline-block; margin-right: 8px;"></mat-spinner>
          }
          @if (!calculando()) {
            <mat-icon>route</mat-icon>
          }
          {{ calculando() ? 'Calculando...' : 'Calcular Rota' }}
        </button>
        
        @if (origem() || destino() || waypoints().length > 0) {
          <button 
            mat-button 
            color="warn"
            (click)="limpar()">
            <mat-icon>clear_all</mat-icon>
            Limpar
          </button>
        }
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

    mat-card-actions button {
      width: 100%;
    }
  `
})
export class RotaBuilderComponent {
  origem = signal<PontoGeografico | null>(null);
  destino = signal<PontoGeografico | null>(null);
  waypoints = signal<(PontoGeografico | null)[]>([]);
  waypointsLabels = signal<string[]>([]);
  calculando = signal(false);
  
  enderecoOrigem = signal('');
  enderecoDestino = signal('');
  
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
}
