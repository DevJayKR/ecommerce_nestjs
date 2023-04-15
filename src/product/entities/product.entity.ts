import { AbstractEntity } from 'src/common/entity/AbstractEntity';
import { Column, Entity } from 'typeorm';

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

  @Column()
  category: string;
}
