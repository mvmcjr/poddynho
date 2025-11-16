import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { RequisicaoComputarRota, RespostaCalculoRotaDto, TipoCombustivel } from '../models';

@Injectable({
  providedIn: 'root'
})
export class RotaService {
  private readonly baseUrl = environment.apiBaseUrl;
  private http = inject(HttpClient);

  calcularRota(requisicao: RequisicaoComputarRota): Observable<RespostaCalculoRotaDto> {
    return this.http.post<RespostaCalculoRotaDto>(
      `${this.baseUrl}/rota/computar`,
      requisicao
    ).pipe(
      catchError(error => {
        console.error('Erro ao calcular rota:', error);
        return throwError(() => error);
      })
    );
  }

  listarTiposCombustivel(): Observable<TipoCombustivel[]> {
    return this.http.get<TipoCombustivel[]>(
      `${this.baseUrl}/utils/listar/tipos-combustivel`
    ).pipe(
      catchError(error => {
        console.error('Erro ao listar tipos de combustível:', error);
        return throwError(() => error);
      })
    );
  }
}
