import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './models/user.model';
import { JwtService } from '@nestjs/jwt';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
      private jwtService: JwtService,

  ) {}


  @Mutation(() => String)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<string> 
  {
    const user = await this.usersService.validateUser(email, password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }

  @Mutation(() => String)
  async biometricLogin(@Args('biometricKey') biometricKey: string) {
    const { access_token } =
      await this.usersService.biometricLogin(biometricKey);
    return access_token;
  }


  @Mutation(() => User)
  async register(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<User> {
    return this.usersService.createUser(email, password);
  }

  @Query(() => String)
  async healthCheck() {
    return 'API is working!';
  }
}
