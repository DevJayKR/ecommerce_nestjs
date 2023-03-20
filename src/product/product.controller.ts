import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from 'src/user/entities/roles.enum';
import { RoleGuard } from 'src/user/role.guard';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @UseGuards(RoleGuard(Role.Admin))
  async getProduct() {
    return 'asdf';
  }
}
