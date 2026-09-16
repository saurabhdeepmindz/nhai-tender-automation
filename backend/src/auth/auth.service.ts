import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

interface DemoAccount {
  email: string;
  password: string;
  role: 'vendor' | 'admin';
  userId: string;
  name: string;
}

// userId is the real users.user_id UUID for an existing, role-matching row
// (role_id 2 = vendor, role_id 1 = admin) - a real, valid FK value is required
// because queries.vendor_id (and other FKs to users) are uuid-typed columns.
const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'vendor@example.com',
    password: 'password123',
    role: 'vendor',
    userId: 'a8ce8695-f324-4433-b061-1b597062058f', // ABC Construction Ltd
    name: 'Demo Vendor',
  },
  {
    email: 'admin@nhai.gov.in',
    password: 'admin123',
    role: 'admin',
    userId: '6843a736-4a55-49c4-9c76-52aa24e9ab84', // Priya Sharma, NHAI
    name: 'Demo Admin',
  },
];

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(loginDto: LoginDto) {
    const account = DEMO_ACCOUNTS.find(
      (candidate) =>
        candidate.email.toLowerCase() === loginDto.email.toLowerCase() &&
        candidate.password === loginDto.password &&
        candidate.role === loginDto.role,
    );

    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: account.userId,
      email: account.email,
      role: account.role,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: {
        id: account.userId,
        email: account.email,
        name: account.name,
        role: account.role,
      },
    };
  }
}
