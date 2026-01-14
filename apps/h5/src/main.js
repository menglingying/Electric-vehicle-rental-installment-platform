import { createApp } from 'vue';
import { createRouter } from './router';
import App from './App.vue';
import Vant from 'vant';
import 'vant/lib/index.css';
import './styles.css';
createApp(App).use(Vant).use(createRouter()).mount('#app');
