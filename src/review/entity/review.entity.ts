import { AbstractEntity } from 'src/common/entity/AbstractEntity';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class Review extends AbstractEntity {
  @ManyToOne(() => User, (user) => user.reviews)
  public user: User;

  @ManyToOne(() => Product, (product) => product.reviews)
  public product: Product;

  @Column()
  public description: string;
}
