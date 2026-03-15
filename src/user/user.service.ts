import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ErrorFactory } from 'src/common/error.factory';
import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { UserDto } from './user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: Logger,
    ) {}

    async getUserById(id: number) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async getUserByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async updateProfile(userId: number, data: UserDto) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw ErrorFactory.create(
                    ErrorCode.USER_NOT_FOUND,
                    'User not found to update profile',
                );
            }

            const {hobby_ids, ...rest} = data;

            return this.prisma.user.update({
                where: { id: userId },
                data: {
                    ...rest,

                    ...(hobby_ids && {
                        user_hobbies: {
                            deleteMany: {},
                            create: hobby_ids.map((id) => ({
                                hobby: {
                                    connect: {
                                        id: id,
                                    },
                                },
                            })),
                        },
                    }),
                },
            });
        } catch (error) {
            this.logger.error(error);
            throw ErrorFactory.create(
                ErrorCode.UPDATE_PROFILE_FAILED,
                'Have error when update profile',
                error,  
            );
        }
    }

    async updateAvatar(userId: number, avatarKey: string) {
        try {
            this.logger.log(`Updating avatar for user ${userId} with key ${avatarKey}`);
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw ErrorFactory.create(
                    ErrorCode.USER_NOT_FOUND,
                    'User not found to update avatar',
                );
            }

            return this.prisma.user.update({
                where: { id: userId },
                data: { avatar: avatarKey },
            });
        } catch (error) {
            this.logger.error(error);
            throw ErrorFactory.create(
                ErrorCode.USER_NOT_FOUND,
                'User not found to update avatar',
                error,
            );
        }
    }
}
