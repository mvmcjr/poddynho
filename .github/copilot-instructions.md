# Poddynho - AI Coding Agent Instructions

## Project Overview
Poddynho is a full-stack application for route calculation and gas station discovery. Backend is .NET 10.0 API using Google Maps Routing API. Frontend is Next.js with Tailwind CSS v4 and Shadcn components.

## Backend Architecture

### Three-Layer Structure
- **Poddynho.Api**: ASP.NET Core Web API with controllers, services, and DbContext
- **Poddynho.Domain**: Core domain models and infrastructure interfaces
- **Poddynho.Petrobras** (under `Integracoes/`): Integration plugin for importing Petrobras station data

### Key Design Patterns
- **Plugin Architecture**: Gas station data sources implement `IImportadorPostos` and are registered via extension methods (see `ExtensoesAplicacao.AdicionarServicosPetrobras()`)
- **Background Loading**: `CargaPostos` hosted service loads all stations on startup by discovering all `IImportadorPostos` implementations
- **In-Memory Database**: Uses EF Core InMemoryDatabase (`PostosDbContext`) for station data - no persistent storage
- **Result Pattern**: Uses `LightResults` library for error handling (check `IsSuccess(out var resposta, out var erro)`)

## Critical Dependencies
- **Google.Maps.Routing.V2**: Route calculation via gRPC API (requires field mask: `routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline`)
- **NetTopologySuite**: Geospatial calculations for distance-to-route computations
- **Scalar.AspNetCore**: API documentation at `/docs` endpoint (in development only)

## Development Workflow

### Running the API
```powershell
cd backend\Poddynho\Poddynho.Api
dotnet run --launch-profile http
```
- API runs on `http://localhost:5184`
- **Required**: Set `PETROBRAS_JSON_PATH` environment variable pointing to Petrobras JSON data file (see `launchSettings.json`)

### Building
```powershell
cd backend\Poddynho
dotnet build Poddynho.sln
```

## Project-Specific Conventions

### Naming & Language
- **Portuguese**: All domain terms, models, and business logic use Portuguese names (`Posto`, `Combustivel`, `Rota`)
- **Namespace Simplification**: `RootNamespace` set to `Poddynho` (not `Poddynho.Api`) to avoid redundant namespaces

### Model Patterns
- **Records**: All DTOs and domain models use C# records (`record Posto`, `record PontoGeografico`)
- **Required Properties**: Use `required` keyword extensively for mandatory fields
- **Owned Entities**: `PontoGeografico` is an owned entity in EF Core (`OwnsOne(x => x.Localizacao)`)

### Geospatial Logic
- **Distance Calculation**: Custom implementation using NetTopologySuite's `LineString.Distance()` with degree-to-km conversion (`degreesToKm = 111.132`)
- **Coordinate Order**: NetTopologySuite uses (longitude, latitude) order, opposite of Google Maps
- **Polyline Decoding**: Custom decoder in `ExtensoesPolyline.cs` (sourced from Stack Overflow)

### Dependency Injection
- Integration packages self-register via extension methods (e.g., `AdicionarServicosPetrobras()`)
- Hosted services registered in `Program.cs` for startup tasks

## Adding New Gas Station Sources
1. Create new project under `Integracoes/` solution folder
2. Implement `IImportadorPostos` interface
3. Create static extension class with `AdicionarServicos[Name]()` method
4. Register in `Program.cs` via `builder.Services.AdicionarServicos[Name]()`
5. The `CargaPostos` hosted service will automatically discover and import data

## Common Operations

### Route Calculation Flow
1. `RotaController.ComputarRota()` receives `RequisicaoComputarRota`
2. `ServicoCalculoRota.CalcularRota()` calls Google Maps API with field mask
3. Decode polyline to get route geometry as `LineString`
4. Query stations from in-memory database (filter by fuel types if specified)
5. Calculate distance from each station to route using NetTopologySuite
6. Return stations within `DistanciaMaximaEmKm` threshold (default: 20km)

### API Contract
- Endpoint: `POST /Rota/computar`
- Request: Origin/destination coordinates, optional fuel types, max distance, waypoints
- Response: Route details (distance, duration, polyline) + nearby stations
- Enums serialized as strings (configured globally via `JsonStringEnumConverter`)

## Frontend Architecture

### Tech Stack
- **Angular 20**: Component-based framework with standalone components (default since v14)
- **Angular Material**: Official Google Material Design components
- **@angular/google-maps**: Official Angular wrapper for Google Maps JavaScript API
- **TypeScript**: Strict type checking enabled
- **RxJS**: Reactive programming for state and async operations
- **Signals**: Primary state management pattern (stable since v19)

### Project Setup
```powershell
cd frontend
npm install
ng serve
```
- Development server: `http://localhost:4200`
- Backend API base URL: `http://localhost:5184`
- **Required**: Set Google Maps API key in `src/environments/environment.ts`

### Application Structure

