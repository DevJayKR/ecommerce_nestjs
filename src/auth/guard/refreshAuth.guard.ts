import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export default class RefreshAuthGuard extends AuthGuard('jwt-refresh-token') {}
