import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async set(key: string, value: any) {
    const isExist = await this.cacheManager.get(key);

    if (isExist) return isExist;

    return await this.cacheManager.set(key, value);
  }

  async get(key: string) {
    return await this.cacheManager.get(key);
  }

  async del(key: string) {
    return await this.cacheManager.del(key);
  }
}
