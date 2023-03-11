import { InternalServerErrorException } from '@nestjs/common';
import { AbstractEntity } from 'src/common/entity/AbstractEntity';
import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import * as bcrypt from 'bcryptjs';

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

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }
}