#### Core UI Layout
- **Fullscreen Map**: Google Maps fills entire viewport using `height: 100vh`
- **Floating Panels**: Material cards positioned absolutely over map using `position: absolute`
- **Route Builder**: Origin/Waypoints/Destination input panel (top-left overlay)
- **Results Panel**: Calculated route details and nearby stations (collapsible side panel)
- **Filter Controls**: Fuel type and distance filters (top-right overlay)

#### File Organization
- `src/app/`: Application root with standalone components
- `src/app/components/`: Feature components (mapa, rota-builder, posto-list)
- `src/app/services/`: API clients and business logic services
- `src/app/models/`: TypeScript interfaces and types
- `src/app/pipes/`: Custom pipes for data transformation
- `src/environments/`: Environment configuration files

### Code Conventions

#### No Comments Rule
Never add code comments. Code must be self-documenting through:
- Descriptive variable/function names
- Clear component structure
- Explicit type definitions

#### Component Patterns
Use standalone components (default), signals for state, and modern control flow syntax:
```typescript
@Component({
  selector: 'app-rota-builder',
  imports: [MatCardModule, MatButtonModule, PontoInputComponent],
  template: `
    <mat-card class="floating-panel">
      <mat-card-content>
        <app-ponto-input [(ponto)]="origem" label="Origem" />
        <app-ponto-input [(ponto)]="destino" label="Destino" />
        <button mat-raised-button color="primary" (click)="calcularRota()">
          Calcular Rota
        </button>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .floating-panel {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 1000;
      max-width: 400px;
    }
  `
})
export class RotaBuilderComponent {
  origem = signal<PontoGeografico | null>(null);
  destino = signal<PontoGeografico | null>(null);
  
  calcularRota() {
    // Implementation
  }
}
```

#### Signals for State Management
Angular signals are the primary state management pattern. Use `signal()`, `computed()`, and `effect()`:
```typescript
pontos = signal<PontoGeografico[]>([]);
postosProximos = signal<Posto[]>([]);
rotaAtual = signal<RotaDto | null>(null);
distanciaMaxima = signal(20);

postosComputados = computed(() => {
  const postos = this.postosProximos();
  const maxDist = this.distanciaMaxima();
  return postos.filter(p => p.distancia <= maxDist);
});

constructor() {
  effect(() => {
    console.log(`${this.postosComputados().length} postos encontrados`);
  });
}
```

#### Modern Template Syntax
Use built-in control flow (`@if`, `@for`, `@switch`) instead of structural directives:
```typescript
template: `
  @if (rotaAtual(); as rota) {
    <mat-card>
      <mat-card-content>
        <p>Distância: {{ rota.distanciaEmMetros / 1000 | number:'1.1-1' }} km</p>
        <p>Duração: {{ rota.duracao }}</p>
      </mat-card-content>
    </mat-card>
  }
  
  @for (posto of postosProximos(); track posto.id) {
    <app-posto-card [posto]="posto" />
  } @empty {
    <p>Nenhum posto encontrado</p>
  }
`
```

### Google Maps Integration

#### Map Component Setup
```typescript
@Component({
  selector: 'app-mapa',
  imports: [GoogleMapsModule],
  template: `
    <google-map
      [height]="'100vh'"
      [width]="'100vw'"
      [center]="centro()"
      [zoom]="zoom()"
      [options]="mapOptions">
      
      @for (posto of postos(); track posto.id) {
        <map-marker
          [position]="{ lat: posto.localizacao.latitude, lng: posto.localizacao.longitude }"
          [options]="{ icon: iconePosto }" />
      }
      
      @if (polyline(); as path) {
        <map-polyline
          [path]="path"
          [options]="polylineOptions" />
      }
    </google-map>
  `
})
export class MapaComponent {
  centro = signal({ lat: -23.550520, lng: -46.633308 });
  zoom = signal(12);
  postos = input.required<Posto[]>();
  polyline = input<google.maps.LatLngLiteral[] | null>(null);
  
  mapOptions: google.maps.MapOptions = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    disableDefaultUI: false,
    zoomControl: true,
    fullscreenControl: false
  };
}
```

#### Loading Google Maps API
In `app.config.ts`:
```typescript
import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideHttpClient()
  ]
};
```

Load API in `index.html`:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
```

### Material Design Styling

#### Theme Configuration
Define in `src/styles.scss`:
```scss
@use '@angular/material' as mat;

$primary: mat.define-palette(mat.$indigo-palette);
$accent: mat.define-palette(mat.$pink-palette);
$theme: mat.define-light-theme((
  color: (primary: $primary, accent: $accent)
));

@include mat.all-component-themes($theme);

