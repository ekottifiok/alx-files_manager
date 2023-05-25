import { createClient } from 'redis';

export default class RedisClient {
  constructor() {
    this.client = createClient();
  }

  isAlive() {
    return !!this.client;
  }

  async get(key) {
    return this.client.get(key);
  }
}
