import { get, set } from 'idb-keyval';
import { appStore } from './db';
import { COLLECTION_KEYS, type CollectionName } from './keys';

export async function getCollection<T>(name: CollectionName): Promise<T[]> {
  const value = await get<T[]>(COLLECTION_KEYS[name], appStore);
  return value ?? [];
}

export async function saveCollection<T>(name: CollectionName, items: T[]): Promise<void> {
  await set(COLLECTION_KEYS[name], items, appStore);
}
