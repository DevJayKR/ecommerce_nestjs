import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entity/review.entity';
import { Repository } from 'typeorm';
import { ProductService } from 'src/product/product.service';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    private readonly productService: ProductService,
  ) {}

  async addReview(user: User, productId: string, description: string) {
    const product = await this.productService.findProductById(productId);

    const newReview = this.reviewRepository.create({
      product,
      user,
      description,
    });

    await this.reviewRepository.save(newReview);

    return newReview;
  }
}
