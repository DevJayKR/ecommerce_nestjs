import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Source } from 'src/user/entities/source.enum';

@Injectable()
export class NaverAuthGuard extends AuthGuard(Source.NAVER) {}
