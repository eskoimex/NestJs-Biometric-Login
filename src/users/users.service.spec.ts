import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        PrismaService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash password and create user', async () => {
    const email = 'test@example.com';
    const password = 'password';
    const hashedPassword = await bcrypt.hash(password, 10);

    jest.spyOn(prisma.user, 'create').mockResolvedValue({
      id: 1,
      email,
      password: hashedPassword,
      biometricKey: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const user = await service.createUser(email, password);
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email', email);
    expect(await bcrypt.compare(password, user.password)).toBe(true);
  });

  it('should validate user with correct email and password', async () => {
    const email = 'test@example.com';
    const password = 'password';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: 1,
      email,
      password: hashedPassword,
      biometricKey: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user);

    const result = await service.validateUser(email, password);
    expect(result).toHaveProperty('id', user.id);
    expect(result).toHaveProperty('email', email);
    expect(result).not.toHaveProperty('password');
  });

  it('should return null if user is not found', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

    const result = await service.validateUser(
      'nonexistent@example.com',
      'password',
    );
    expect(result).toBeNull();
  });

  it('should return null if password is incorrect', async () => {
    const email = 'test@example.com';
    const password = 'password';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: 1,
      email,
      password: hashedPassword,
      biometricKey: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user);

    const result = await service.validateUser(email, 'wrongpassword');
    expect(result).toBeNull();
  });

  it('should return JWT token for login', async () => {
    const user = { id:1, email: 'test@example.com', password:"bbbbb"};
    jest.spyOn(service, 'validateUser').mockResolvedValue(user);

    const result = await service.login(user);
    expect(result).toHaveProperty('access_token', 'test-token');
    expect(jwtService.sign).toHaveBeenCalledWith({
      username: user.email,
      sub: user.id,
    });
  });

  it('should return JWT token for biometric login', async () => {
    const biometricKey = 'biometric-key';
    const user = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedpassword',
      biometricKey,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(user);

    const result = await service.biometricLogin(biometricKey);
    expect(result).toEqual({ "access_token": "test-token" });
    expect(jwtService.sign).toHaveBeenCalledWith({
      email: user.email,
      sub: user.id,
    });
  });

  it('should throw an error for invalid biometric key', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

    await expect(service.biometricLogin('invalid-key')).rejects.toThrow(
      'Invalid biometric key',
    );
  });
});
