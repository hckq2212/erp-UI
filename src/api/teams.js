import { api } from '../store/api';

export const teamsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTeams: builder.query({
      query: () => '/teams',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Teams', id })),
              { type: 'Teams', id: 'LIST' },
            ]
          : [{ type: 'Teams', id: 'LIST' }],
    }),
    getTeam: builder.query({
      query: (id) => `/teams/${id}`,
      providesTags: (result, error, id) => [{ type: 'Teams', id }],
    }),
    getTeamMembers: builder.query({
      query: (teamId) => `/teams/${teamId}/members`,
      providesTags: (result, error, teamId) => [
        { type: 'Teams', id: teamId },
        { type: 'Teams', id: 'LIST' },
      ],
    }),
    createTeam: builder.mutation({
      query: (data) => ({
        url: '/teams',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Teams', id: 'LIST' }],
    }),
    updateTeam: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/teams/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Teams', id },
        { type: 'Teams', id: 'LIST' },
      ],
    }),
    deleteTeam: builder.mutation({
      query: (id) => ({
        url: `/teams/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Teams', id: 'LIST' }],
    }),
    addTeamMember: builder.mutation({
      query: ({ id, userId }) => ({
        url: `/teams/${id}/members`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Teams', id },
        { type: 'Teams', id: 'LIST' },
      ],
    }),
    removeTeamMember: builder.mutation({
      query: (memberId) => ({
        url: `/teams/members/${memberId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Teams', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetTeamsQuery,
  useGetTeamQuery,
  useGetTeamMembersQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
} = teamsApi;
