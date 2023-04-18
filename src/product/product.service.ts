import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create.product.dto';
import { RedisService } from 'src/redis/redis.service';
import { UpdateProductDto } from './dto/update.product.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { generateProduct } from './function/createProduct';

@Injectable()
export class ProductService {
  private logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private readonly redisService: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async initProductsCache(): Promise<void> {
    const products = await this.productRepository.find();
    await this.redisService.set('products', products, 60);
  }

  async seedProduct(): Promise<void> {
    const newProducts = generateProduct();
    for (let i = 0; i < newProducts.length; i++) {
      await this.productRepository.save(newProducts[i]);
    }
  }

  async createProduct(createProductDto: CreateProductDto) {
    const newProduct = this.productRepository.create(createProductDto);

    try {
      await this.productRepository.save(newProduct);
    } catch (error) {
      if (error.code === '23505')
        throw new BadRequestException(
          `${createProductDto.name}은(는) 이미 사용되고 있는 상품명입니다.`,
        );
    }

    const products = await this.redisService.get('products');
    products.push(newProduct);

    await this.redisService.set('products', products);

    return newProduct;
  }

  async findAllProducts() {
    const products = await this.redisService.get('products');
    return products;
  }

  async findProductById(id: string): Promise<Product> {
    const cachedProducts = await this.redisService.get('products');
    if (cachedProducts) {
      const product = cachedProducts.find(
        (product: Product) => product.id === id,
      );

      if (product) return product;
    }

    const product = await this.productRepository.findOneBy({ id });
    if (product) return product;

    throw new NotFoundException('존재하지 않는 상품입니다.');
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findProductById(id);

    product.amount = updateProductDto.amount;
    product.categories = updateProductDto.categories;
    product.price = updateProductDto.price;
    product.tags = updateProductDto.tags;

    await this.productRepository.save(product);

    const products = await this.productRepository.find();
    await this.redisService.set('products', products);

    return product;
  }

  async deleteProduct(id: string) {
    const product = await this.productRepository.findOneBy({ id });

    if (product !== null) {
      await this.productRepository.delete({ id });

      const products = await this.productRepository.find();
      await this.redisService.set('products', products);

      return product;
    } else {
      throw new BadRequestException('존재하지 않는 상품입니다.');
    }
  }
}
