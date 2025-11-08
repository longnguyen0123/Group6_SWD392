import React from 'react';

// Component Phân trang (dùng chung)
// totalPages: Tổng số trang
// currentPage: Trang hiện tại
// paginate: Hàm (callback) để thay đổi trang
function Pagination({ totalPages, currentPage, paginate }) {
    
    // Tạo một mảng các số trang [1, 2, 3, ...]
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="pagination">
            {/* Nút Previous */}
            <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
            >
                &laquo; Previous
            </button>

            {/* Hiển thị Page X of Y (đơn giản) */}
            <span>
                Page {currentPage} of {totalPages}
            </span>

            {/* Nút Next */}
            <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
            >
                Next &raquo;
            </button>
        </div>
    );
}

export default Pagination;