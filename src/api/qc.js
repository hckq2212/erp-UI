import { api } from '../store/api';

export const qcApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getQcProductInfo: builder.query({
      query: (projectId) => `/qc/product-info/${projectId}`,
    }),
  }),
});

export const { useGetQcProductInfoQuery } = qcApi;
