import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create.product.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private readonly redisService: RedisService,
  ) {}

  async createProduct(createProductDto: CreateProductDto) {
    const newProduct = this.productRepository.create(createProductDto);
    await this.productRepository.save(newProduct);
    return newProduct;
  }

  async findAllProduct() {
    const products = await this.productRepository.find();
    const redisProduct = await this.redisService.get('products');
    const parsedRedisData = JSON.stringify(redisProduct);

    if (
      !redisProduct ||
      JSON.parse(parsedRedisData).length !== products.length
    ) {
      await this.redisService.set('products', products);
      return products;
    }

    return redisProduct;
  }

  async findProductByName(name: string) {
    const products = await this.redisService.get('products');
    const stringifyProducts = JSON.stringify(products);
    const parsedProducts = JSON.parse(stringifyProducts);

    const redisData = parsedProducts.find(
      (product: Product) => product.name === name,
    );

    if (redisData) return redisData;

    await this.redisService.set('products', products);

    return await this.productRepository.findOneBy({ name });
  }

  async findProductById(id: string) {
    const products = await this.redisService.get('products');
    const stringifyProducts = JSON.stringify(products);
    const parsedProducts = JSON.parse(stringifyProducts);

    const redisData = parsedProducts.find(
      (product: Product) => product.id === id,
    );

    console.log('redisData :>> ', redisData);

    if (redisData) return redisData;

    await this.redisService.set('products', products);
    return await this.productRepository.findOneBy({ id });
  }

  async updateProduct(id: string) {}
  async deleteProduct(id: string) {}
}
