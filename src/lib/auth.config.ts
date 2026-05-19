import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin/login',
  },
  providers: [],
  callbacks: {
    authorized: ({ auth, request }) => {
      const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
      const isLoginPage = request.nextUrl.pathname === '/admin/login';
      if (isAdminRoute && !isLoginPage) {
        return !!auth?.user;
      }
      return true;
    },
  },
};
