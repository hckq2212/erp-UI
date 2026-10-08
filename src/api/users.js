import { api } from '../store/api';

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: (params) => ({
        url: '/users',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Users', id })),
              { type: 'Users', id: 'LIST' },
            ]
          : [{ type: 'Users', id: 'LIST' }],
    }),
    getUser: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),
    createUser: builder.mutation({
      query: (data) => ({
        url: '/users',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/users/${id}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),
    updateUserLaborContracts: builder.mutation({
      query: ({ id, laborContract }) => ({
        url: `/users/${id}/labor-contracts`,
        method: 'PATCH',
        body: { laborContract },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),
    updateUserProfile: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateUserRoleMutation,
  useUpdateUserLaborContractsMutation,
  useUpdateUserProfileMutation,
} = usersApi;
