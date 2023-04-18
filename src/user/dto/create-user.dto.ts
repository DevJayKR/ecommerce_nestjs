import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Gender } from '../entities/gender.enum';

export class CreateUserDto {
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  username: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  @ApiProperty()
  gender: Gender;

  @IsString()
  @MinLength(4)
  @ApiProperty()
  @IsNotEmpty()
  password: string;
}
