import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { FindManyOptions, MoreThan, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create.product.dto';
import { RedisService } from 'src/redis/redis.service';
import { UpdateProductDto } from './dto/update.product.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { generateProduct } from './function/createProduct';
import { PageOptionsDto } from 'src/common/dtos/page-option.dto';
import { PageDto } from 'src/common/dtos/page.dto';
import { PageMetaDto } from 'src/common/dtos/page-meta.dto';

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
          `${createProductDto.name} 상품명은 이미 사용되고 있습니다.`,
        );
    }

    const products = await this.redisService.get('products');
    products.push(newProduct);

    await this.redisService.set('products', products);

    return newProduct;
  }

  async findAllProducts(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Product>> {
    //const [items, count] = await this.productRepository.findAndCount({
    //  order: {
    //    createdAt: 'DESC',
    //  },
    //  skip: pageOptionsDto.skip,
    //  take: pageOptionsDto.take,
    //});
    //return {
    //  items,
    //  count,
    //};

    const queryBuilder = this.productRepository.createQueryBuilder('product');

    queryBuilder
      .orderBy('product.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
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
      await this.redisService.set('products', products, 60);

      return product;
    } else {
      throw new BadRequestException('존재하지 않는 상품입니다.');
    }
  }

  async searchForProduct(
    text: string,
    offset?: number,
    limit?: number,
    startId?: number,
  ) {
    //const { results, count }
  }
}
