import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import JwtAuthGuard from 'src/auth/guard/jwtAuth.guard';
import { RequestWithUser } from 'src/auth/requestWithUser.interface';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post(':productId')
  @UseGuards(JwtAuthGuard)
  async addReview(
    @Req() req: RequestWithUser,
    @Param('productId') productId: string,
    @Body('description') description: string,
  ) {
    const { user } = req;

    return await this.reviewService.addReview(user, productId, description);
  }
}
