import { Component, model } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Combustivel } from '../models';

@Component({
  selector: 'app-filtros-rota',
  imports: [
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatSliderModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  host: { class: 'overlay-panel overlay-panel--narrow' },
  template: `
    <mat-card class="overlay-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>tune</mat-icon>
          Filtros
        </mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <div class="filter-section">
          <h3>
            <mat-icon>local_gas_station</mat-icon>
            Tipos de Combustível
          </h3>
          
          <mat-chip-set multiple>
            @for (tipo of todosCombustiveis; track tipo) {
              <mat-chip-option 
                [selected]="tiposCombustivel().includes(tipo)"
                (click)="toggleCombustivel(tipo)">
                {{ tipo }}
              </mat-chip-option>
            }
          </mat-chip-set>
        </div>

        <div class="filter-section">
          <h3>
            <mat-icon>social_distance</mat-icon>
            Distância Máxima
          </h3>
          
          <div class="slider-container">
            <mat-slider 
              min="5" 
              max="50" 
              step="5"
              [discrete]="true"
              [showTickMarks]="true">
              <input matSliderThumb [(ngModel)]="distanciaMaximaEmKm">
            </mat-slider>
            
            <div class="slider-value">
              {{ distanciaMaximaEmKm() }} km
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
    }

    .overlay-card {
      width: 100%;
      padding: 20px;
    }

    mat-card-header {
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
      margin-bottom: 16px;
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
      gap: 24px;
    }

    .filter-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 12px 0;
      color: var(--mat-sys-on-surface);
    }

    .filter-section h3 mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--mat-sys-primary);
    }

    mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    mat-chip-option {
      font-size: 13px;
    }

    .slider-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    mat-slider {
      width: 100%;
    }

    .slider-value {
      text-align: center;
      font-weight: 700;
      font-size: 18px;
      color: var(--mat-sys-primary);
      padding: 8px;
      background: rgba(0,0,0,0.02);
      border-radius: 8px;
    }

    .filter-section {
      display: flex;
      flex-direction: column;
    }
  `
})
export class FiltrosRotaComponent {
  todosCombustiveis: Combustivel[] = ['Gasolina', 'Etanol', 'Aditivada', 'Premium'];
  
  tiposCombustivel = model<Combustivel[]>([]);
  distanciaMaximaEmKm = model<number>(20);

  toggleCombustivel(tipo: Combustivel) {
    const tipos = this.tiposCombustivel();
    if (tipos.includes(tipo)) {
      this.tiposCombustivel.set(tipos.filter(t => t !== tipo));
    } else {
      this.tiposCombustivel.set([...tipos, tipo]);
    }
  }
}
