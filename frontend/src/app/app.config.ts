import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, provideAppInitializer } from '@angular/core';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { provideHttpClient } from '@angular/common/http';
import { provideIcons } from '@ng-icons/core';
import {
  heroBanknotes,
  heroMapPin,
  heroPuzzlePiece,
  heroFire
} from '@ng-icons/heroicons/outline';
import {
  matAddOutline,
  matCloseOutline,
  matLocationOnOutline, matRefreshOutline,
  matRouteOutline, matScheduleOutline,
  matWarningOutline
} from '@ng-icons/material-icons/outline';
import { matDragIndicator } from '@ng-icons/material-icons/baseline';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideIcons({
      heroBanknotes,
      heroMapPin,
      heroPuzzlePiece,
      heroFire,
      matRouteOutline,
      matLocationOnOutline,
      matDragIndicator,
      matCloseOutline,
      matAddOutline,
      matWarningOutline,
      matScheduleOutline,
      matRefreshOutline
    }),
    provideAppInitializer(() => {
      setOptions({
        key: 'AIzaSyDno0uJ2LIDK9SSeo2iRZzjYbEUHSdM58I',
        libraries: ['places']
      });
      return importLibrary('maps');
    })
  ]
};
