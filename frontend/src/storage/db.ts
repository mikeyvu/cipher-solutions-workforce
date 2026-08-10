import { createStore } from 'idb-keyval';

export const appStore = createStore('cipher-solutions-db', 'app-data');
