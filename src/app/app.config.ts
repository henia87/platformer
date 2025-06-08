import { ApplicationConfig } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';
import { AppComponent } from './app.component';

const routes: Routes = [
  {
    path: '',
    component: AppComponent,
  },
];

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};
