import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from 'src/user/entities/roles.enum';
import { RoleGuard } from 'src/user/role.guard';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';
import { PaginationParams } from 'src/common/types/paginationParams';
import { PageOptionsDto } from 'src/common/dtos/page-option.dto';
import { PageDto } from 'src/common/dtos/page.dto';
import { Product } from './entities/product.entity';

@Controller('product')
@ApiTags('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getProduct(
    @Query() pageOptionDto: PageOptionsDto,
  ): Promise<PageDto<Product>> {
    //return await this.productService.findAllProducts(offset, limit);
    return this.productService.findAllProducts(pageOptionDto);
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return await this.productService.findProductById(id);
  }

  @Patch(':id')
  @UseGuards(RoleGuard(Role.Admin))
  async updateProductById(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productService.updateProduct(id, updateProductDto);
  }

  @Post()
  @UseGuards(RoleGuard(Role.Admin))
  async addProduct(@Body() createProductDto: CreateProductDto) {
    return await this.productService.createProduct(createProductDto);
  }

  @Delete()
  @UseGuards(RoleGuard(Role.Admin))
  async deleteProduct(@Body('id') id: string) {
    const product = await this.productService.deleteProduct(id);

    return {
      success: true,
      code: 200,
      message: '상품 삭제 성공',
      data: {
        product,
      },
    };
  }
}
