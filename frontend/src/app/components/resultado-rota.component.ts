import { Component, signal, input, computed, effect } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { DecimalPipe } from '@angular/common';
import { Posto, RotaDto } from '../models';

type ResumoErro = {
  status?: number;
  mensagem: string;
  detalhes: string;
};

@Component({
  selector: 'app-resultado-rota',
  imports: [
    MatCardModule, 
    MatListModule, 
    MatIconModule, 
    MatDividerModule,
    MatChipsModule,
    MatButtonModule,
    DecimalPipe
  ],
  host: { class: 'overlay-panel overlay-panel--wide overlay-panel--tall' },
  template: `
    @if (erro()) {
      <mat-card class="overlay-card overlay-card--error">
        <mat-card-header>
          <mat-card-title>
            <mat-icon color="warn">error</mat-icon>
            Falha ao calcular rota
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <div class="erro-resumo">
            @if (erro()?.status) {
              <span class="erro-status">HTTP {{ erro()!.status }}</span>
            }
            <span class="erro-mensagem">{{ erro()!.mensagem }}</span>
          </div>

          <button mat-stroked-button color="primary" (click)="alternarDetalhes()">
            <mat-icon>{{ mostrarDetalhes() ? 'expand_less' : 'expand_more' }}</mat-icon>
            {{ mostrarDetalhes() ? 'Ocultar detalhes' : 'Mostrar detalhes' }}
          </button>

          @if (mostrarDetalhes()) {
            <pre class="erro-detalhes">{{ detalhesFormatados() }}</pre>
          }
        </mat-card-content>
      </mat-card>
    }

    @if (rota()) {
      <mat-card class="overlay-card overlay-card--scrollable">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>info</mat-icon>
            Detalhes da Rota
          </mat-card-title>
        </mat-card-header>

        @if (googleMapsUrl()) {
          <mat-card-actions>
            <a mat-stroked-button color="primary" [href]="googleMapsUrl()!" target="_blank" rel="noopener">
              <mat-icon>open_in_new</mat-icon>
              Abrir no Google Maps
            </a>
          </mat-card-actions>
        }
        
        <mat-card-content>
          <div class="rota-info">
            <div class="info-item">
              <mat-icon>straighten</mat-icon>
              <span class="label">Distância:</span>
              <span class="value">{{ rota()!.distanciaEmMetros / 1000 | number:'1.1-1' }} km</span>
            </div>
            
            <div class="info-item">
              <mat-icon>schedule</mat-icon>
              <span class="label">Duração:</span>
              <span class="value">{{ rota()!.duracao }}</span>
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <div class="postos-header">
            <h3>
              <mat-icon>local_gas_station</mat-icon>
              Postos Próximos ({{ postosProximos().length }})
            </h3>
          </div>
          
          @if (postosProximos().length > 0) {
            <mat-list>
              @for (posto of postosProximos(); track posto.id || $index) {
                <mat-list-item>
                  <div class="posto-item">
                    <div class="posto-header">
                      <span class="posto-nome">{{ posto.nome }}</span>
                    </div>
                    <div class="posto-bandeira">{{ posto.bandeira }}</div>
                    <mat-chip-set>
                      @for (combustivel of posto.combustiveis; track combustivel) {
                        <mat-chip>{{ combustivel }}</mat-chip>
                      }
                    </mat-chip-set>
                  </div>
                </mat-list-item>
                <mat-divider></mat-divider>
              }
            </mat-list>
          } @else {
            <div class="empty-state">
              <mat-icon>search_off</mat-icon>
              <p>Nenhum posto encontrado próximo à rota</p>
            </div>
          }
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: `
      :host {
        display: block;
      }

    .overlay-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 20px;
    }

    mat-card-content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
      margin-top: 4px;
    }

    mat-card-actions {
      display: flex;
      padding: 0;
      margin: 0 0 12px 0;
    }

    mat-card-actions a {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .overlay-card--error {
      margin-bottom: 16px;
      border-left: 4px solid #f97316;
    }

    .erro-resumo {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 16px;
      color: var(--mat-sys-on-surface);
    }

    .erro-status {
      font-weight: 600;
      color: #b91c1c;
    }

    .erro-mensagem {
      font-size: 14px;
    }

    .erro-detalhes {
      margin-top: 16px;
      max-height: 200px;
      overflow: auto;
      background: rgba(0,0,0,0.04);
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.4;
      white-space: pre-wrap;
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

    .rota-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 16px;
      padding: 8px 0;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(0,0,0,0.02);
      padding: 12px;
      border-radius: 8px;
    }

    .info-item mat-icon {
      color: var(--mat-sys-primary);
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .info-item .label {
      font-weight: 500;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }

    .info-item .value {
      margin-left: auto;
      font-weight: 700;
      color: var(--mat-sys-primary);
      font-size: 16px;
    }

    mat-divider {
      margin: 16px 0;
    }

    .postos-header h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 16px 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    .postos-header mat-icon {
      color: var(--mat-sys-primary);
    }

    .posto-item {
      width: 100%;
      padding: 12px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .posto-header {
      display: flex;
      align-items: center;
      margin-bottom: 0;
    }

    .posto-nome {
      font-weight: 600;
      font-size: 15px;
      color: var(--mat-sys-on-surface);
      line-height: 1.4;
    }

    .posto-bandeira {
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 0;
      font-weight: 500;
    }

    mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }

    mat-chip {
      font-size: 12px;
      font-weight: 500;
    }

    mat-list-item {
      height: auto !important;
      padding: 8px 0 !important;
    }

    mat-list {
      padding: 0;
    }

    mat-divider {
      margin: 0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      color: var(--mat-sys-on-surface-variant);
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .empty-state p {
      text-align: center;
      margin: 0;
    }
  `
})
export class ResultadoRotaComponent {
  rota = input<RotaDto | null>(null);
  postosProximos = input<Posto[]>([]);
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
