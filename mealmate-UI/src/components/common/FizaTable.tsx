import React from 'react';

interface Column {
  key: string;
  label: string;
}

interface FizaTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
}

const FizaTable: React.FC<FizaTableProps> = ({ columns, data }) => {
  return (
    <div>
      {/* TODO: Bảng dữ liệu chuẩn cho các trang quản lý Admin:
        - Header với tên cột
        - Body với dữ liệu
        - Hỗ trợ sắp xếp, phân trang
        - Các nút hành động (Sửa, Xóa) ở cột cuối
      */}
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map((col) => (
                <td key={col.key}>{String(row[col.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FizaTable;
