import {
  Injectable,
  CallHandler,
  ExecutionContext,
  NestInterceptor
} from '@nestjs/common';
import set from 'lodash.set';
import { InjectableResourceParameter } from 'src/enums/InjectableResourceParameter';
import { User } from 'src/models';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

export const INJECT_CONTEXT_VALUE = 'injectContextValue';

export type InjectContextValueParameters = {
  parameterType: InjectableResourceParameter;
  parameterPath: string;
};

@Injectable()
export class InjectContextInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const handler = context.getHandler();
    const graphqlContext = GqlExecutionContext.create(context);
    const { req } = graphqlContext.getContext();
    const args = graphqlContext.getArgs();

    const {
      parameterPath,
      parameterType
    } = this.getInjectContextValueParameters(handler);

    const parameterValue = this.getInjectableContextValue(
      req.user,
      parameterType
    );

    set(args, parameterPath, parameterValue);

    return next.handle();
  }

  private getInjectContextValueParameters(handler: Function) {
    return this.reflector.get<InjectContextValueParameters>(
      INJECT_CONTEXT_VALUE,
      handler
    );
  }

  private getInjectableContextValue(
    user: User,
    parameterType: InjectableResourceParameter
  ): string | undefined {
    switch (parameterType) {
      case InjectableResourceParameter.UserId: {
        return user.id;
      }
      case InjectableResourceParameter.OrganizationId: {
        return user.organization?.id;
      }
      default: {
        throw new Error(`Unexpected parameterType: ${parameterType}`);
      }
    }
  }
}