body {
  margin: 0;
  font-family: Roboto, sans-serif;
}
```

#### Floating Panel Pattern
```scss
.floating-panel {
  position: absolute;
  z-index: 1000;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  background: white;
  
  &.top-left {
    top: 16px;
    left: 16px;
  }
  
  &.top-right {
    top: 16px;
    right: 16px;
  }
}
```

#### Responsive Behavior
```scss
@media (max-width: 768px) {
  .floating-panel {
    left: 8px;
    right: 8px;
    max-width: calc(100vw - 16px);
  }
}
```

### Route Builder Component

#### Waypoint Management
```typescript
@Component({
  selector: 'app-rota-builder',
  imports: [MatCardModule, MatButtonModule, MatIconModule, PontoInputComponent],
  template: `
    <mat-card class="floating-panel top-left">
      <mat-card-header>
        <mat-card-title>Planejar Rota</mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <app-ponto-input [(ponto)]="origem" label="Origem" icon="trip_origin" />
        
        @for (waypoint of waypoints(); track $index) {
          <app-ponto-input 
            [(ponto)]="waypoints()[$index]" 
            [label]="'Parada ' + ($index + 1)" 
            icon="location_on"
            (remove)="removerWaypoint($index)" />
        }
        
        <button mat-button (click)="adicionarWaypoint()">
          <mat-icon>add_location</mat-icon>
          Adicionar Parada
        </button>
        
        <app-ponto-input [(ponto)]="destino" label="Destino" icon="place" />
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-raised-button color="primary" 
          [disabled]="!origem() || !destino()"
          (click)="calcularRota()">
          Calcular Rota
        </button>
      </mat-card-actions>
    </mat-card>
  `
})
export class RotaBuilderComponent {
  origem = signal<PontoGeografico | null>(null);
  destino = signal<PontoGeografico | null>(null);
  waypoints = signal<(PontoGeografico | null)[]>([]);
  
  adicionarWaypoint() {
    this.waypoints.update(w => [...w, null]);
  }
  
  removerWaypoint(index: number) {
    this.waypoints.update(w => w.filter((_, i) => i !== index));
  }
  
  calcularRota() {
    // Implementation
  }
}
```

#### Place Autocomplete Input
Use `input()` and `model()` for component inputs (type-safe, signal-based):
```typescript
@Component({
  selector: 'app-ponto-input',
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  template: `
    <mat-form-field class="full-width">
      <mat-label>{{ label() }}</mat-label>
      <mat-icon matPrefix>{{ icon() }}</mat-icon>
      <input matInput
        #inputElement
        [value]="endereco()"
        (blur)="onBlur()"
        placeholder="Digite um endereço" />
      @if (ponto()) {
        <button mat-icon-button matSuffix (click)="limpar()">
          <mat-icon>clear</mat-icon>
        </button>
      }
    </mat-form-field>
  `
})
export class PontoInputComponent implements AfterViewInit {
  inputElement = viewChild.required<ElementRef<HTMLInputElement>>('inputElement');
  
  label = input('');
  icon = input('place');
  ponto = model<PontoGeografico | null>(null);
  
  endereco = signal('');
  private autocomplete?: google.maps.places.Autocomplete;
  
  ngAfterViewInit() {
    this.autocomplete = new google.maps.places.Autocomplete(
      this.inputElement().nativeElement,
      { componentRestrictions: { country: 'br' } }
    );
    
    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete!.getPlace();
      if (place.geometry?.location) {
        this.ponto.set({
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        });
        this.endereco.set(place.formatted_address || '');
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
    }
  }
}
```

### API Integration

#### Type Definitions
Mirror backend models in `src/app/models/`:
```typescript
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

export interface RequisicaoComputarRota {
  origem: PontoGeografico;
  destino: PontoGeografico;
  pontosIntermediarios?: PontoGeografico[];
  tiposCombustivel?: Combustivel[];
  distanciaMaximaEmKm?: number;
}

export interface RespostaCalculoRotaDto {
  rota: RotaDto;
  postosProximos: PostoProximoDto[];
}
```

#### Service Pattern
Use `inject()` function for dependency injection (works in standalone context):
```typescript
@Injectable({ providedIn: 'root' })
export class RotaService {
  private readonly baseUrl = 'http://localhost:5184';
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
```

#### Resource API for Async Data
For reactive async operations, use `rxResource()` (v20 feature):
```typescript
export class RotaListComponent {
  private rotaService = inject(RotaService);
  
  filtros = signal({ combustivel: 'Gasolina' as Combustivel, distancia: 20 });
  
  rotasResource = rxResource({
    request: () => this.filtros(),
    loader: ({ request }) => this.rotaService.buscarRotas(request)
  });
  
  rotas = this.rotasResource.value;
  isLoading = this.rotasResource.isLoading;
  error = this.rotasResource.error;
}
```

### Package Management
Use npm CLI exclusively:
```powershell
npm install package-name
npm uninstall package-name
ng add @angular/material
ng add @angular/google-maps
```

Never use `yarn` or `pnpm`. Never manually edit `package.json`.

### Portuguese Domain Language
Match backend naming in TypeScript code:
- `origem`/`destino` not `origin`/`destination`
- `postos` not `stations`
- `combustivel` not `fuel`
- `rota` not `route`
- `pontosIntermediarios` not `waypoints`

UI text can be Portuguese or English based on user preference, but code identifiers stay Portuguese.
