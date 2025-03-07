document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing page');
    
    // 初始化全局数据数组
    window.allTableData = [];
    window.filteredData = [];
    
    // 加载默认数据
    loadDefaultData();
    
    // Month Selector Dropdown
    const monthSelector = document.getElementById('monthSelector');
    const monthDropdown = document.getElementById('monthDropdown');
    const currentMonth = document.getElementById('currentMonth');
    
    if (monthSelector && monthDropdown && currentMonth) {
        monthSelector.addEventListener('click', function(event) {
            console.log("Month selector clicked");
            event.stopPropagation();
            
            // Toggle dropdown
            if (monthDropdown.style.display === 'block') {
                monthDropdown.style.display = 'none';
            } else {
                monthDropdown.style.display = 'block';
            }
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!monthSelector.contains(event.target)) {
                monthDropdown.style.display = 'none';
            }
        });
        
        // Month item selection
        const monthItems = document.querySelectorAll('.month-item');
        monthItems.forEach(function(item) {
            item.addEventListener('click', function() {
                const monthText = this.querySelector('span') ? this.querySelector('span').textContent : this.textContent;
                currentMonth.textContent = monthText.substring(0, 3) + ' ' + monthText.split(' ')[1];
                
                // Update active state
                monthItems.forEach(mi => mi.classList.remove('active'));
                this.classList.add('active');
                
                // Hide dropdown
                monthDropdown.style.display = 'none';
            });
        });
    }
    
    // Settings Modal
    const settingsIcon = document.getElementById('settingsIcon');
    const settingsModal = document.getElementById('settingsModal');
    const closeModal = document.getElementById('closeModal');
    const cancelSettings = document.getElementById('cancelSettings');
    const applySettings = document.getElementById('applySettings');
    
    if (settingsIcon && settingsModal) {
        settingsIcon.addEventListener('click', function() {
            console.log('Settings icon clicked');
            settingsModal.style.display = 'flex';
        });
        
        if (closeModal) {
            closeModal.addEventListener('click', function() {
                console.log('Close modal clicked');
                settingsModal.style.display = 'none';
            });
        }
        
        if (cancelSettings) {
            cancelSettings.addEventListener('click', function() {
                console.log('Cancel settings clicked');
                settingsModal.style.display = 'none';
            });
        }
        
        if (applySettings) {
            applySettings.addEventListener('click', function() {
                console.log('Apply settings clicked');
                settingsModal.style.display = 'none';
                displayTablePage();
            });
        }
    }
    
    // 初始化分页功能
    initPagination();
    
    // 初始化列设置功能
    initColumnSettings();
    
    // 初始化文件上传功能
    initFileUpload();
    
    // 初始化侧边栏点击事件
    initSidebarEvents();
    
    // 初始化过滤器标签点击事件
    initFilterTags();
    
    // 初始化删除确认弹窗
    initDeleteConfirmation();
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
    displayTablePage();
    
    // 更新统计信息
    updateStats();
}

