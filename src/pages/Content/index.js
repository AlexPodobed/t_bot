import { bootstrapReactApp } from './app';

function bootstrap(){
  const rootEl = document.createElement('div')
  rootEl.id = 'chrome-ext-1';
  document.body.appendChild(rootEl);

  bootstrapReactApp(rootEl);
}

bootstrap();