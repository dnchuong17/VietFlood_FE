export type SignInPayload = {
  username: string;
  password: string;
};

export type SignInResponse = {
  accessToken: string;
  refresh_token?: string;
};

export type AuthProfile = {
  role?: string;
};
