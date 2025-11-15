import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { RequisicaoComputarRota, RespostaCalculoRotaDto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class RotaService {
  private readonly baseUrl = environment.apiBaseUrl;
  private http = inject(HttpClient);

  calcularRota(requisicao: RequisicaoComputarRota): Observable<RespostaCalculoRotaDto> {
    return this.http.post<RespostaCalculoRotaDto>(
      `${this.baseUrl}/Rota/computar`,
      requisicao
    ).pipe(
      catchError(error => {
        console.error('Erro ao calcular rota:', error);
        return throwError(() => new Error('Falha ao calcular rota'));
      })
    );
  }
}
