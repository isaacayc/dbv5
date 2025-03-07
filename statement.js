// 页面加载时执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing page');
    
    // 加载默认数据
    loadDefaultData();
    
    // 初始化文件上传
    initFileUpload();
    
    // 初始化过滤器标签点击事件
    initFilterTags();
});

// 加载默认数据
function loadDefaultData() {
    // 生成 25 条默认数据
    const defaultData = generateDefaultData(25);
    
    // 设置全局数据
    window.allTableData = defaultData;
    window.filteredData = [...defaultData];
    window.currentPage = 1;
    window.rowsPerPage = 25;
    
    // 显示数据
    displayTableData();
    
    // 更新统计信息
    updateStatistics();
}

// 生成默认数据
function generateDefaultData(count) {
    const carriers = [
        'US ABC Company', 'Global Insurance Co', 'Liberty Mutual', 'Travelers', 
        'AIG', 'Chubb', 'Zurich', 'Hartford', 'Nationwide', 'State Farm'
    ];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const years = [2023, 2024];
    const statuses = ['pending', 'posted'];
    
    const data = [];
    
    for (let i = 1; i <= count; i++) {
        const carrier = carriers[Math.floor(Math.random() * carriers.length)];
        const month = months[Math.floor(Math.random() * months.length)];
        const year = years[Math.floor(Math.random() * years.length)];
        const transactions = Math.floor(Math.random() * 50) + 5;
        const revenue = Math.floor(Math.random() * 50000) + 5000;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        data.push({
            id: i,
            carrier: carrier,
            fileName: `${month}_Statement_${i}.xlsx`,
            uploadedOn: `${month} ${Math.floor(Math.random() * 28) + 1}, ${year}`,
            transactions: transactions,
            revenue: revenue,
            status: status
        });
    }
    
    return data;
}

// 初始化文件上传功能
function initFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (!uploadArea || !fileInput) {
        console.error('Upload area or file input not found');
        return;
    }
    
    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', function(e) {
        // 防止点击到子元素时不触发
        if (e.target === uploadArea || uploadArea.contains(e.target)) {
            fileInput.click();
        }
    });
    
    // 文件选择事件
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                processExcelFile(file);
            } else {
                alert('Please upload Excel files only (.xlsx or .xls)');
            }
        }
    });
    
    // 拖拽文件
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = '#3470e4';
        this.style.backgroundColor = '#f1f8ff';
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = '#ddd';
        this.style.backgroundColor = '#f8f9fa';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.style.borderColor = '#ddd';
        this.style.backgroundColor = '#f8f9fa';
        
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                processExcelFile(file);
            } else {
                alert('Please upload Excel files only (.xlsx or .xls)');
            }
        }
    });
}

