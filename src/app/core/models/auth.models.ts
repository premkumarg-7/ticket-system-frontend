export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AdminRegisterRequest {
  username: string;
  email: string;
  password: string;
  roles: string[];
}

export interface JwtPayload {
  sub: string;       // username
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}
