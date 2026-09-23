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
      query: (arg) => {
        const teamId = typeof arg === 'object' ? arg.teamId : arg;
        const params = new URLSearchParams();
        if (typeof arg === 'object') {
          if (arg.month) params.append('month', arg.month);
          if (arg.year) params.append('year', arg.year);
        }
        const queryString = params.toString();
        return `/teams/${teamId}/members${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: (result, error, arg) => {
        const teamId = typeof arg === 'object' ? arg.teamId : arg;
        return [
        { type: 'Teams', id: teamId },
        { type: 'Teams', id: 'LIST' },
      ];
      },
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
        { type: 'Projects' },
        { type: 'Tasks' },
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
      query: ({ id, userId, role, roles }) => ({
        url: `/teams/${id}/members`,
        method: 'POST',
        body: { userId, role, roles },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Teams', id },
        { type: 'Teams', id: 'LIST' },
      ],
    }),
    updateTeamMember: builder.mutation({
      query: ({ memberId, ...data }) => ({
        url: `/teams/members/${memberId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { teamId }) => [
        { type: 'Teams', id: teamId },
        { type: 'Teams', id: 'LIST' },
        { type: 'Projects' },
        { type: 'Tasks' },
      ],
    }),
    updateTeamMemberRoles: builder.mutation({
      query: ({ teamId, userId, roles }) => ({
        url: `/teams/${teamId}/members/${userId}/roles`,
        method: 'PUT',
        body: { roles },
      }),
      invalidatesTags: (result, error, { teamId }) => [
        { type: 'Teams', id: teamId },
        { type: 'Teams', id: 'LIST' },
        { type: 'Projects' },
        { type: 'Tasks' },
      ],
    }),
    changeLead: builder.mutation({
      query: ({ id, newLeadId }) => ({
        url: `/teams/${id}/lead`,
        method: 'PUT',
        body: { newLeadId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Teams', id },
        { type: 'Teams', id: 'LIST' },
        { type: 'Projects' },
        { type: 'Tasks' },
      ],
    }),
    removeTeamMember: builder.mutation({
      query: (arg) => ({
        url: `/teams/members/${typeof arg === 'object' ? arg.memberId : arg}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Teams', id: typeof arg === 'object' ? arg.teamId : undefined },
        { type: 'Teams', id: 'LIST' },
        { type: 'Projects' },
        { type: 'Tasks' },
      ].filter(tag => tag.id !== undefined || tag.type === 'Projects' || tag.type === 'Tasks'),
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
  useUpdateTeamMemberMutation,
  useUpdateTeamMemberRolesMutation,
  useRemoveTeamMemberMutation,
  useChangeLeadMutation,
  useLazyGetTeamMembersQuery,
  useLazyGetTeamsQuery
} = teamsApi;
