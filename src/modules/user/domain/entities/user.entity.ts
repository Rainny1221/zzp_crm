import { DomainEvent } from 'src/modules/shared/domain/domain-event.base';
import { Email } from '../value-objects/email.vo';
import { UserProfileUpdatedEvent } from '../events/user-profile-updated.event';
import { UserAvatarUpdatedEvent } from '../events/user-avatar-updated.event';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface CreateUserProps {
  id?: number;
  email: string;
  name?: string;
  phoneNumber?: string;
  avatar?: Record<string, unknown>;
  bio?: string;
  address?: string;
  age?: number;
  gender?: Gender;
  major?: string;
  freeTimeActivity?: string;
  hobbyIds?: number[];
  isVerified?: boolean;
  isActive?: boolean;
  isBlock?: boolean;
}

export interface UpdateProfileProps {
  name?: string;
  phoneNumber?: string;
  address?: string;
  age?: number;
  bio?: string;
  gender?: Gender;
  hobby?: string;
  major?: string;
  avatar?: Record<string, unknown>;
  hobbyIds?: number[];
}

export class UserEntity {
  private _domainEvents: DomainEvent[] = [];

  private constructor(
    private readonly _id: number,
    private _email: Email,
    private _name: string | null,
    private _phoneNumber: string | null,
    private _avatar: Record<string, unknown> | null,
    private _bio: string | null,
    private _address: string | null,
    private _age: number | null,
    private _gender: Gender | null,
    private _major: string | null,
    private _freeTimeActivity: string | null,
    private _hobbyIds: number[],
    private _isVerified: boolean,
    private _isActive: boolean,
    private _isBlock: boolean,
  ) {}

  // Used when creating a brand new user
  static create(props: CreateUserProps): UserEntity {
    const email = Email.create(props.email);
    return new UserEntity(
      props.id ?? 0,
      email,
      props.name ?? null,
      props.phoneNumber ?? null,
      props.avatar ?? null,
      props.bio ?? null,
      props.address ?? null,
      props.age ?? null,
      props.gender ?? null,
      props.major ?? null,
      props.freeTimeActivity ?? null,
      props.hobbyIds ?? [],
      props.isVerified ?? false,
      props.isActive ?? false,
      props.isBlock ?? false,
    );
  }

  // Used when loading from database via mapper
  static reconstitute(props: CreateUserProps & { id: number }): UserEntity {
    const email = Email.create(props.email);
    return new UserEntity(
      props.id,
      email,
      props.name ?? null,
      props.phoneNumber ?? null,
      props.avatar ?? null,
      props.bio ?? null,
      props.address ?? null,
      props.age ?? null,
      props.gender ?? null,
      props.major ?? null,
      props.freeTimeActivity ?? null,
      props.hobbyIds ?? [],
      props.isVerified ?? false,
      props.isActive ?? false,
      props.isBlock ?? false,
    );
  }

  updateProfile(data: UpdateProfileProps): void {
    if (data.name !== undefined) this._name = data.name;
    if (data.phoneNumber !== undefined) this._phoneNumber = data.phoneNumber;
    if (data.address !== undefined) this._address = data.address;
    if (data.age !== undefined) this._age = data.age;
    if (data.bio !== undefined) this._bio = data.bio;
    if (data.gender !== undefined) this._gender = data.gender;
    if (data.major !== undefined) this._major = data.major;
    if (data.avatar !== undefined) this._avatar = data.avatar;
    if (data.hobbyIds !== undefined) this._hobbyIds = data.hobbyIds;

    this._domainEvents.push(new UserProfileUpdatedEvent(this._id));
  }

  updateAvatar(avatarKey: string): void {
    this._avatar = { key: avatarKey };
    this._domainEvents.push(new UserAvatarUpdatedEvent(this._id, avatarKey));
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  // Getters
  get id(): number {
    return this._id;
  }

  get email(): string {
    return this._email.value;
  }

  get name(): string | null {
    return this._name;
  }

  get phoneNumber(): string | null {
    return this._phoneNumber;
  }

  get avatar(): Record<string, unknown> | null {
    return this._avatar;
  }

  get bio(): string | null {
    return this._bio;
  }

  get address(): string | null {
    return this._address;
  }

  get age(): number | null {
    return this._age;
  }

  get gender(): Gender | null {
    return this._gender;
  }

  get major(): string | null {
    return this._major;
  }

  get freeTimeActivity(): string | null {
    return this._freeTimeActivity;
  }

  get hobbyIds(): number[] {
    return [...this._hobbyIds];
  }

  get isVerified(): boolean {
    return this._isVerified;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get isBlock(): boolean {
    return this._isBlock;
  }
}
