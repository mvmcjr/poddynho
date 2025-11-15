export interface PontoGeografico {
  latitude: number;
  longitude: number;
}

export type Combustivel = "Gasolina" | "Etanol" | "Aditivada" | "Premium";

export interface Posto {
  id: string;
  nome: string;
  bandeira: string;
  localizacao: PontoGeografico;
  combustiveis: Combustivel[];
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
  postosProximos: Posto[];
}
