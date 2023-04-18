import { Injectable, OnModuleInit } from '@nestjs/common';
import { ProductService } from './product/product.service';

@Injectable()
export class AppService implements OnModuleInit {
  async onModuleInit() {
    await this.productService.initProductsCache();
    //await this.productService.seedProduct();
  }

  constructor(private readonly productService: ProductService) {}

  getHello(): string {
    return 'asd';
  }
}
