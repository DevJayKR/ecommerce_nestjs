import { PublicFile } from 'src/files/entities/publicFile.entity';
import { Source } from '../entities/source.enum';

export class CreateUserWithSocialDto {
  email: string;
  username: string;
  source: Source;
  profileImg?: PublicFile | null;
}
