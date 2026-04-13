import { Gender } from '../../domain/entities/user.entity';

export class UpdateProfileCommand {
  constructor(
    public readonly userId: number,
    public readonly data: {
      name?: string;
      phone_number?: string;
      address?: string;
      age?: number;
      bio?: string;
      gender?: Gender;
      hobby?: string;
      major?: string;
      avatar?: Record<string, unknown>;
      hobby_ids?: number[];
    },
  ) {}
}
