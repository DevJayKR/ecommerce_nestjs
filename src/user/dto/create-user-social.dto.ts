import { Source } from '../entities/source.enum';

export class CreateUserWithSocialDto {
  email: string;
  username: string;
  source: Source;
}
