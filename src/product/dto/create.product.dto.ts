import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsDefined()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty({
    each: true,
    message: '상품의 태그는 빈 값을 입력할 수 없습니다.',
  })
  @IsString({ each: true })
  @ArrayMinSize(1, { message: '상품은 최소 1개의 태그를 가져야합니다.' })
  tags: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty({
    each: true,
    message: '상품의 카테고리는 빈 값을 입력할 수 없습니다.',
  })
  @IsString({ each: true })
  @ArrayMinSize(1, { message: '상품은 최소 1개의 카테고리를 가져야합니다.' })
  categories: string[];
}
