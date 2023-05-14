import { AbstractEntity } from 'src/common/entity/AbstractEntity';
import { PublicFile } from 'src/files/entities/publicFile.entity';
import { Review } from 'src/review/entity/review.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

@Entity()
export class Product extends AbstractEntity {
  @Column({ unique: true })
  name: string;

  @Column()
  amount: number;

  @Column()
  price: number;

  @Column('text', { array: true })
  tags: string[];

  @Column('text', { array: true })
  categories: string[];

  @ManyToOne(() => Review, (review) => review.product)
  reviews: Review[];

  @JoinColumn()
  @OneToOne(() => PublicFile, {
    eager: true,
    nullable: true,
  })
  public productImg?: PublicFile;
}
