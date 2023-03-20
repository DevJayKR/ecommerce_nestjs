import { CanActivate, ExecutionContext, mixin, Type } from '@nestjs/common';
import JwtAuthGuard from 'src/auth/guard/jwtAuth.guard';
import { RequestWithUser } from 'src/auth/requestWithUser.interface';
import { Role } from './entities/roles.enum';

export const RoleGuard = (role: Role): Type<CanActivate> => {
  class RoleGuardMixin extends JwtAuthGuard {
    async canActivate(context: ExecutionContext) {
      await super.canActivate(context);

      const request = context.switchToHttp().getRequest<RequestWithUser>();
      const user = request.user;

      return user?.roles.includes(role);
    }
  }
  return mixin(RoleGuardMixin);
};
