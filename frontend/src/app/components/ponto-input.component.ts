import { Component, AfterViewInit, viewChild, ElementRef, input, model } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PontoGeografico } from '../models';

@Component({
  selector: 'app-ponto-input',
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  template: `
    <mat-form-field class="full-width" appearance="outline">
      <mat-label>{{ label() }}</mat-label>
      <mat-icon matPrefix>{{ icon() }}</mat-icon>
      <input matInput
        #inputElement
        [value]="endereco()"
        (blur)="onBlur()"
        placeholder="Digite um endereço" />
      @if (ponto()) {
        <button mat-icon-button matSuffix (click)="limpar(); $event.stopPropagation()">
          <mat-icon>clear</mat-icon>
        </button>
      }
    </mat-form-field>
  `,
  styles: `
    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }
  `
})
export class PontoInputComponent implements AfterViewInit {
  inputElement = viewChild.required<ElementRef<HTMLInputElement>>('inputElement');
  
  label = input('Endereço');
  icon = input('place');
  ponto = model<PontoGeografico | null>(null);
  
  endereco = model('');
  private autocomplete?: google.maps.places.Autocomplete;
  
  ngAfterViewInit() {
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
