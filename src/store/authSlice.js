import { createSlice } from '@reduxjs/toolkit';
import { authApi } from '../api/auth';

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      // payload could be { user: ... } or just the user object
      const user = action.payload?.user || action.payload;
      state.user = user;
      state.isAuthenticated = !!user;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(authApi.endpoints.login.matchFulfilled, (state, action) => {
        const user = action.payload?.user || action.payload;
        state.user = user;
        state.isAuthenticated = !!user;
        state.isLoading = false;
      })
      .addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      .addMatcher(authApi.endpoints.getMe.matchFulfilled, (state, action) => {
        const user = action.payload?.user || action.payload;
        state.user = user;
        state.isAuthenticated = !!user;
        state.isLoading = false;
      })
      .addMatcher(authApi.endpoints.getMe.matchRejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
