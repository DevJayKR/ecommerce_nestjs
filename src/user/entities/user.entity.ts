import { InternalServerErrorException } from '@nestjs/common';
import { AbstractEntity } from 'src/common/entity/AbstractEntity';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Role } from './roles.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Source } from './source.enum';
//import * as gravatar from 'gravatar';
import { Gender } from './gender.enum';
import { Exclude } from 'class-transformer';
import { PublicFile } from 'src/files/entities/publicFile.entity';
import { Product } from 'src/product/entities/product.entity';
import { Review } from 'src/review/entity/review.entity';

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

  @Column({ type: 'enum', enum: Gender })
  @ApiProperty()
  public gender: Gender;

  @Column({ default: false })
  public isEmailConfirmed: boolean;

  @Column({ type: 'enum', enum: Role, default: [Role.User], array: true })
  @ApiProperty()
  public roles: Role[];

  @Column({ default: false })
  public selfCheck: boolean;

  @JoinColumn()
  @OneToOne(() => PublicFile, {
    eager: true,
    nullable: true,
  })
  public profileImg?: PublicFile;

  @Column({ type: 'enum', enum: Source })
  public source: Source;

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @Column({ nullable: true })
  @Exclude()
  currentHashedRefreshToken?: string;

  @BeforeInsert()
  async hashPassword() {
    if (this.source === Source.LOCAL) {
      try {
        this.password = await bcrypt.hash(this.password, 10);
        //this.profileImg = gravatar.url(this.email, {
        //  s: '200',
        //  r: 'pg',
        //  d: 'mm',
        //  protocol: 'https',
        //});
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
