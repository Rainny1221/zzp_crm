import { User } from "src/generated/prisma/client";

export type UserWithRoles = User & {
  roles: {
    role: {
      name: string;
    };
  }[];
};


  