// 生成默认数据
function generateDefaultData(count) {
    const data = [];
    const carriers = ['Aetna', 'UnitedHealth', 'Cigna', 'Humana', 'Anthem'];
    const statuses = ['pending', 'posted'];
    
    for (let i = 0; i < count; i++) {
        const randomCarrier = carriers[Math.floor(Math.random() * carriers.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const randomRevenue = Math.floor(Math.random() * 50000) + 10000; // $10,000 - $60,000
        const randomTransactions = Math.floor(Math.random() * 100) + 20; // 20-120 交易
        
        data.push({
            id: i + 1,
            carrier: randomCarrier,
            fileName: `Statement_${randomCarrier}_${i + 1}.xlsx`,
            uploadedOn: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            transactions: randomTransactions,
            revenue: randomRevenue,
            status: randomStatus
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
    console.log('Adding Excel data to table:', data);
    
    // 确保数据是数组
    if (!Array.isArray(data)) {
        console.error('Invalid data format:', data);
        return;
    }
    
    // 处理数据并添加到表格
    const processedData = data.map((row, index) => {
        // 生成随机的 transactions 数量 (20-120)
        const randomTransactions = Math.floor(Math.random() * 100) + 20;
        
        // 生成随机的 Revenue 金额 ($10,000 - $60,000)
        const randomRevenue = Math.floor(Math.random() * 50000) + 10000;
        
        return {
            id: window.allTableData.length + index + 1,
            carrier: row.Carrier || row.carrier || 'Unknown',
            fileName: fileName,
            uploadedOn: new Date().toLocaleDateString(),
            transactions: randomTransactions, // 添加随机生成的交易数量
            revenue: randomRevenue, // 添加随机生成的收入金额
            status: 'pending'
        };
    });
    
    // 添加到表格数据
    window.allTableData = [...window.allTableData, ...processedData];
    window.filteredData = [...window.allTableData];
    
    // 更新统计信息
    updateStats();
    
    // 显示表格
    displayTablePage();
    
    // 显示成功通知
    showNotification('success', `Successfully processed ${processedData.length} records from ${fileName}`);
}

// 初始化删除确认弹窗
function initDeleteConfirmation() {
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const closeDeleteConfirm = document.getElementById('close-delete-confirm');
    const confirmDelete = document.getElementById('confirm-delete');
    const cancelDelete = document.getElementById('cancel-delete');
    
    if (!deleteConfirmModal) return;
    
    // 关闭按钮
    if (closeDeleteConfirm) {
        closeDeleteConfirm.addEventListener('click', function() {
            deleteConfirmModal.style.display = 'none';
        });
    }
    
    // 取消按钮
    if (cancelDelete) {
        cancelDelete.addEventListener('click', function() {
            deleteConfirmModal.style.display = 'none';
        });
    }
    
    // 确认删除按钮
    if (confirmDelete) {
        confirmDelete.addEventListener('click', function() {
            const recordId = parseInt(deleteConfirmModal.dataset.recordId);
            if (!isNaN(recordId)) {
                // 删除记录
                window.allTableData = window.allTableData.filter(item => item.id !== recordId);
                window.filteredData = window.filteredData.filter(item => item.id !== recordId);
                
                // 更新表格
                displayTablePage();
                
                // 更新统计信息
                updateStats();
                
                // 关闭弹窗
                deleteConfirmModal.style.display = 'none';
                
                // 显示成功消息
                alert('Record deleted successfully');
            }
        });
    }
}

// 显示删除确认弹窗
function showDeleteConfirmation(recordId) {
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    if (!deleteConfirmModal) return;
    
    // 设置记录ID
    deleteConfirmModal.dataset.recordId = recordId;
    
    // 显示弹窗
    deleteConfirmModal.style.display = 'block';
}

// 更新统计信息
function updateStats() {
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

// 显示当前页的表格数据
function displayTablePage() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    
    const tableHeader = document.querySelector('#data-table thead tr');
    if (!tableHeader) return;
    
    // 清空表格内容
    tableBody.innerHTML = '';
    tableHeader.innerHTML = '';
    
    if (!window.filteredData || window.filteredData.length === 0) {
        updatePaginationInfo();
        return;
    }
    
    const startIndex = (window.currentPage - 1) * window.rowsPerPage;
    const endIndex = Math.min(startIndex + window.rowsPerPage, window.filteredData.length);
    const pageData = window.filteredData.slice(startIndex, endIndex);
    
    // 获取当前显示的列
    const visibleColumns = getVisibleColumns();
    
    // 创建表头
    if (visibleColumns.includes('carrier')) {
        const th = document.createElement('th');
        th.textContent = 'Carrier';
        th.classList.add('sortable');
        th.dataset.sort = 'carrier';
        th.innerHTML = 'Carrier <i class="fas fa-sort"></i>';
        tableHeader.appendChild(th);
    }
    
    if (visibleColumns.includes('filename')) {
        const th = document.createElement('th');
        th.textContent = 'File Name';
        th.classList.add('sortable');
        th.dataset.sort = 'filename';
        th.innerHTML = 'File Name <i class="fas fa-sort"></i>';
        tableHeader.appendChild(th);
    }
    
    if (visibleColumns.includes('uploaded')) {
        const th = document.createElement('th');
        th.textContent = 'Uploaded On';
        th.classList.add('sortable');
        th.dataset.sort = 'uploaded';
        th.innerHTML = 'Uploaded On <i class="fas fa-sort"></i>';
        tableHeader.appendChild(th);
    }
    
    if (visibleColumns.includes('transactions')) {
        const th = document.createElement('th');
        th.textContent = 'Total Transaction Number';
        th.classList.add('sortable');
        th.dataset.sort = 'transactions';
        th.innerHTML = 'Total Transaction Number <i class="fas fa-sort"></i>';
        tableHeader.appendChild(th);
    }
    
    if (visibleColumns.includes('revenue')) {
        const th = document.createElement('th');
        th.textContent = 'Revenue';
        th.classList.add('sortable');
        th.dataset.sort = 'revenue';
        th.innerHTML = 'Revenue <i class="fas fa-sort"></i>';
        tableHeader.appendChild(th);
    }
    
    if (visibleColumns.includes('status')) {
        const th = document.createElement('th');
        th.textContent = 'Status';
        th.classList.add('sortable');
        th.dataset.sort = 'status';
        th.innerHTML = 'Status <i class="fas fa-sort"></i>';
        tableHeader.appendChild(th);
    }
    
    // 添加操作列
    if (visibleColumns.includes('actions')) {
        const th = document.createElement('th');
        th.textContent = 'Actions';
        tableHeader.appendChild(th);
    }
    
    // 创建表格行
    pageData.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'table-row';
        row.setAttribute('data-id', item.id);
        
        // 添加单元格
        if (visibleColumns.includes('carrier')) {
            const td = document.createElement('td');
            td.textContent = item.carrier;
            row.appendChild(td);
        }
        
        if (visibleColumns.includes('filename')) {
            const td = document.createElement('td');
            td.textContent = item.fileName;
            row.appendChild(td);
        }
        
        if (visibleColumns.includes('uploaded')) {
            const td = document.createElement('td');
            td.textContent = item.uploadedOn;
            row.appendChild(td);
        }
        
        if (visibleColumns.includes('transactions')) {
            const td = document.createElement('td');
            td.textContent = item.transactions;
            row.appendChild(td);
        }
        
        if (visibleColumns.includes('revenue')) {
            const td = document.createElement('td');
            td.textContent = formatCurrency(item.revenue);
            row.appendChild(td);
        }
        
        if (visibleColumns.includes('status')) {
            const td = document.createElement('td');
            const statusIcon = document.createElement('i');
            
            if (item.status === 'pending') {
                statusIcon.className = 'fas fa-clock status-icon pending';
            } else if (item.status === 'posted') {
                statusIcon.className = 'fas fa-check-circle status-icon posted';
            }
            
            td.appendChild(statusIcon);
            row.appendChild(td);
        }
        
        // 添加操作列
        if (visibleColumns.includes('actions')) {
            const actionTd = document.createElement('td');
            actionTd.innerHTML = `
                <div class="action-menu">
                    <div class="action-dots">
                        <i class="fas fa-ellipsis-v"></i>
                    </div>
                    <div class="action-dropdown">
                        <div class="action-item view-details">
                            <i class="fas fa-eye"></i> View Details
                        </div>
                        <div class="action-item delete-record">
                            <i class="fas fa-trash-alt"></i> Delete
                        </div>
                    </div>
                </div>
            `;
            row.appendChild(actionTd);
        }
        
        // 添加到表格
        tableBody.appendChild(row);
    });
    
    // 更新分页信息
    updatePaginationInfo();
    
    // 设置行点击事件
    initializeTableRows();
    
    // 设置操作菜单
    setupActionMenus();
}

// 初始化表格行点击事件
function initializeTableRows() {
    const tableRows = document.querySelectorAll('.table-row');
    
    tableRows.forEach(row => {
        // 查看详情
        row.addEventListener('click', function(e) {
            // 如果点击的是操作菜单，不执行行点击事件
            if (e.target.closest('.action-menu')) {
        return;
    }
    
            const recordId = parseInt(this.dataset.id);
            if (!isNaN(recordId)) {
                // 跳转到详情页面
                window.location.href = `transaction.html?id=${recordId}`;
            }
        });
        
        // 删除记录
        const deleteBtn = row.querySelector('.delete-record');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const recordId = parseInt(row.dataset.id);
                if (!isNaN(recordId)) {
                    showDeleteConfirmation(recordId);
                }
            });
        }
        
        // 查看详情
        const viewDetailsBtn = row.querySelector('.view-details');
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const recordId = parseInt(row.dataset.id);
                if (!isNaN(recordId)) {
                    window.location.href = `transaction.html?id=${recordId}`;
                }
            });
        }
    });
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

