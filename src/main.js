import './app.css'
import App from './App.svelte'
import Map from './Map'

const app = new App({
  target: document.querySelector('.leftMenu'),
})

Map.start(document.querySelector('.map'));
export default app