// 处理Excel文件
function processExcelFile(file) {
    console.log('Processing Excel file:', file.name);
    
    // 显示加载中
    const loaderOverlay = document.getElementById('loaderOverlay');
    if (loaderOverlay) {
        loaderOverlay.style.display = 'flex';
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 获取第一个工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // 转换为JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            console.log('Excel data:', jsonData);
            
            // 处理数据
            addExcelDataToTable(jsonData, file.name);
            
        } catch (error) {
            console.error('Error processing Excel file:', error);
            alert('Error processing Excel file: ' + error.message);
        } finally {
            // 隐藏加载中
            if (loaderOverlay) {
                loaderOverlay.style.display = 'none';
            }
        }
    };
    
    reader.onerror = function() {
        console.error('Error reading file');
        alert('Error reading file');
        
        if (loaderOverlay) {
            loaderOverlay.style.display = 'none';
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// 将Excel数据添加到表格
function addExcelDataToTable(data, fileName) {
    if (!Array.isArray(data) || data.length === 0) {
        alert('No data found in the Excel file');
        return;
    }
    
    // 获取当前数据
    const currentData = window.allTableData || [];
    
    // 格式化当前日期
    const today = new Date();
    const formattedDate = `${today.toLocaleString('en-US', { month: 'short' })} ${today.getDate()}, ${today.getFullYear()}`;
    
    // 处理新数据
    const newData = data.map((row, index) => {
        // 尝试获取各个字段
        const carrier = row.Carrier || row.carrier || row['Carrier Name'] || 'Unknown';
        const transactions = parseInt(row.Transactions || row['Total Transactions'] || row.transactions || 0);
        let revenue = 0;
        
        // 处理收入字段
        if (row.Revenue || row.revenue || row['Total Revenue']) {
            const revenueStr = String(row.Revenue || row.revenue || row['Total Revenue']);
            revenue = parseFloat(revenueStr.replace(/[$,]/g, '')) || 0;
        }
        
        return {
            id: currentData.length + index + 1,
            carrier: carrier,
            fileName: fileName,
            uploadedOn: formattedDate,
            transactions: transactions,
            revenue: revenue,
            status: 'pending' // 新上传的数据默认为待处理
        };
    });
    
    // 合并数据
    window.allTableData = [...currentData, ...newData];
    window.filteredData = [...window.allTableData];
    
    // 显示数据
    displayTableData();
    
    // 更新统计信息
    updateStatistics();
    
    // 显示成功消息
    alert(`Successfully added ${newData.length} records from ${fileName}`);
}

// 显示表格数据
function displayTableData() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    // 清空表格
    tableBody.innerHTML = '';
    
    if (!window.filteredData || window.filteredData.length === 0) {
        return;
    }
    
    // 计算当前页的数据
    const startIndex = (window.currentPage - 1) * window.rowsPerPage;
    const endIndex = Math.min(startIndex + window.rowsPerPage, window.filteredData.length);
    const pageData = window.filteredData.slice(startIndex, endIndex);
    
    // 创建表格行
    pageData.forEach(item => {
        const row = document.createElement('tr');
        
        // 添加单元格
        row.innerHTML = `
            <td>${item.carrier}</td>
            <td>${item.fileName}</td>
            <td>${item.uploadedOn}</td>
            <td>${item.transactions}</td>
            <td>$${item.revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>
                <span class="status-badge ${item.status}">
                    ${item.status === 'posted' ? 
                        '<i class="fas fa-check-circle"></i> Posted' : 
                        '<i class="fas fa-clock"></i> Pending'}
                </span>
            </td>
            <td>
                <div class="action-menu">
                    <div class="action-dots">
                        <i class="fas fa-ellipsis-v"></i>
                    </div>
                    <div class="action-dropdown">
                        <div class="action-item">
                            <i class="fas fa-eye"></i> View Details
                        </div>
                        <div class="action-item">
                            <i class="fas fa-trash-alt"></i> Delete
                        </div>
                    </div>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // 更新分页信息
    updatePagination();
    
    // 设置操作菜单
    setupActionMenus();
}

// 更新分页信息
function updatePagination() {
    const currentPageEl = document.getElementById('current-page');
    const totalPagesEl = document.getElementById('total-pages');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (!currentPageEl || !totalPagesEl || !prevPageBtn || !nextPageBtn) return;
    
    const totalPages = Math.ceil(window.filteredData.length / window.rowsPerPage) || 1;
    
    currentPageEl.textContent = window.currentPage;
    totalPagesEl.textContent = totalPages;
    
    prevPageBtn.disabled = window.currentPage <= 1;
    nextPageBtn.disabled = window.currentPage >= totalPages;
    
    // 添加分页按钮事件
    prevPageBtn.onclick = function() {
        if (window.currentPage > 1) {
            window.currentPage--;
            displayTableData();
        }
    };
    
    nextPageBtn.onclick = function() {
        if (window.currentPage < totalPages) {
            window.currentPage++;
            displayTableData();
        }
    };
}

// 设置操作菜单
function setupActionMenus() {
    const actionDots = document.querySelectorAll('.action-dots');
    
    actionDots.forEach(dot => {
        dot.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // 关闭所有其他下拉菜单
            document.querySelectorAll('.action-dropdown').forEach(dropdown => {
                if (dropdown !== this.nextElementSibling) {
                    dropdown.style.display = 'none';
                }
            });
            
            // 切换当前下拉菜单
            const dropdown = this.nextElementSibling;
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    });
    
    // 点击页面其他地方关闭下拉菜单
    document.addEventListener('click', function() {
        document.querySelectorAll('.action-dropdown').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    });
}

// 更新统计信息
function updateStatistics() {
    // 获取统计元素
    const statValues = document.querySelectorAll('.stat-value');
    if (!statValues || statValues.length < 4) return;
    
    // 计算统计数据
    const totalStatements = window.allTableData.length;
    const unpostedStatements = window.allTableData.filter(item => item.status === 'pending').length;
    
    let totalRevenue = 0;
    let pendingRevenue = 0;
    
    window.allTableData.forEach(item => {
        const revenue = typeof item.revenue === 'number' ? item.revenue : 0;
        totalRevenue += revenue;
        
        if (item.status === 'pending') {
            pendingRevenue += revenue;
        }
    });
    
    // 更新统计显示
    statValues[0].textContent = totalStatements;
    statValues[1].textContent = unpostedStatements;
    statValues[2].textContent = formatCurrency(totalRevenue - pendingRevenue);
    statValues[3].textContent = formatCurrency(pendingRevenue);
}

// 格式化货币
function formatCurrency(value) {
    return '$' + value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// 初始化过滤器标签点击事件
function initFilterTags() {
    const filterTags = document.querySelectorAll('.filter-tag');
    
    filterTags.forEach(tag => {
        tag.addEventListener('click', function() {
            this.classList.toggle('active');
            console.log('Filter clicked:', this.textContent.trim());
        });
    });
} 