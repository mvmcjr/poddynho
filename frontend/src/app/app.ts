import { Component, signal, viewChild, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MapaComponent } from './components/mapa.component';
import { RotaBuilderComponent } from './components/rota-builder.component';
import { ResultadoRotaComponent } from './components/resultado-rota.component';
import { FiltrosRotaComponent } from './components/filtros-rota.component';
import { RotaService } from './services/rota.service';
import { Posto, PostoComDistancias, PontoGeografico, RotaDto, Combustivel } from './models';
import { decodePolyline } from './utils/polyline';

type ParametrosRota = {
  origem: PontoGeografico;
  destino: PontoGeografico;
  waypoints: PontoGeografico[];
};

type ErroCalculo = {
  status?: number;
  mensagem: string;
  detalhes: string;
};

@Component({
  selector: 'app-root',
  imports: [MapaComponent, RotaBuilderComponent, ResultadoRotaComponent, FiltrosRotaComponent],
  template: `
    <div class="relative h-full min-h-screen w-full">
      <app-mapa 
        class="absolute inset-0"
        [postos]="postos()" 
        [polyline]="polyline()"
        [origem]="rotaBuilder().origem()"
        [destino]="rotaBuilder().destino()"
        [waypoints]="rotaBuilder().obterWaypointsComoArray()"
        (adicionarPosto)="onAdicionarPosto($event)">
      </app-mapa>

      <div
        class="pointer-events-none absolute inset-0 flex items-start justify-between gap-8 p-8 xl:p-10 max-xl:gap-6 max-xl:p-6 max-lg:flex-col max-lg:items-stretch max-lg:justify-start max-lg:gap-4 max-lg:p-4">
        <div
          class="pointer-events-auto flex max-h-[calc(100vh-64px)] w-[clamp(280px,28vw,360px)] flex-col gap-5 overflow-y-auto rounded-3xl p-1 max-lg:w-full max-lg:max-h-none max-lg:bg-transparent max-lg:p-0">
          <app-rota-builder 
            (calcularRota)="onCalcularRota($event)"
            (alteracoesPendentesChange)="onAlteracoesPendentes($event)">
          </app-rota-builder>

          <app-filtros-rota 
            [(tiposCombustivel)]="tiposCombustivel"
            [(distanciaMaximaEmKm)]="distanciaMaximaEmKm">
          </app-filtros-rota>
        </div>

        <div
          class="pointer-events-auto flex max-h-[calc(100vh-64px)] w-[clamp(320px,32vw,420px)] flex-col gap-5 overflow-y-auto rounded-3xl bg-white/70 p-1 max-lg:w-full max-lg:max-h-none max-lg:bg-transparent max-lg:p-0">
          <app-resultado-rota 
            [rota]="rotaParaExibicao()" 
            [postosProximos]="postosParaExibicao()"
            [googleMapsUrl]="googleMapsUrlExibicao()"
            [erro]="erroCalculo()">
          </app-resultado-rota>
        </div>
      </div>
    </div>
  `
})
export class App {
  rotaBuilder = viewChild.required(RotaBuilderComponent);
  mapa = viewChild.required(MapaComponent);
  
  postos = signal<Posto[]>([]);
  polyline = signal<google.maps.LatLngLiteral[] | null>(null);
  rota = signal<RotaDto | null>(null);
  postosProximos = signal<PostoComDistancias[]>([]);
  
  tiposCombustivel = signal<Combustivel[]>([]);
  distanciaMaximaEmKm = signal<number>(20);
  parametrosRotaAtual = signal<ParametrosRota | null>(null);
  erroCalculo = signal<ErroCalculo | null>(null);
  rotaVisivel = signal(false);
  googleMapsUrl = computed(() => {
    const parametros = this.parametrosRotaAtual();
    if (!parametros) return null;
    return this.montarGoogleMapsUrl(parametros);
  });
  rotaParaExibicao = computed(() => (this.rotaVisivel() ? this.rota() : null));
  postosParaExibicao = computed(() => (this.rotaVisivel() ? this.postosProximos() : []));
  googleMapsUrlExibicao = computed(() => (this.rotaVisivel() ? this.googleMapsUrl() : null));
  private parametrosPendentes: ParametrosRota | null = null;

  constructor(private rotaService: RotaService) {}

