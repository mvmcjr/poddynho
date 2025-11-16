export interface PontoGeografico {
  latitude: number;
  longitude: number;
}

export type Combustivel = string;

export interface TipoCombustivel {
  nome: string;
  valor: string;
  iniciarSelecionado: boolean;
}

export interface CombustivelDto {
  nome: string;
  valor: string;
}

export interface Posto {
  id: string;
  nome: string;
  bandeira: string;
  localizacao: PontoGeografico;
  combustiveis: Combustivel[];
  cidade: string;
  estado: string;
}

export interface PostoComDistancias extends Posto {
  distanciaDaOrigemEmKm: number;
  distanciaDaRotaEmKm: number;
  distanciaDoDestinoEmKm: number;
  combustiveisDto: CombustivelDto[];
}

export interface RotaDto {
  distanciaEmMetros: number;
  duracao: string;
  polyline: string;
}

export interface RequisicaoComputarRota {
  origem: PontoGeografico;
  destino: PontoGeografico;
  pontosIntermediarios?: PontoGeografico[];
  tiposCombustivel?: Combustivel[];
  distanciaMaximaEmKm?: number;
}

export interface RespostaCalculoRotaDto {
  rota: RotaDto;
  postosProximos: PostoComDistancias[];
}
