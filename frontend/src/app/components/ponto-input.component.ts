import { Component, AfterViewInit, viewChild, ElementRef, input, model } from '@angular/core';
import { PontoGeografico } from '../models';

@Component({
  selector: 'app-ponto-input',
  imports: [],
  template: `
    @if (compact()) {
      <!-- Compact mode: two rows, no icon in input -->
      <label class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] font-semibold uppercase tracking-wide" [class]="readonly() ? 'text-slate-600' : 'text-slate-500'">
            {{ label() }}
            @if (readonly()) {
              <span class="ml-1.5 inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
                FIXO
              </span>
            }
          </span>
          @if (ponto() && !readonly()) {
            <button
              type="button"
              (click)="limpar(); $event.stopPropagation()"
              class="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 transition hover:bg-rose-100 hover:text-rose-600"
              aria-label="Limpar endereço">
              ×
            </button>
          }
        </div>
        @if (readonly()) {
          <div class="w-full rounded-lg border border-emerald-200 bg-emerald-50/50 px-2.5 py-1.5 text-xs text-slate-700">
            {{ endereco() || 'Parada fixa do mapa' }}
          </div>
        } @else {
          <input
            #inputElement
            [value]="endereco()"
            (blur)="onBlur()"
            placeholder="Digite um endereço"
            class="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            type="text" />
        }
      </label>
    } @else {
      <!-- Normal mode: original layout with icon -->
      <label class="flex flex-col text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <span class="flex items-center gap-2">
          <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
            {{ glyph() }}
          </span>
          <span>{{ label() }}</span>
        </span>

        <div
          class="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-indigo-500 focus-within:shadow-indigo-100 focus-within:ring-2 focus-within:ring-indigo-100">
          <input
            #inputElement
            [value]="endereco()"
            (blur)="onBlur()"
            placeholder="Digite um endereço"
            class="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            type="text" />
          @if (ponto()) {
            <button
              type="button"
              (click)="limpar(); $event.stopPropagation()"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-base font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700">
              ×
            </button>
          }
        </div>
      </label>
    }
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
  `
})
export class PontoInputComponent implements AfterViewInit {
  inputElement = viewChild.required<ElementRef<HTMLInputElement>>('inputElement');
  
  label = input('Endereço');
  valorInicial = input<string | null>(null);
  icon = input('place');
  compact = input(false);
  readonly = input(false);
  ponto = model<PontoGeografico | null>(null);
  
  endereco = model('');
  private autocomplete?: google.maps.places.Autocomplete;

  glyph() {
    const valor = this.icon().toLowerCase();
    switch (valor) {
      case 'trip_origin':
      case 'play_circle':
        return '●';
      case 'place':
      case 'flag':
        return '🏁';
      case 'location_on':
      case 'pin_drop':
        return '📍';
      default:
        return '⬤';
    }
  }
  
  ngAfterViewInit() {
    if (this.valorInicial()) {
      this.endereco.set(this.valorInicial()?? '');
    }

    // Don't initialize autocomplete for readonly inputs
    if (this.readonly()) {
      return;
    }

    this.autocomplete = new google.maps.places.Autocomplete(
      this.inputElement().nativeElement,
      { 
        componentRestrictions: { country: 'br' },
        fields: ['geometry', 'formatted_address', 'name']
      }
    );
    
    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete!.getPlace();
      if (place.geometry?.location) {
        this.ponto.set({
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        });
        this.endereco.set(place.formatted_address || place.name || '');
      }
    });
  }
  
  limpar() {
    this.ponto.set(null);
    this.endereco.set('');
    this.inputElement().nativeElement.value = '';
  }
  
  onBlur() {
    if (!this.ponto()) {
      this.endereco.set('');
      this.inputElement().nativeElement.value = '';
    }
  }
}
