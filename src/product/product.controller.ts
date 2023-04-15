import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from 'src/user/entities/roles.enum';
import { RoleGuard } from 'src/user/role.guard';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create.product.dto';

@Controller('product')
@ApiTags('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @UseGuards(RoleGuard(Role.Admin))
  async getProduct() {
    return await this.productService.findAllProduct();
  }

  @Get('/name/:name')
  async getProductByName(@Param('name') name: string) {
    return await this.productService.findProductByName(name);
  }

  @Get('/id/:id')
  async getProductById(@Param('id') id: string) {
    return await this.productService.findProductById(id);
  }

  @Post()
  @UseGuards(RoleGuard(Role.Admin))
  async addProduct(@Body() createProductDto: CreateProductDto) {
    return await this.productService.createProduct(createProductDto);
  }
}