// 初始化分页功能
function initPagination() {
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const rowsPerPageSelect = document.getElementById('rows-per-page');
    
    if (prevPageBtn) {
    prevPageBtn.addEventListener('click', function() {
        if (window.currentPage > 1) {
            window.currentPage--;
            displayTablePage();
        }
    });
    }
    
    if (nextPageBtn) {
    nextPageBtn.addEventListener('click', function() {
        const totalPages = Math.ceil(window.filteredData.length / window.rowsPerPage);
        if (window.currentPage < totalPages) {
            window.currentPage++;
            displayTablePage();
        }
    });
    }
    
    if (rowsPerPageSelect) {
    rowsPerPageSelect.addEventListener('change', function() {
        window.rowsPerPage = parseInt(this.value);
        window.currentPage = 1;
        displayTablePage();
    });
    }
}

// 更新分页信息
function updatePaginationInfo() {
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
}

// 获取当前显示的列
function getVisibleColumns() {
    console.log('Getting visible columns');
    const columns = [];
    
    // 检查每个列的复选框状态
    const checkColumn = (id, columnName) => {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            columns.push(columnName);
        }
    };
    
    checkColumn('carrierColumn', 'carrier');
    checkColumn('filenameColumn', 'filename');
    checkColumn('uploadedColumn', 'uploaded');
    checkColumn('tranColumn', 'transactions');
    checkColumn('revenueColumn', 'revenue');
    checkColumn('statusColumn', 'status');
    checkColumn('actionsColumn', 'actions');
    
    console.log('Visible columns:', columns);
    
    // 如果没有选中任何列，返回默认列
    return columns.length > 0 ? columns : ['carrier', 'filename', 'uploaded', 'transactions', 'revenue', 'status', 'actions'];
}

