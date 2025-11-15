import { Component, signal, viewChild } from '@angular/core';
import { MapaComponent } from './components/mapa.component';
import { RotaBuilderComponent } from './components/rota-builder.component';
import { ResultadoRotaComponent } from './components/resultado-rota.component';
import { FiltrosRotaComponent } from './components/filtros-rota.component';
import { RotaService } from './services/rota.service';
import { Posto, PontoGeografico, RotaDto, Combustivel } from './models';
import { decodePolyline } from './utils/polyline';

@Component({
  selector: 'app-root',
  imports: [MapaComponent, RotaBuilderComponent, ResultadoRotaComponent, FiltrosRotaComponent],
  template: `
    <app-mapa 
      [postos]="postos()" 
      [polyline]="polyline()"
      (adicionarPosto)="onAdicionarPosto($event)">
    </app-mapa>

    <div class="overlay">
      <div class="overlay__column overlay__column--left">
        <app-rota-builder (calcularRota)="onCalcularRota($event)"></app-rota-builder>

        <app-filtros-rota 
          [(tiposCombustivel)]="tiposCombustivel"
          [(distanciaMaximaEmKm)]="distanciaMaximaEmKm">
        </app-filtros-rota>
      </div>

      <div class="overlay__column overlay__column--right">
        <app-resultado-rota 
          [rota]="rota()" 
          [postosProximos]="postosProximos()">
        </app-resultado-rota>
      </div>
    </div>
  `,
  styleUrl: './app.scss'
})
export class App {
  rotaBuilder = viewChild.required(RotaBuilderComponent);
  mapa = viewChild.required(MapaComponent);
  
  postos = signal<Posto[]>([]);
  polyline = signal<google.maps.LatLngLiteral[] | null>(null);
  rota = signal<RotaDto | null>(null);
  postosProximos = signal<Posto[]>([]);
  
  tiposCombustivel = signal<Combustivel[]>([]);
  distanciaMaximaEmKm = signal<number>(20);

  constructor(private rotaService: RotaService) {}

  onCalcularRota(event: { origem: PontoGeografico; destino: PontoGeografico; waypoints: PontoGeografico[] }) {
    this.rotaBuilder().setCalculando(true);
    
    this.rotaService.calcularRota({
      origem: event.origem,
      destino: event.destino,
      pontosIntermediarios: event.waypoints.length > 0 ? event.waypoints : undefined,
      tiposCombustivel: this.tiposCombustivel().length > 0 ? this.tiposCombustivel() : undefined,
      distanciaMaximaEmKm: this.distanciaMaximaEmKm()
    }).subscribe({
      next: (resposta) => {
        this.rota.set(resposta.rota);
        this.postosProximos.set(resposta.postosProximos);
        this.postos.set(resposta.postosProximos);
        
        const decodedPolyline = decodePolyline(resposta.rota.polyline);
        this.polyline.set(decodedPolyline);
        this.mapa().focusPolyline(decodedPolyline);
        
        this.rotaBuilder().setCalculando(false);
      },
      error: (error) => {
        console.error('Erro ao calcular rota:', error);
        this.rotaBuilder().setCalculando(false);
      }
    });
  }

  onAdicionarPosto(evento: { posto: Posto; etiqueta?: string }) {
    this.rotaBuilder().adicionarParada(evento.posto.localizacao, evento.etiqueta ?? evento.posto.nome);
  }
}
