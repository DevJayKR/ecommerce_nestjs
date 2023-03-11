import { AbstractEntity } from 'src/common/entity/AbstractEntity';
import { Column, Entity } from 'typeorm';

@Entity()
export class User extends AbstractEntity {
  @Column({ unique: true })
  public email: string;

  @Column()
  public username?: string;

  @Column({ nullable: false })
  public password: string;

  @Column({ default: 0 })
  public gender: number;
}