  onCalcularRota(event: { origem: PontoGeografico; destino: PontoGeografico; waypoints: PontoGeografico[] }) {
    const parametros = this.clonarParametros(event);
    this.parametrosPendentes = parametros;
    this.rotaBuilder().setCalculando(true);
    this.erroCalculo.set(null);
    this.postosProximos.set([]);
    this.postos.set([]);
    this.rotaVisivel.set(false);

    this.rotaService.calcularRota({
      origem: parametros.origem,
      destino: parametros.destino,
      pontosIntermediarios: parametros.waypoints.length > 0 ? parametros.waypoints : undefined,
      tiposCombustivel: this.tiposCombustivel().length > 0 ? this.tiposCombustivel() : undefined,
      distanciaMaximaEmKm: this.distanciaMaximaEmKm()
    }).subscribe({
      next: (resposta) => {
        this.rota.set(resposta.rota);
        this.postosProximos.set(resposta.postosProximos);
        this.postos.set(resposta.postosProximos);
        this.erroCalculo.set(null);
        
        const decodedPolyline = decodePolyline(resposta.rota.polyline);
        this.polyline.set(decodedPolyline);
        this.mapa().focusPolyline(decodedPolyline);

        if (this.parametrosPendentes) {
          this.parametrosRotaAtual.set(this.parametrosPendentes);
          this.rotaBuilder().confirmarCalculoAtual(this.parametrosPendentes);
          this.parametrosPendentes = null;
        } else {
          this.rotaBuilder().confirmarCalculoAtual();
        }
        this.rotaBuilder().setCalculando(false);
          this.rotaVisivel.set(true);
      },
      error: (error) => {
        this.erroCalculo.set(this.criarErroCalculo(error));
        this.parametrosPendentes = null;
        this.rotaBuilder().setCalculando(false);
      }
    });
  }

  onAdicionarPosto(evento: { posto: Posto; etiqueta?: string }) {
    this.rotaBuilder().adicionarParada(evento.posto, evento.etiqueta ?? evento.posto.nome);
  }

  onAlteracoesPendentes(alterado: boolean) {
    if (alterado) {
      this.rotaVisivel.set(false);
    } else if (this.rota()) {
      this.rotaVisivel.set(true);
    }
  }

  private clonarParametros(evento: { origem: PontoGeografico; destino: PontoGeografico; waypoints: PontoGeografico[] }): ParametrosRota {
    return {
      origem: { latitude: evento.origem.latitude, longitude: evento.origem.longitude },
      destino: { latitude: evento.destino.latitude, longitude: evento.destino.longitude },
      waypoints: evento.waypoints.map(ponto => ({ latitude: ponto.latitude, longitude: ponto.longitude }))
    };
  }

  private montarGoogleMapsUrl(parametros: ParametrosRota) {
    const params = new URLSearchParams({
      api: '1',
      origin: this.formatarPonto(parametros.origem),
      destination: this.formatarPonto(parametros.destino),
      travelmode: 'driving',
      language: 'pt-BR'
    });

    if (parametros.waypoints.length > 0) {
      params.set('waypoints', parametros.waypoints.map(ponto => this.formatarPonto(ponto)).join('|'));
    }

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  private formatarPonto(ponto: PontoGeografico) {
    return `${ponto.latitude},${ponto.longitude}`;
  }

  private criarErroCalculo(erro: unknown): ErroCalculo {
    const httpErro = erro as HttpErrorResponse;
    const status = httpErro?.status ?? undefined;
    const mensagem = httpErro?.error?.mensagem ?? httpErro?.statusText ?? httpErro?.message ?? 'Falha ao calcular rota';
    const detalhesRaw = this.extrairDetalhes(httpErro);
    return {
      status,
      mensagem,
      detalhes: detalhesRaw
    };
  }

  private extrairDetalhes(httpErro: HttpErrorResponse | undefined) {
    if (!httpErro) return 'Nenhum detalhe retornado pelo servidor.';
    const corpo = httpErro.error;
    if (typeof corpo === 'string') {
      const texto = corpo.trim();
      return texto.length > 0 ? texto : 'Nenhum detalhe retornado pelo servidor.';
    }
    if (corpo instanceof ArrayBuffer) {
      try {
        const decoder = new TextDecoder();
        const texto = decoder.decode(corpo).trim();
        return texto.length > 0 ? texto : 'Nenhum detalhe retornado pelo servidor.';
      } catch {
        return 'Não foi possível ler os detalhes do erro.';
      }
    }
    if (corpo && typeof corpo === 'object') {
      try {
        return JSON.stringify(corpo, null, 2);
      } catch {
        return 'Não foi possível formatar os detalhes do erro.';
      }
    }
    const texto = httpErro.message?.trim();
    return texto && texto.length > 0 ? texto : 'Nenhum detalhe retornado pelo servidor.';
  }
}
