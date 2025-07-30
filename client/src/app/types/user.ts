export interface User {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  groups: string[];
  lastName: string;
  username: string;
}

export interface UserJwt extends User {
  sub: string;
  iat?: number;
  exp?: number;
}
