import { AbstractEntity } from 'src/common/entity/AbstractEntity';
import { Column, Entity } from 'typeorm';

@Entity()
export class Movie extends AbstractEntity {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  poster_path: string;

  @Column()
  release_data: string;
}
