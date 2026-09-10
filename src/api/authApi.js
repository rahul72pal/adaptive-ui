import { apiClient } from './client';

export const authApi = {
  loginApi: async ({ email, password }) => {
    // FastAPI OAuth2PasswordRequestForm expects form URL-encoded payload
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const res = await apiClient.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    console.log(res);
    return res;
  },

  registerApi: async ({ email, name, password }) => {
    const res = await apiClient.post('/auth/register', {
      email,
      name,
      password,
    });
    console.log(res);
    return res;
  },

  getMeApi: async () => {
    const res = await apiClient.get('/auth/me');
    console.log(res);
    return res;
  },
};
