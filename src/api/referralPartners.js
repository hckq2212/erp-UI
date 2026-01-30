import { api } from '../store/api';

export const referralPartnersApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getReferralPartners: builder.query({
            query: (params) => ({
                url: '/referral-partners',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'ReferralPartners', id })),
                        { type: 'ReferralPartners', id: 'LIST' },
                    ]
                    : [{ type: 'ReferralPartners', id: 'LIST' }],
        }),
        getReferralPartner: builder.query({
            query: (id) => `/referral-partners/${id}`,
            providesTags: (result, error, id) => [{ type: 'ReferralPartners', id }],
        }),
        getReferralPartnerStatistics: builder.query({
            query: (id) => `/referral-partners/${id}/statistics`,
            providesTags: (result, error, id) => [
                { type: 'ReferralPartners', id: `${id}-STATS` },
            ],
        }),
        createReferralPartner: builder.mutation({
            query: (data) => ({
                url: '/referral-partners',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'ReferralPartners', id: 'LIST' }],
        }),
        updateReferralPartner: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/referral-partners/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'ReferralPartners', id },
                { type: 'ReferralPartners', id: 'LIST' },
                { type: 'ReferralPartners', id: `${id}-STATS` },
            ],
        }),
        deleteReferralPartner: builder.mutation({
            query: (id) => ({
                url: `/referral-partners/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'ReferralPartners', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetReferralPartnersQuery,
    useGetReferralPartnerQuery,
    useGetReferralPartnerStatisticsQuery,
    useCreateReferralPartnerMutation,
    useUpdateReferralPartnerMutation,
    useDeleteReferralPartnerMutation,
} = referralPartnersApi;
