import api from './axios'

export const getDashboardOverview = () =>
  api.get('/admin/dashboard').then(r => r.data.data)

/** Doanh thu nhóm theo ngày/tuần/tháng, hỗ trợ filter category + brand */
export const getDashboardRevenueGrouped = ({ dateFrom, dateTo, groupBy, categoryId, brand } = {}) =>
  api.get('/admin/dashboard/revenue-by-day', {
    params: {
      ...(dateFrom                     && { dateFrom }),
      ...(dateTo                       && { dateTo }),
      ...(groupBy                      && { groupBy }),
      ...(categoryId != null           && { categoryId }),
      ...(brand && brand !== ''        && { brand }),
    },
  }).then(r => r.data.data)

export const getDashboardTopProducts = (limit = 5) =>
  api.get('/admin/dashboard/top-products', { params: { limit } }).then(r => r.data.data)

export const getDashboardTopCustomers = (limit = 5) =>
  api.get('/admin/dashboard/top-customers', { params: { limit } }).then(r => r.data.data)

export const getDashboardCategoryRevenue = ({ brand } = {}) =>
  api.get('/admin/dashboard/category-revenue', {
    params: { ...(brand && brand !== '' && { brand }) },
  }).then(r => r.data.data)
