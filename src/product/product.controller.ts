import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from 'src/user/entities/roles.enum';
import { RoleGuard } from 'src/user/role.guard';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create.product.dto';
import { UpdateProductDto } from './dto/update.product.dto';
import { PageOptionsDto } from 'src/common/dtos/page-option.dto';
import { PageDto } from 'src/common/dtos/page.dto';
import { Product } from './entities/product.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequestWithUser } from 'src/auth/requestWithUser.interface';
import { Express } from 'express';
import JwtAuthGuard from 'src/auth/guard/jwtAuth.guard';

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

  @Post('/:productId/img')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: 'multipart/form-data',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(RoleGuard(Role.Admin))
  @UseInterceptors(FileInterceptor('file'))
  async addProductImage(
    @Req() request: RequestWithUser,
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.productService.addProductImage(
      productId,
      file.buffer,
      file.originalname,
    );
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

  @Post()
  @UseGuards(JwtAuthGuard)
  async addReview(@Req() req: RequestWithUser) {
    const { user } = req;
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
