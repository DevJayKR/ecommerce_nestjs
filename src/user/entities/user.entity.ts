import { InternalServerErrorException } from '@nestjs/common';
import { AbstractEntity } from 'src/common/entity/AbstractEntity';
import { BeforeInsert, Column, Entity } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Role } from './roles.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Source } from './source.enum';
import * as gravatar from 'gravatar';

@Entity()
export class User extends AbstractEntity {
  @Column({ unique: true })
  @ApiProperty()
  public email: string;

  @Column()
  @ApiProperty()
  public username?: string;

  @Column({ nullable: true })
  public password: string;

  @Column({ default: 0 })
  @ApiProperty()
  public gender: number;

  @Column({ default: false })
  public isEmailConfirmed: boolean;

  @Column({ type: 'enum', enum: Role, default: [Role.User] })
  @ApiProperty()
  public roles: Role[];

  @Column({ default: false })
  public selfCheck: boolean;

  @Column({ nullable: true })
  public profileImg?: string;

  @Column({ type: 'enum', enum: Source })
  public source: Source;

  @BeforeInsert()
  async hashPassword() {
    if (this.source === Source.LOCAL) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
        this.profileImg = gravatar.url(this.email, {
          s: '200',
          r: 'pg',
          d: 'mm',
          protocol: 'https',
        });
      } catch (e) {
        console.log(e);
        throw new InternalServerErrorException();
      }
    } else {
      this.password = '';
      this.selfCheck = true;
      this.isEmailConfirmed = true;
    }
  }
}
