import React from 'react'
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import type { AdminProduct } from '../../mock/products'
import Pagination from './Pagination'
import ProductRow from './ProductRow'

const columns: ColumnDef<AdminProduct>[] = [
  { accessorKey: 'image', header: 'Hình ảnh' },
  { accessorKey: 'name', header: 'Tên sản phẩm & SKU' },
  { accessorKey: 'category', header: 'Danh mục' },
  { accessorKey: 'price', header: 'Giá bán' },
  { accessorKey: 'stock', header: 'Tồn kho' },
  { accessorKey: 'sold', header: 'Đã bán' },
  { accessorKey: 'status', header: 'Trạng thái' },
  { id: 'actions', header: 'Thao tác' },
]

type ProductsTableProps = {
  products: AdminProduct[]
  loading?: boolean
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onView: (product: AdminProduct) => void
  onEdit: (product: AdminProduct) => void
  onDelete: (product: AdminProduct) => void
  onToggleActive: (product: AdminProduct) => void
}

export default function ProductsTable({
  products,
  loading = false,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
}: ProductsTableProps) {
  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_18px_42px_rgba(53,32,32,0.10)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse">
          <thead className="bg-[#f8fafc]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-5 py-6 text-left text-sm font-extrabold uppercase tracking-[0.16em] text-[#4a2c2b] first:px-7 last:px-6 last:text-right">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-7 py-12 text-center text-sm font-semibold text-slate-500" colSpan={columns.length}>
                  Đang tải sản phẩm...
                </td>
              </tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td className="px-7 py-12 text-center text-sm font-semibold text-slate-500" colSpan={columns.length}>
                  Không có sản phẩm phù hợp.
                </td>
              </tr>
            )}
            {!loading && products.map((product) => (
              <ProductRow key={product.id} product={product} onDelete={onDelete} onEdit={onEdit} onView={onView} onToggleActive={onToggleActive} />
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
      />
    </section>
  )
}
