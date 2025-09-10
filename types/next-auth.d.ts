import { User as DbUser } from '@/lib/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User extends DbUser {}
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}