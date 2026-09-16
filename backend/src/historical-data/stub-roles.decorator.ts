// Stub Roles decorator for when auth is not implemented
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Stub CurrentUser decorator
export const CurrentUser = () => {
  return () => {}; // No-op parameter decorator
};
