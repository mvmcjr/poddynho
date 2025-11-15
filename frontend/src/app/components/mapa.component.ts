import { Component, input, signal, viewChild, output } from '@angular/core';
import { GoogleMapsModule, GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { Posto } from '../models';

@Component({
  selector: 'app-mapa',
  imports: [GoogleMapsModule],
  template: `
    <google-map
      #mapa="googleMap"
      [height]="'100vh'"
      [width]="'100vw'"
      [center]="centro()"
      [zoom]="zoom()"
      [options]="mapOptions">
      
      @for (posto of postos(); track posto.id || $index) {
        <map-marker
          #marker="mapMarker"
          [position]="{ 
            lat: posto.localizacao.latitude, 
            lng: posto.localizacao.longitude 
          }"
          [options]="posto.id === postoAtivoId() ? markerOptionsAtivo : markerOptionsPadrao"
          [title]="posto.nome"
          (mapClick)="abrirInfoWindow(marker, posto)" />
      }
      
      @if (polyline(); as path) {
        <map-polyline
          [path]="path"
          [options]="polylineOptions" />
      }

      <map-info-window (closeclick)="fecharInfoWindow()">
        @if (postoSelecionado(); as posto) {
          <div class="info-window">
            <div class="info-window__header">
              <div class="info-window__glyph">⛽</div>
              <div class="info-window__title-group">
                <span class="info-window__title">{{ posto.nome }}</span>
                <span class="info-window__subtitle">{{ posto.bandeira }}</span>
              </div>
            </div>

            <div class="info-window__chips">
              @for (combustivel of posto.combustiveis; track combustivel) {
                <span class="info-window__chip">{{ combustivel }}</span>
              }
            </div>

            <button type="button" class="info-window__action" (click)="adicionarPostoSelecionado()">
              Adicionar à rota
            </button>
          </div>
        }
      </map-info-window>
    </google-map>
  `,
  styles: `
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }

    google-map {
      width: 100%;
      height: 100%;
    }

    .info-window {
      min-width: 220px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      color: #0f172a;
    }

    .info-window__header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .info-window__glyph {
      font-size: 24px;
    }

    .info-window__title-group {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .info-window__title {
      font-weight: 600;
      font-size: 16px;
    }

    .info-window__subtitle {
      font-size: 13px;
      color: #475569;
    }

    .info-window__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .info-window__chip {
      padding: 4px 10px;
      border-radius: 999px;
      background: #e0f2fe;
      color: #0369a1;
      font-size: 12px;
      font-weight: 600;
    }

    .info-window__action {
      align-self: flex-start;
      padding: 8px 14px;
      border-radius: 999px;
      border: none;
      background: linear-gradient(135deg, #0ea5e9, #2563eb);
      color: #fff;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      box-shadow: 0 10px 18px rgba(37, 99, 235, 0.28);
    }

    .info-window__action:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 22px rgba(37, 99, 235, 0.32);
    }

    .info-window__action:active {
      transform: translateY(0);
      box-shadow: 0 6px 12px rgba(37, 99, 235, 0.24);
    }
  `
})
export class MapaComponent {
  centro = signal({ lat: -23.550520, lng: -46.633308 });
  zoom = signal(12);
  postos = input<Posto[]>([]);
  polyline = input<google.maps.LatLngLiteral[] | null>(null);
  adicionarPosto = output<{ posto: Posto; etiqueta?: string }>();
  private geocoder?: google.maps.Geocoder;

  mapa = viewChild.required(GoogleMap);
  infoWindow = viewChild(MapInfoWindow);

  postoSelecionado = signal<Posto | null>(null);
  postoAtivoId = signal<string | null>(null);

  mapOptions: google.maps.MapOptions = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    disableDefaultUI: false,
    zoomControl: true,
    fullscreenControl: false,
    streetViewControl: false,
    mapTypeControl: false
  };

  markerOptionsPadrao: google.maps.MarkerOptions = {
    title: 'Posto',
    zIndex: 5,
    icon: {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 4.93 7 13 7 13s7-8.07 7-13c0-3.87-3.13-7-7-7z',
      fillColor: '#38bdf8',
      fillOpacity: 1,
      strokeColor: '#0369a1',
      strokeWeight: 1.6,
      scale: 1.4,
      anchor: new google.maps.Point(12, 24)
    } as google.maps.Symbol
  };

  markerOptionsAtivo: google.maps.MarkerOptions = {
    title: 'Posto selecionado',
    zIndex: 6,
    icon: {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 4.93 7 13 7 13s7-8.07 7-13c0-3.87-3.13-7-7-7z',
      fillColor: '#2563eb',
      fillOpacity: 1,
      strokeColor: '#1e3a8a',
      strokeWeight: 1.8,
      scale: 1.55,
      anchor: new google.maps.Point(12, 24)
    } as google.maps.Symbol
  };

  polylineOptions: google.maps.PolylineOptions = {
    strokeColor: '#4285F4',
    strokeWeight: 5,
    strokeOpacity: 0.8
  };

  focusPolyline(path: google.maps.LatLngLiteral[]) {
    const mapa = this.mapa();
    const googleMap = mapa.googleMap;
    if (!googleMap || path.length === 0) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const ponto of path) {
      bounds.extend(ponto);
    }

    googleMap.fitBounds(bounds, { top: 64, bottom: 64, left: 64, right: 64 });
    this.fecharInfoWindow();
  }

  abrirInfoWindow(marker: MapMarker, posto: Posto) {
    this.postoSelecionado.set(posto);
    this.postoAtivoId.set(posto.id);
    const infoWindow = this.infoWindow();
    infoWindow?.open(marker);
  }

  fecharInfoWindow() {
    const infoWindow = this.infoWindow();
    infoWindow?.close();
    this.postoSelecionado.set(null);
    this.postoAtivoId.set(null);
  }

  async adicionarPostoSelecionado() {
    const posto = this.postoSelecionado();
    if (!posto) {
      return;
    }

    this.fecharInfoWindow();

    const cidade = await this.resolverCidade(posto);
    const etiqueta = cidade ? `${posto.nome} - ${cidade}` : posto.nome;

    this.adicionarPosto.emit({ posto, etiqueta });
  }

  private resolverCidade(posto: Posto): Promise<string | undefined> {
    if (!this.geocoder) {
      this.geocoder = new google.maps.Geocoder();
    }

    return new Promise(resolve => {
      this.geocoder!.geocode(
        {
          location: {
            lat: posto.localizacao.latitude,
            lng: posto.localizacao.longitude
          }
        },
        (results, status) => {
          if (status !== google.maps.GeocoderStatus.OK || !results || results.length === 0) {
            resolve(undefined);
            return;
          }

          const componentes = results[0].address_components ?? [];
          const primaria = componentes.find(comp => comp.types.includes('locality'))
            ?? componentes.find(comp => comp.types.includes('administrative_area_level_2'))
            ?? componentes.find(comp => comp.types.includes('administrative_area_level_1'));

          resolve(primaria?.long_name);
        }
      );
    });
  }
}
