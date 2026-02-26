import { createApp } from 'vue';
import ArcoVue from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';
import './styles.css';
import App from './App.vue';
import { createRouter } from './router';
createApp(App).use(ArcoVue).use(createRouter()).mount('#app');
