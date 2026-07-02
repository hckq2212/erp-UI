import { createSlice } from '@reduxjs/toolkit';
import { authApi } from '../api/auth';

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  sessionExpired: false,
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
      state.sessionExpired = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.sessionExpired = false;
    },
    sessionExpired: (state) => {
      state.sessionExpired = true;
    }
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(authApi.endpoints.login.matchFulfilled, (state, action) => {
        const user = action.payload?.user || action.payload;
        state.user = user;
        state.isAuthenticated = !!user;
        state.isLoading = false;
        state.sessionExpired = false;
      })
      .addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.sessionExpired = false;
      })
      .addMatcher(authApi.endpoints.getMe.matchFulfilled, (state, action) => {
        const user = action.payload?.user || action.payload;
        state.user = user;
        state.isAuthenticated = !!user;
        state.isLoading = false;
        state.sessionExpired = false;
      })
      .addMatcher(authApi.endpoints.getMe.matchRejected, (state, action) => {
        if (action.payload?.status === 401) {
          state.user = null;
          state.isAuthenticated = false;
        }
        state.isLoading = false;
      });
  },
});

export const { setCredentials, logout, sessionExpired } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectSessionExpired = (state) => state.auth.sessionExpired;