// 初始化列设置功能
function initColumnSettings() {
    console.log('Initializing column settings');
    const columnCheckboxes = document.querySelectorAll('.column-checkbox');
    
    // 初始化时应用当前列设置
    displayTablePage();
    
    columnCheckboxes.forEach(checkbox => {
        // 移除旧的事件监听器（如果有的话）
        const newCheckbox = checkbox.cloneNode(true);
        checkbox.parentNode.replaceChild(newCheckbox, checkbox);
        
        // 添加新的事件监听器
        newCheckbox.addEventListener('change', function() {
            console.log('Column checkbox changed:', this.id, 'checked:', this.checked);
            
            // 至少保留一列
            const checkedCount = document.querySelectorAll('.column-checkbox:checked').length;
            if (checkedCount === 0) {
                this.checked = true;
                alert('At least one column must be selected');
                return;
            }
            
            // 立即应用列设置
            displayTablePage();
        });
    });
}

// 初始化侧边栏点击事件
function initSidebarEvents() {
    const sidebarItems = document.querySelectorAll('.sidebar-item:not(.active)');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            const itemName = this.querySelector('span').textContent;
            if (itemName === 'Dashboard') {
                window.location.href = 'dashboard.html';
            } else if (itemName === 'Reporting') {
                window.location.href = 'reporting.html';
            } else if (itemName === 'Admin') {
                window.location.href = 'admin.html';
            }
        });
    });
}

// 初始化过滤器标签点击事件
function initFilterTags() {
    console.log('Initializing filter tags');
    const filterTags = document.querySelectorAll('.filter-tag');
    
    filterTags.forEach(tag => {
        // 移除旧的事件监听器
        const newTag = tag.cloneNode(true);
        tag.parentNode.replaceChild(newTag, tag);
        
        // 添加新的事件监听器
        newTag.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Filter tag clicked:', this.textContent.trim());
            console.log('Current classList:', Array.from(this.classList));
            
            // 如果是同一类型的标签，先移除其他标签的 active 类
            const tagType = this.getAttribute('data-type');
            console.log('Tag type:', tagType);
            
            if (tagType) {
                document.querySelectorAll(`.filter-tag[data-type="${tagType}"]`).forEach(t => {
                    console.log('Removing active from:', t.textContent.trim());
                    t.classList.remove('active');
                });
            }
            
            // 添加 active 类到当前标签
            this.classList.add('active');
            console.log('After adding active:', Array.from(this.classList));
            console.log('Is active now:', this.classList.contains('active'));
        });
    });
}

function showNotification(type, message) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // 设置图标
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    // 设置内容
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button class="close-notification"><i class="fas fa-times"></i></button>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 添加关闭按钮事件
    notification.querySelector('.close-notification').addEventListener('click', function() {
        document.body.removeChild(notification);
    });
    
    // 自动关闭
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 5000);
} 