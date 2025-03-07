/**
 * 数据对账平台 - Transaction Page JavaScript
 * 实现交易详情页面的交互功能
 */

document.addEventListener('DOMContentLoaded', function() {
    // 设置一个标记，表示Transaction页面已被访问
    sessionStorage.setItem('fromTransaction', 'true');
    
    // 获取URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const carrierId = urlParams.get('carrier');
    const fileName = urlParams.get('fileName');
    
    // 初始化页面
    initPage(carrierId, fileName);
    
    // 初始化月份选择器
    initMonthSelector();
    
    // 初始化表格排序功能
    initTableSort();
    
    // 初始化分页功能
    initPagination();
    
    // 初始化筛选功能
    initFilters();
    
    // 初始化列设置功能
    initColumnSettings();
    
    // 初始化Post按钮
    initPostButton();
    
    // 初始化Edit Mode按钮
    initEditModeButton();
    
    // 加载示例数据
    loadTransactionData();
    
    // 点击外部关闭操作菜单
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.action-menu')) {
            document.querySelectorAll('.action-menu').forEach(menu => {
                menu.classList.remove('active');
            });
        }
    });
    
    // 初始化侧边栏点击事件
    initSidebarEvents();
});

/**
 * 初始化页面
 * @param {string} carrierId - 承运商ID
 * @param {string} fileName - 文件名
 */
function initPage(carrierId, fileName) {
    // 设置页面标题
    const carrierTitle = document.getElementById('carrier-title');
    
    // 如果URL中有参数，使用参数；否则使用默认值
    if (carrierId && fileName) {
        carrierTitle.textContent = `${decodeURIComponent(carrierId)} | ${decodeURIComponent(fileName)}`;
        document.title = `${decodeURIComponent(carrierId)} - Transaction Details`;
    } else {
        // 默认标题
        carrierTitle.textContent = 'US ABC Company | January Statement';
        document.title = 'US ABC Company - Transaction Details';
    }
}

/**
 * 初始化月份选择器
 */
function initMonthSelector() {
    const monthSelector = document.getElementById('monthSelector');
    const monthDropdown = document.getElementById('monthDropdown');
    const monthItems = document.querySelectorAll('.month-item');
    const currentMonthDisplay = document.getElementById('currentMonth');
    
    // 点击月份选择器显示/隐藏下拉菜单
    monthSelector.addEventListener('click', function(e) {
        e.stopPropagation();
        monthDropdown.style.display = monthDropdown.style.display === 'block' ? 'none' : 'block';
    });
    
    // 点击页面其他区域关闭下拉菜单
    document.addEventListener('click', function() {
        monthDropdown.style.display = 'none';
    });
    
    // 点击月份项选择月份
    monthItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // 移除其他月份的选中状态
            monthItems.forEach(mi => mi.classList.remove('selected'));
            
            // 添加当前月份的选中状态
            this.classList.add('selected');
            
            // 更新显示的月份
            const month = this.getAttribute('data-month');
            const year = this.getAttribute('data-year');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            currentMonthDisplay.textContent = `${monthNames[month - 1]} ${year}`;
            
            // 关闭下拉菜单
            monthDropdown.style.display = 'none';
            
            // 显示通知
            showNotification(`Viewing data for ${monthNames[month - 1]} ${year}`, 'info');
        });
    });
}

/**
 * 初始化表格排序功能
 */
function initTableSort() {
    const sortableHeaders = document.querySelectorAll('th.sortable');
    
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortBy = this.getAttribute('data-sort');
            const currentDirection = this.getAttribute('data-direction') || 'none';
            
            // 重置所有表头的排序方向
            sortableHeaders.forEach(h => {
                h.setAttribute('data-direction', 'none');
                h.querySelector('i').className = 'fas fa-sort';
            });
            
            let newDirection = 'asc';
            
            if (currentDirection === 'none' || currentDirection === 'desc') {
                newDirection = 'asc';
                this.querySelector('i').className = 'fas fa-sort-up';
            } else {
                newDirection = 'desc';
                this.querySelector('i').className = 'fas fa-sort-down';
            }
            
            this.setAttribute('data-direction', newDirection);
            
            // 排序数据
            sortTransactionData(sortBy, newDirection);
            
            // 重置为第一页
            window.currentPage = 1;
            
            // 重新显示数据
            displayTransactionData();
        });
    });
}

/**
 * 排序交易数据
 * @param {string} sortBy - 排序字段
 * @param {string} direction - 排序方向 (asc/desc)
 */
function sortTransactionData(sortBy, direction) {
    window.transactionData.sort((a, b) => {
        let valueA, valueB;
        
        // 根据字段类型获取值
        if (sortBy === 'premium' || sortBy === 'commission') {
            valueA = parseFloat(a[sortBy].replace(/[$,]/g, ''));
            valueB = parseFloat(b[sortBy].replace(/[$,]/g, ''));
        } else if (sortBy === 'effective-date' || sortBy === 'transaction-date') {
            // 将日期字符串转换为日期对象进行比较
            const [monthA, dayA, yearA] = a[sortBy === 'effective-date' ? 'effectiveDate' : 'transactionDate'].split('/');
            const [monthB, dayB, yearB] = b[sortBy === 'effective-date' ? 'effectiveDate' : 'transactionDate'].split('/');
            
            valueA = new Date(yearA, monthA - 1, dayA);
            valueB = new Date(yearB, monthB - 1, dayB);
        } else {
            valueA = a[sortBy];
            valueB = b[sortBy];
        }
        
        // 比较值
        if (valueA < valueB) {
            return direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

/**
 * 初始化分页功能
 */
function initPagination() {
    // 设置初始页码和每页行数
    window.currentPage = 1;
    window.rowsPerPage = 25;
    
    // 获取分页元素
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const rowsPerPageSelect = document.getElementById('rows-per-page');
    
    // 上一页按钮点击事件
    prevPageBtn.addEventListener('click', function() {
        if (window.currentPage > 1) {
            window.currentPage--;
            displayTransactionData();
        }
    });
    
    // 下一页按钮点击事件
    nextPageBtn.addEventListener('click', function() {
        const totalPages = Math.ceil(window.transactionData.length / window.rowsPerPage);
        if (window.currentPage < totalPages) {
            window.currentPage++;
            displayTransactionData();
        }
    });
    
    // 每页行数选择事件
    rowsPerPageSelect.addEventListener('change', function() {
        window.rowsPerPage = parseInt(this.value);
        window.currentPage = 1; // 重置为第一页
        displayTransactionData();
    });
}

/**
 * 显示交易数据
 */
function displayTransactionData() {
    const tableBody = document.getElementById('transactionTableBody');
    const tableHeader = document.querySelector('#transaction-table thead tr');
    const tableTotals = document.getElementById('table-totals');
    
    // 清空表格内容
    tableBody.innerHTML = '';
    tableHeader.innerHTML = '';
    if (tableTotals) {
        tableTotals.innerHTML = '';
    }
    
    if (!window.transactionData || window.transactionData.length === 0) {
        updatePaginationInfo();
        return;
    }
    
    // 获取当前页的数据
    const startIndex = (window.currentPage - 1) * window.rowsPerPage;
    const endIndex = Math.min(startIndex + window.rowsPerPage, window.transactionData.length);
    const currentPageData = window.transactionData.slice(startIndex, endIndex);
    
    // 获取可见列
    const visibleColumns = getVisibleColumns();
    
    // 创建表头
    visibleColumns.forEach(column => {
        const th = document.createElement('th');
        if (column === 'customer') {
            th.innerHTML = 'Customer <i class="fas fa-sort"></i>';
            th.classList.add('sortable');
            th.dataset.sort = 'customer';
        } else if (column === 'policy') {
            th.innerHTML = '<i class="fas fa-check-circle policy-check"></i> Policy <i class="fas fa-sort"></i>';
            th.classList.add('sortable');
            th.dataset.sort = 'policy';
        } else if (column === 'effective-date') {
            th.innerHTML = 'Effective Date <i class="fas fa-sort"></i>';
            th.classList.add('sortable');
            th.dataset.sort = 'effective-date';
        } else if (column === 'transaction-date') {
            th.innerHTML = 'Transaction Date <i class="fas fa-sort"></i>';
            th.classList.add('sortable');
            th.dataset.sort = 'transaction-date';
        } else if (column === 'lob') {
            th.innerHTML = 'LOB <i class="fas fa-sort"></i>';
            th.classList.add('sortable');
            th.dataset.sort = 'lob';
        } else if (column === 'premium') {
            th.innerHTML = 'Premium <i class="fas fa-sort"></i>';
            th.classList.add('sortable');
            th.dataset.sort = 'premium';
        } else if (column === 'commission') {
            th.innerHTML = 'Commission <i class="fas fa-sort"></i>';
            th.classList.add('sortable');
            th.dataset.sort = 'commission';
        } else if (column === 'actions') {
            th.textContent = 'Actions';
        }
        tableHeader.appendChild(th);
    });
    
    // 创建表格行
    currentPageData.forEach(item => {
        const row = document.createElement('tr');
        row.classList.add('table-row');
        row.dataset.id = item.id;
        
        // 根据状态添加类
        if (item.status === 'matched') {
            row.classList.add('matched-row');
        } else {
            row.classList.add('unmatched-row');
        }
        
        // 添加单元格
        for (const column of visibleColumns) {
            const cell = document.createElement('td');
            
            if (column === 'customer') {
                cell.textContent = item.customer;
            } else if (column === 'policy') {
                if (item.status === 'matched') {
                    cell.innerHTML = `<i class="fas fa-check-circle policy-check"></i>${item.policy}`;
                } else {
                    cell.innerHTML = `<i class="fas fa-exclamation-circle policy-unmatched"></i>${item.policy}`;
                }
            } else if (column === 'effective-date') {
                cell.textContent = item.effectiveDate;
            } else if (column === 'transaction-date') {
                cell.textContent = item.transactionDate;
            } else if (column === 'lob') {
                cell.textContent = item.lob;
            } else if (column === 'premium') {
                cell.textContent = item.premium;
                cell.classList.add('numeric');
            } else if (column === 'commission') {
                cell.textContent = item.commission;
                cell.classList.add('numeric');
            } else if (column === 'actions') {
                cell.classList.add('actions-cell');
                cell.innerHTML = `
                <div class="action-menu">
                    <div class="action-dots">
                        <i class="fas fa-ellipsis-v"></i>
                    </div>
                    <div class="action-dropdown">
                        <div class="action-item" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                            <span>Delete item</span>
                        </div>
                    </div>
                </div>
                `;
            }
            
            row.appendChild(cell);
        }
        
        // 添加行点击事件
        row.addEventListener('click', function(e) {
            // 如果点击的是操作菜单，不触发行点击事件
            if (e.target.closest('.action-menu')) {
                return;
            }
            
            console.log('行被点击');
            
            // 移除其他行的高亮
            document.querySelectorAll('.table-row').forEach(r => r.classList.remove('highlight'));
            
            // 添加当前行高亮
            this.classList.add('highlight');
            
            // 获取当前行的数据
            const rowId = parseInt(this.dataset.id);
            console.log('行ID:', rowId);
            
            const rowData = window.transactionData.find(item => item.id === rowId);
            
            if (rowData) {
                console.log('找到行数据:', rowData);
                
                // 检查匹配面板是否存在
                const matchingPanel = document.getElementById('matchingPanel');
                console.log('匹配面板元素:', matchingPanel);
                
                // 打开匹配面板并填充数据
                openMatchingPanel(rowData);
            } else {
                console.error('未找到行数据');
            }
        });
        
        tableBody.appendChild(row);
    });
    
    // 创建总计行
    if (tableTotals) {
        // 计算总计值
        let totalPremium = 0;
        let totalCommission = 0;
        
        window.transactionData.forEach(item => {
            totalPremium += parseFloat(item.premium.replace(/[$,]/g, ''));
            totalCommission += parseFloat(item.commission.replace(/[$,]/g, ''));
        });
        
        // 添加总计单元格
        let colSpanBefore = 0;
        let hasPremium = false;
        let hasCommission = false;
        
        // 计算Premium前面的列数
        visibleColumns.forEach(column => {
            if (column === 'premium') {
                hasPremium = true;
            } else if (column === 'commission') {
                hasCommission = true;
            } else if (!hasPremium) {
                colSpanBefore++;
            }
        });
        
        // 如果有Premium或Commission列，添加总计行
        if (hasPremium || hasCommission) {
            // 添加总计标签
            const labelCell = document.createElement('td');
            labelCell.colSpan = colSpanBefore;
            labelCell.classList.add('total-label');
            labelCell.textContent = 'Total:';
            tableTotals.appendChild(labelCell);
            
            // 添加Premium总计
            if (hasPremium) {
                const premiumCell = document.createElement('td');
                premiumCell.classList.add('numeric');
                premiumCell.textContent = formatCurrency(totalPremium);
                tableTotals.appendChild(premiumCell);
            }
            
            // 添加Commission总计
            if (hasCommission) {
                const commissionCell = document.createElement('td');
                commissionCell.classList.add('numeric');
                commissionCell.textContent = formatCurrency(totalCommission);
                tableTotals.appendChild(commissionCell);
            }
            
            // 如果有Actions列，添加空单元格
            if (visibleColumns.includes('actions')) {
                const actionsCell = document.createElement('td');
                tableTotals.appendChild(actionsCell);
            }
        }
    }
    
    // 更新分页信息
    updatePaginationInfo();
    
    // 添加操作点击事件
    const actionDots = document.querySelectorAll('.action-dots');
    actionDots.forEach(dots => {
        dots.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // 关闭其他菜单
            document.querySelectorAll('.action-menu').forEach(menu => {
                menu.classList.remove('active');
            });
            
            // 切换当前菜单
            const menu = this.closest('.action-menu');
            menu.classList.toggle('active');
        });
    });
    
    // 删除操作点击事件
    const actionItems = document.querySelectorAll('.action-item');
    actionItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const id = this.dataset.id;
            
            // 显示确认对话框
            if (confirm('Are you sure you want to delete this item?')) {
                // 从数据中删除
                window.transactionData = window.transactionData.filter(item => item.id != id);
                
                // 更新统计信息
                updateStatistics();
                
                // 重新显示表格
                displayTransactionData();
                
                // 显示成功消息
                showNotification('Item deleted successfully', 'success');
            }
        });
    });
    
    // 重新初始化表格排序
    initTableSort();
    
    // 初始化新增条目按钮
    initAddEntriesButton();
}

/**
 * 更新分页信息和按钮状态
 */
function updatePaginationInfo() {
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    // 计算总页数
    const totalPages = Math.ceil(window.transactionData.length / window.rowsPerPage);
    
    // 确保当前页不超过总页数
    if (window.currentPage > totalPages) {
        window.currentPage = totalPages;
    }
    
    // 更新页码显示
    currentPageSpan.textContent = window.currentPage;
    totalPagesSpan.textContent = totalPages;
    
    // 更新按钮状态
    prevPageBtn.disabled = window.currentPage <= 1;
    nextPageBtn.disabled = window.currentPage >= totalPages;
}

/**
 * 获取当前可见的列
 * @returns {Array} 可见列的数组
 */
function getVisibleColumns() {
    const columns = [];
    
    // 使用class选择器获取所有列复选框
    const checkboxes = document.querySelectorAll('.column-checkbox');
    
    // 检查每个复选框的状态
    checkboxes.forEach(checkbox => {
        const columnId = checkbox.id;
        const columnName = columnId.replace('col-', '');
        
        if (checkbox.checked) {
            columns.push(columnName);
        }
    });
    
    // 如果没有选中任何列，默认显示所有列
    if (columns.length === 0) {
        return ['customer', 'policy', 'effective-date', 'transaction-date', 'lob', 'premium', 'commission', 'actions'];
    }
    
    return columns;
}

/**
 * 初始化筛选功能
 */
function initFilters() {
    const filterTags = document.querySelectorAll('.filter-tag');
    
    filterTags.forEach(tag => {
        tag.addEventListener('click', function() {
            this.classList.toggle('active');
            
            // 在实际应用中，这里应该打开筛选弹窗或应用筛选
            // 这里只是简单地切换active类
        });
    });
}

/**
 * 初始化列设置功能
 */
function initColumnSettings() {
    const settingsIcon = document.getElementById('settingsIcon');
    const modal = document.getElementById('column-settings-modal');
    const closeBtn = document.getElementById('close-column-settings');
    const applyBtn = document.getElementById('apply-column-settings');
    const resetBtn = document.getElementById('reset-column-settings');
    
    // 打开模态框
    settingsIcon.addEventListener('click', function() {
        modal.style.display = 'flex';
    });
    
    // 关闭模态框
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // 应用列设置
    applyBtn.addEventListener('click', function() {
        // 重新显示表格
        displayTransactionData();
        
        // 关闭模态框
        modal.style.display = 'none';
        
        // 显示通知
        showNotification('Column settings applied', 'success');
    });
    
    // 重置列设置
    resetBtn.addEventListener('click', function() {
        // 重置所有复选框
        document.querySelectorAll('.column-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });
        
        // 重新显示表格
        displayTransactionData();
        
        // 关闭模态框
        modal.style.display = 'none';
        
        // 显示通知
        showNotification('Column settings reset to default', 'success');
    });
}

/**
 * 初始化Post按钮
 */
function initPostButton() {
    const postBtn = document.getElementById('postBtn');
    
    postBtn.addEventListener('click', function() {
        // 显示确认对话框
        if (confirm('Are you sure you want to post these transactions?')) {
            // 显示加载中遮罩
            document.getElementById('loaderOverlay').style.display = 'flex';
            
            // 模拟处理延迟
            setTimeout(() => {
                // 隐藏加载中遮罩
                document.getElementById('loaderOverlay').style.display = 'none';
                
                // 显示成功通知
                showNotification('Transactions posted successfully', 'success');
            }, 1500);
        }
    });
}

/**
 * 加载交易数据
 */
function loadTransactionData() {
    // 显示加载中遮罩
    document.getElementById('loaderOverlay').style.display = 'flex';
    
    // 模拟数据加载延迟
    setTimeout(() => {
        // 生成示例数据
        window.transactionData = generateTransactionData();
        
        // 更新统计信息
        updateStatistics();
        
        // 显示数据
        displayTransactionData();
        
        // 隐藏加载中遮罩
        document.getElementById('loaderOverlay').style.display = 'none';
    }, 800);
}

/**
 * 生成固定的交易数据
 * @returns {Array} 交易数据数组
 */
function generateTransactionData() {
    // 使用固定的交易数据
    return [
        {
            id: 1,
            customer: 'Greenland Dig, Inc',
            policy: 'CK524125',
            effectiveDate: '3/5/2025',
            transactionDate: '3/23/2025',
            lob: 'Dental',
            premium: '$1,200.50',
            commission: '$120.05',
            status: 'matched'
        },
        {
            id: 2,
            customer: 'Bluewave Tech, LLC',
            policy: 'XR785412',
            effectiveDate: '3/10/2025',
            transactionDate: '3/28/2025',
            lob: 'Vision',
            premium: '$850.75',
            commission: '$127.61',
            status: 'matched'
        },
        {
            id: 3,
            customer: 'Quantum Solutions, Inc',
            policy: 'JQ614352',
            effectiveDate: '3/15/2025',
            transactionDate: '4/2/2025',
            lob: 'LTD',
            premium: '$2,300.00',
            commission: '$230.00',
            status: 'unmatched'
        },
        {
            id: 4,
            customer: 'Nova Enterprises',
            policy: 'PT235689',
            effectiveDate: '3/20/2025',
            transactionDate: '4/7/2025',
            lob: 'STD',
            premium: '$950.25',
            commission: '$142.54',
            status: 'matched'
        },
        {
            id: 5,
            customer: 'Stellar Systems, Inc',
            policy: 'NM894512',
            effectiveDate: '3/25/2025',
            transactionDate: '4/12/2025',
            lob: 'Life',
            premium: '$3,400.00',
            commission: '$510.00',
            status: 'matched'
        },
        {
            id: 6,
            customer: 'Apex Global Corp',
            policy: 'ZR543210',
            effectiveDate: '3/30/2025',
            transactionDate: '4/17/2025',
            lob: 'Accident',
            premium: '$1,150.99',
            commission: '$115.10',
            status: 'unmatched'
        },
        {
            id: 7,
            customer: 'Horizon Logistics, LLC',
            policy: 'DF782134',
            effectiveDate: '4/5/2025',
            transactionDate: '4/23/2025',
            lob: 'GL',
            premium: '$775.00',
            commission: '$116.25',
            status: 'matched'
        },
        {
            id: 8,
            customer: 'Titan Solutions, Inc',
            policy: 'CK489323',
            effectiveDate: '4/10/2025',
            transactionDate: '4/28/2025',
            lob: 'Property',
            premium: '$2,600.35',
            commission: '$260.04',
            status: 'matched'
        },
        {
            id: 9,
            customer: 'Velocity Dynamics, Inc',
            policy: 'ML972635',
            effectiveDate: '4/15/2025',
            transactionDate: '5/3/2025',
            lob: 'Business Auto',
            premium: '$1,120.40',
            commission: '$168.06',
            status: 'unmatched'
        },
        {
            id: 10,
            customer: 'Orion Holdings, Ltd',
            policy: 'BP346798',
            effectiveDate: '4/20/2025',
            transactionDate: '5/8/2025',
            lob: 'WC',
            premium: '$3,750.80',
            commission: '$562.62',
            status: 'matched'
        },
        {
            id: 11,
            customer: 'Hyperion Corp',
            policy: 'TR563247',
            effectiveDate: '4/25/2025',
            transactionDate: '5/13/2025',
            lob: 'Dental',
            premium: '$950.60',
            commission: '$142.59',
            status: 'matched'
        },
        {
            id: 12,
            customer: 'Vortex Industries, LLC',
            policy: 'PK896432',
            effectiveDate: '4/30/2025',
            transactionDate: '5/18/2025',
            lob: 'Vision',
            premium: '$890.75',
            commission: '$89.08',
            status: 'matched'
        },
        {
            id: 13,
            customer: 'Solarwave Tech, Inc',
            policy: 'GT123654',
            effectiveDate: '5/5/2025',
            transactionDate: '5/23/2025',
            lob: 'LTD',
            premium: '$2,150.20',
            commission: '$322.53',
            status: 'matched'
        },
        {
            id: 14,
            customer: 'Zenith Enterprises',
            policy: 'TX943215',
            effectiveDate: '5/10/2025',
            transactionDate: '5/28/2025',
            lob: 'STD',
            premium: '$1,025.55',
            commission: '$102.56',
            status: 'matched'
        },
        {
            id: 15,
            customer: 'Elevate Networks, Inc',
            policy: 'MQ746385',
            effectiveDate: '5/15/2025',
            transactionDate: '6/2/2025',
            lob: 'Life',
            premium: '$3,200.45',
            commission: '$480.07',
            status: 'unmatched'
        },
        {
            id: 16,
            customer: 'RedPeak Solutions, LLC',
            policy: 'NB365471',
            effectiveDate: '5/20/2025',
            transactionDate: '6/7/2025',
            lob: 'Accident',
            premium: '$1,280.00',
            commission: '$192.00',
            status: 'matched'
        },
        {
            id: 17,
            customer: 'Nova Security, Inc',
            policy: 'QP248963',
            effectiveDate: '5/25/2025',
            transactionDate: '6/12/2025',
            lob: 'GL',
            premium: '$825.90',
            commission: '$123.89',
            status: 'matched'
        },
        {
            id: 18,
            customer: 'Thunderbolt Energy, Inc',
            policy: 'KL986543',
            effectiveDate: '5/30/2025',
            transactionDate: '6/17/2025',
            lob: 'Property',
            premium: '$2,750.75',
            commission: '$275.08',
            status: 'unmatched'
        },
        {
            id: 19,
            customer: 'Ironclad Holdings, LLC',
            policy: 'YB741369',
            effectiveDate: '6/5/2025',
            transactionDate: '6/23/2025',
            lob: 'Business Auto',
            premium: '$1,050.25',
            commission: '$157.54',
            status: 'matched'
        },
        {
            id: 20,
            customer: 'Stellar Vision, Inc',
            policy: 'OM864231',
            effectiveDate: '6/10/2025',
            transactionDate: '6/28/2025',
            lob: 'WC',
            premium: '$3,600.00',
            commission: '$540.00',
            status: 'matched'
        },
        {
            id: 21,
            customer: 'Titan Edge, LLC',
            policy: 'XP258741',
            effectiveDate: '6/15/2025',
            transactionDate: '7/3/2025',
            lob: 'Dental',
            premium: '$1,175.45',
            commission: '$176.32',
            status: 'matched'
        },
        {
            id: 22,
            customer: 'Nimbus Robotics, Inc',
            policy: 'CF895321',
            effectiveDate: '6/20/2025',
            transactionDate: '7/8/2025',
            lob: 'Vision',
            premium: '$810.99',
            commission: '$81.10',
            status: 'unmatched'
        },
        {
            id: 23,
            customer: 'Greenstone Capital, LLC',
            policy: 'RM548932',
            effectiveDate: '6/25/2025',
            transactionDate: '7/13/2025',
            lob: 'LTD',
            premium: '$2,500.35',
            commission: '$375.05',
            status: 'matched'
        },
        {
            id: 24,
            customer: 'Stellar Marine, Inc',
            policy: 'PB264395',
            effectiveDate: '6/30/2025',
            transactionDate: '7/18/2025',
            lob: 'STD',
            premium: '$1,300.60',
            commission: '$195.09',
            status: 'matched'
        },
        {
            id: 25,
            customer: 'PrimeGenics, Inc',
            policy: 'TX375419',
            effectiveDate: '3/10/2025',
            transactionDate: '3/28/2025',
            lob: 'Life',
            premium: '$3,900.75',
            commission: '$585.11',
            status: 'matched'
        },
        {
            id: 26,
            customer: 'Lumos Energy, LLC',
            policy: 'KD468231',
            effectiveDate: '3/15/2025',
            transactionDate: '4/2/2025',
            lob: 'Accident',
            premium: '$1,100.25',
            commission: '$110.03',
            status: 'unmatched'
        },
        {
            id: 27,
            customer: 'Obsidian Tech, Inc',
            policy: 'BG972361',
            effectiveDate: '3/20/2025',
            transactionDate: '4/7/2025',
            lob: 'GL',
            premium: '$760.50',
            commission: '$114.08',
            status: 'matched'
        },
        {
            id: 28,
            customer: 'Pinnacle Data, Inc',
            policy: 'TY489321',
            effectiveDate: '3/25/2025',
            transactionDate: '4/12/2025',
            lob: 'Property',
            premium: '$2,450.10',
            commission: '$367.52',
            status: 'matched'
        },
        {
            id: 29,
            customer: 'Elevate Core, LLC',
            policy: 'QN159462',
            effectiveDate: '3/30/2025',
            transactionDate: '4/17/2025',
            lob: 'Business Auto',
            premium: '$1,075.75',
            commission: '$161.36',
            status: 'matched'
        },
        {
            id: 30,
            customer: 'AlphaShield, Inc',
            policy: 'YT349826',
            effectiveDate: '4/5/2025',
            transactionDate: '4/23/2025',
            lob: 'WC',
            premium: '$3,850.20',
            commission: '$577.53',
            status: 'unmatched'
        },
        {
            id: 31,
            customer: 'Stellar Connect, LLC',
            policy: 'KL785423',
            effectiveDate: '4/10/2025',
            transactionDate: '4/28/2025',
            lob: 'Dental',
            premium: '$1,225.60',
            commission: '$183.84',
            status: 'matched'
        },
        {
            id: 32,
            customer: 'Vega Robotics, Inc',
            policy: 'MX632154',
            effectiveDate: '4/15/2025',
            transactionDate: '5/3/2025',
            lob: 'Vision',
            premium: '$830.40',
            commission: '$83.04',
            status: 'matched'
        },
        {
            id: 33,
            customer: 'Quantum Matrix, Inc',
            policy: 'PZ861243',
            effectiveDate: '4/20/2025',
            transactionDate: '5/8/2025',
            lob: 'LTD',
            premium: '$2,300.80',
            commission: '$230.08',
            status: 'matched'
        },
        {
            id: 34,
            customer: 'Elevate Safety, LLC',
            policy: 'RM462871',
            effectiveDate: '4/25/2025',
            transactionDate: '5/13/2025',
            lob: 'STD',
            premium: '$1,150.50',
            commission: '$172.58',
            status: 'unmatched'
        },
        {
            id: 35,
            customer: 'Polaris Security, Inc',
            policy: 'TX694217',
            effectiveDate: '4/30/2025',
            transactionDate: '5/18/2025',
            lob: 'Life',
            premium: '$3,700.90',
            commission: '$555.14',
            status: 'matched'
        },
        {
            id: 36,
            customer: 'Stratos Consulting, LLC',
            policy: 'YN236985',
            effectiveDate: '5/5/2025',
            transactionDate: '5/23/2025',
            lob: 'Accident',
            premium: '$1,020.75',
            commission: '$153.11',
            status: 'matched'
        },
        {
            id: 37,
            customer: 'Infinitum Software, Inc',
            policy: 'MX496213',
            effectiveDate: '5/10/2025',
            transactionDate: '5/28/2025',
            lob: 'GL',
            premium: '$795.25',
            commission: '$79.53',
            status: 'matched'
        },
        {
            id: 38,
            customer: 'Innovate Core, LLC',
            policy: 'PL624987',
            effectiveDate: '5/15/2025',
            transactionDate: '6/2/2025',
            lob: 'Property',
            premium: '$2,600.55',
            commission: '$390.08',
            status: 'unmatched'
        }
    ];
}

/**
 * 更新统计信息
 */
function updateStatistics() {
    // 计算统计数据
    const totalTransactions = window.transactionData.length;
    const matchedTransactions = window.transactionData.filter(item => item.status === 'matched').length;
    const unmatchedTransactions = totalTransactions - matchedTransactions;
    
    let totalPremium = 0;
    let totalCommission = 0;
    
    window.transactionData.forEach(item => {
        totalPremium += parseFloat(item.premium.replace(/[$,]/g, ''));
        totalCommission += parseFloat(item.commission.replace(/[$,]/g, ''));
    });
    
    // 更新DOM元素
    document.getElementById('total-transactions').textContent = totalTransactions;
    document.getElementById('matched-transactions').textContent = matchedTransactions;
    document.getElementById('unmatched-count').textContent = `${unmatchedTransactions} Unmatched`;
    document.getElementById('total-premium').textContent = formatCurrency(totalPremium);
    document.getElementById('total-commission').textContent = formatCurrency(totalCommission);
    
    console.log('统计信息已更新:', {
        totalTransactions,
        matchedTransactions,
        unmatchedTransactions,
        totalPremium: formatCurrency(totalPremium),
        totalCommission: formatCurrency(totalCommission)
    });
}

/**
 * 格式化货币值
 * @param {number|string} value - 要格式化的值
 * @returns {string} 格式化后的货币字符串
 */
function formatCurrency(value) {
    // 如果已经是格式化的字符串，直接返回
    if (typeof value === 'string' && value.startsWith('$')) {
        return value;
    }
    
    // 转换为数字
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[$,]/g, '')) : value;
    
    // 格式化为货币
    return '$' + numValue.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

/**
 * 显示通知消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 (success, error, info, warning)
 */
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // 设置图标
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    // 设置内容
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 自动关闭
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * 初始化Edit Mode按钮
 */
function initEditModeButton() {
    const editModeBtn = document.getElementById('editModeBtn');
    
    editModeBtn.addEventListener('change', function() {
        // 切换编辑模式
        document.body.classList.toggle('edit-mode', this.checked);
        
        // 显示通知
        if (this.checked) {
            showNotification('Edit mode enabled. You can now modify transaction data.', 'info');
        } else {
            showNotification('Edit mode disabled.', 'info');
        }
    });
}

/**
 * 初始化新增条目按钮
 */
function initAddEntriesButton() {
    const addEntriesBtn = document.getElementById('addEntriesBtn');
    if (!addEntriesBtn) return;
    
    addEntriesBtn.addEventListener('click', function() {
        // 显示通知
        showNotification('Add new entries functionality will be implemented in the next version.', 'info');
        
        // 在实际应用中，这里应该打开一个新增条目的表单或弹窗
        console.log('Add new entries button clicked');
    });
}

/**
 * 打开匹配面板并填充数据
 * @param {Object} rowData - 行数据
 */
function openMatchingPanel(rowData) {
    console.log('打开匹配面板，数据:', rowData);
    
    const matchingPanel = document.getElementById('matchingPanel');
    console.log('匹配面板元素:', matchingPanel);
    
    if (!matchingPanel) {
        console.error('未找到匹配面板元素');
        return;
    }
    
    try {
        // 获取当前页面顶部显示的 Carrier 信息
        const carrierTitle = document.getElementById('carrier-title');
        let carrierName = 'US ABC Company';
        
        if (carrierTitle) {
            const titleText = carrierTitle.textContent;
            const carrierPart = titleText.split('|')[0].trim();
            if (carrierPart) {
                carrierName = carrierPart;
                console.log('从页面标题获取的 Carrier 名称:', carrierName);
            }
        }
        
        // 填充匹配面板的顶部信息
        const customerNameEl = document.getElementById('matchingCustomerName');
        const policyNumberEl = document.getElementById('matchingPolicyNumber');
        const uploadedDateEl = document.getElementById('matchingUploadedDate');
        const matchedPolicyNumberEl = document.getElementById('matchedPolicyNumber');
        
        console.log('顶部信息元素:', customerNameEl, policyNumberEl, uploadedDateEl);
        
        if (customerNameEl) customerNameEl.textContent = rowData.customer;
        if (policyNumberEl) policyNumberEl.textContent = rowData.policy;
        if (uploadedDateEl) uploadedDateEl.textContent = formatDateForDisplay(rowData.effectiveDate);
        if (matchedPolicyNumberEl && matchedPolicyNumberEl.querySelector) {
            const span = matchedPolicyNumberEl.querySelector('span');
            if (span) span.textContent = rowData.policy;
        }
        
        // 填充匹配状态
        const statusBadge = document.getElementById('matchingStatus');
        if (statusBadge) {
            statusBadge.className = `status-badge ${rowData.status}`;
            statusBadge.innerHTML = rowData.status === 'matched' 
                ? '<i class="fas fa-check-circle"></i><span>Matched</span>'
                : '<i class="fas fa-times-circle"></i><span>Unmatched</span>';
        }
        
        // 安全地设置元素内容的辅助函数
        function safeSetContent(id, content) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = content || '';
                console.log(`更新 ${id}:`, content);
            } else {
                console.warn(`未找到元素: ${id}`);
            }
        }
        
        // 安全地设置元素标签的辅助函数
        function safeSetLabel(selector, label) {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = label;
                console.log(`更新标签 ${selector}:`, label);
            } else {
                console.warn(`未找到标签元素: ${selector}`);
            }
        }
        
        // 直接设置 AMS Match 和 Statement Data 的标签
        // AMS Match 标签
        const amsLabels = document.querySelectorAll('.comparison-column:first-child .field-label');
        if (amsLabels.length >= 7) {
            amsLabels[0].textContent = 'Client Name';
            amsLabels[1].textContent = 'Client Code';
            amsLabels[2].textContent = 'Policy Number';
            amsLabels[3].textContent = 'Effective Date';
            amsLabels[4].textContent = 'Expiration Date';
            amsLabels[5].textContent = 'Line of Business';
            amsLabels[6].textContent = 'Carrier';
            console.log('已更新 AMS Match 标签');
        } else {
            console.warn('未找到足够的 AMS Match 标签元素');
        }
        
        // Statement Data 标签
        const statementLabels = document.querySelectorAll('.comparison-column:last-child .field-label');
        if (statementLabels.length >= 6) {
            statementLabels[0].textContent = 'Client Name';
            statementLabels[1].textContent = 'Policy Number';
            statementLabels[2].textContent = 'Effective Date';
            statementLabels[3].textContent = 'Expiration Date';
            statementLabels[4].textContent = 'Line of Business';
            statementLabels[5].textContent = 'Carrier name';
            console.log('已更新 Statement Data 标签');
        } else {
            console.warn('未找到足够的 Statement Data 标签元素');
        }
        
        // 计算到期日期（有效日期加一年）
        const expirationDate = calculateExpirationDate(rowData.effectiveDate);
        
        // 填充 Statement Data 部分
        safeSetContent('statementClientName', rowData.customer);
        safeSetContent('statementPolicyNumber', rowData.policy);
        safeSetContent('statementPolicyEffectiveDate', rowData.effectiveDate);
        safeSetContent('statementPolicyExpirationDate', expirationDate);
        safeSetContent('statementLOB', rowData.lob);
        safeSetContent('statementCarrier', carrierName);
        
        // 填充 AMS Match 部分
        safeSetContent('amsClientName', rowData.customer);
        safeSetContent('amsClientCode', generateClientCode(rowData.customer));
        safeSetContent('amsPolicyNumber', rowData.policy);
        safeSetContent('amsPolicyEffectiveDate', rowData.effectiveDate);
        safeSetContent('amsPolicyExpirationDate', expirationDate);
        safeSetContent('amsCoverageCode', generateCoverageCode(rowData.lob));
        safeSetContent('amsCarrier', carrierName);
        
        // 初始化选项卡功能
        initTabs();
        
        // 添加同步按钮点击事件
        const syncButton = document.querySelector('.btn-sync');
        if (syncButton) {
            syncButton.onclick = function() {
                console.log('同步按钮被点击');
                showNotification('Syncing with AMS...', 'info');
                
                // 模拟同步延迟
                setTimeout(() => {
                    showNotification('Successfully synced with AMS', 'success');
                }, 1500);
            };
        }
        
        // 显示匹配面板
        matchingPanel.style.display = 'block';
        setTimeout(() => {
            matchingPanel.classList.add('open');
        }, 10);
        
        // 保存当前行数据到面板
        matchingPanel.dataset.rowId = rowData.id;
        matchingPanel.dataset.carrierName = carrierName; // 保存 Carrier 名称
        
        // 添加关闭按钮事件
        const closeBtn = document.getElementById('closeMatchingPanel');
        console.log('关闭按钮元素:', closeBtn);
        
        if (closeBtn) {
            // 使用onclick，避免事件监听器问题
            closeBtn.onclick = function() {
                closeMatchingPanel();
            };
        }
        
        // 添加确认匹配按钮事件
        const confirmMatchBtn = document.getElementById('confirmMatchBtn');
        console.log('确认按钮元素:', confirmMatchBtn);
        
        if (confirmMatchBtn) {
            // 使用onclick，避免事件监听器问题
            confirmMatchBtn.onclick = function() {
                console.log('确认匹配按钮被点击');
                updateMatchStatus(rowData.id, 'matched');
                
                // 更新匹配面板上的状态
                const statusBadge = document.getElementById('matchingStatus');
                if (statusBadge) {
                    statusBadge.className = 'status-badge matched';
                    statusBadge.innerHTML = '<i class="fas fa-check-circle"></i><span>Matched</span>';
                }
                
                // 显示成功消息
                showNotification('Transaction matched successfully', 'success');
                
                // 不关闭匹配面板
            };
        }
        
        // 添加 Unmatch 链接事件
        const unmatchLink = document.getElementById('unmatchLink');
        console.log('Unmatch链接元素:', unmatchLink);
        
        if (unmatchLink) {
            unmatchLink.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Unmatch链接被点击');
                
                // 显示取消匹配确认弹窗
                showUnmatchConfirmation(rowData);
                
                return false;
            };
        }
        
        // 添加 Unmatch 按钮事件
        const unmatchBtn = document.getElementById('unmatchBtn');
        console.log('取消匹配按钮元素:', unmatchBtn);
        
        if (unmatchBtn) {
            unmatchBtn.onclick = function() {
                console.log('取消匹配按钮被点击');
                
                // 直接更新状态为 unmatched
                updateMatchStatus(rowData.id, 'unmatched');
                
                // 更新匹配面板上的状态
                const statusBadge = document.getElementById('matchingStatus');
                if (statusBadge) {
                    statusBadge.className = 'status-badge unmatched';
                    statusBadge.innerHTML = '<i class="fas fa-times-circle"></i><span>Unmatched</span>';
                }
                
                // 显示成功消息
                showNotification('Transaction unmatched', 'info');
                
                // 不关闭匹配面板
            };
        }
        
        // 添加点击外部关闭面板
        document.addEventListener('click', function closeOnOutsideClick(e) {
            if (!matchingPanel.contains(e.target) && matchingPanel.classList.contains('open') && !e.target.closest('.table-row')) {
                closeMatchingPanel();
                document.removeEventListener('click', closeOnOutsideClick);
            }
        });
    } catch (error) {
        console.error('打开匹配面板时出错:', error);
    }
}

/**
 * 更新匹配状态
 * @param {number} id - 行ID
 * @param {string} status - 新状态 ('matched' 或 'unmatched')
 */
function updateMatchStatus(id, status) {
    console.log(`更新匹配状态: ID=${id}, 新状态=${status}`);
    
    // 更新数据状态
    const index = window.transactionData.findIndex(item => item.id === id);
    console.log(`找到数据索引: ${index}`);
    
    if (index !== -1) {
        const oldStatus = window.transactionData[index].status;
        console.log(`当前状态: ${oldStatus}, 新状态: ${status}`);
        
        // 更新状态
        window.transactionData[index].status = status;
        
        // 更新统计信息
        updateStatistics();
        
        // 重新显示表格
        displayTransactionData();
        
        // 高亮当前行
        const rows = document.querySelectorAll('.table-row');
        rows.forEach(row => {
            if (parseInt(row.dataset.id) === id) {
                row.classList.add('highlight');
            } else {
                row.classList.remove('highlight');
            }
        });
    } else {
        console.error(`未找到ID为 ${id} 的数据`);
    }
}

/**
 * 初始化选项卡功能
 */
function initTabs() {
    console.log('初始化选项卡功能');
    
    const tabs = document.querySelectorAll('.data-comparison-tabs .tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const dataComparisonDescription = document.querySelector('.data-comparison-description');
    
    if (!tabs.length || !tabPanes.length) {
        console.error('未找到选项卡元素');
        return;
    }
    
    console.log('找到选项卡元素:', tabs.length, '个选项卡,', tabPanes.length, '个内容面板');
    
    // 默认激活第一个选项卡
    tabs[0].classList.add('active');
    tabPanes[0].classList.add('active');
    
    if (dataComparisonDescription) {
        dataComparisonDescription.style.display = 'block';
    }
    
    // 为每个选项卡添加点击事件
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            console.log('选项卡被点击:', this.getAttribute('data-tab'));
            
            // 移除所有选项卡的活动状态
            tabs.forEach(t => t.classList.remove('active'));
            
            // 添加当前选项卡的活动状态
            this.classList.add('active');
            
            // 获取目标选项卡内容
            const target = this.getAttribute('data-tab');
            
            // 隐藏所有选项卡内容
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // 显示目标选项卡内容
            const targetPane = document.getElementById(`${target}-tab`);
            if (targetPane) {
                targetPane.classList.add('active');
                console.log('显示选项卡内容:', target);
            } else {
                console.error('未找到目标选项卡内容:', target);
            }
            
            // 控制Data Comparison说明的显示/隐藏
            if (dataComparisonDescription) {
                if (target === 'data-comparison') {
                    dataComparisonDescription.style.display = 'block';
                } else {
                    dataComparisonDescription.style.display = 'none';
                }
            }
        });
    });
}

/**
 * 关闭匹配面板
 */
function closeMatchingPanel() {
    console.log('关闭匹配面板');
    const matchingPanel = document.getElementById('matchingPanel');
    if (matchingPanel) {
        console.log('找到匹配面板，移除open类');
        matchingPanel.classList.remove('open');
        
        // 添加延迟，等待过渡动画完成后隐藏面板
        setTimeout(() => {
            matchingPanel.style.display = 'none';
            console.log('匹配面板已隐藏');
        }, 300);
    } else {
        console.error('未找到匹配面板元素');
    }
}

/**
 * 格式化日期为显示格式
 * @param {string} dateStr - 日期字符串 (M/D/YYYY)
 * @returns {string} 格式化后的日期 (MMM D, YYYY)
 */
function formatDateForDisplay(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    const year = parts[2];
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${monthNames[month - 1]} ${day}, ${year}`;
}

/**
 * 根据客户名称生成客户代码
 * @param {string} customerName - 客户名称
 * @returns {string} 客户代码
 */
function generateClientCode(customerName) {
    if (!customerName) return '';
    
    // 提取首字母并转为大写
    const words = customerName.split(' ');
    let code = '';
    
    // 获取每个单词的首字母
    words.forEach(word => {
        if (word.length > 0) {
            code += word[0].toUpperCase();
        }
    });
    
    // 添加随机数字
    code += '-' + Math.floor(1000 + Math.random() * 9000);
    
    return code;
}

/**
 * 计算到期日期（有效日期加一年）
 * @param {string} effectiveDateStr - 有效日期字符串 (M/D/YYYY)
 * @returns {string} 到期日期字符串 (M/D/YYYY)
 */
function calculateExpirationDate(effectiveDateStr) {
    const parts = effectiveDateStr.split('/');
    if (parts.length !== 3) return effectiveDateStr;
    
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    // 创建日期对象并加一年
    const effectiveDate = new Date(year, month - 1, day);
    const expirationDate = new Date(effectiveDate);
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    
    // 格式化为 M/D/YYYY
    return `${expirationDate.getMonth() + 1}/${expirationDate.getDate()}/${expirationDate.getFullYear()}`;
}

/**
 * 根据LOB生成覆盖代码
 * @param {string} lob - LOB值
 * @returns {string} 覆盖代码
 */
function generateCoverageCode(lob) {
    if (!lob) return '';
    
    // 提取前三个字母并转为大写
    const prefix = lob.substring(0, 3).toUpperCase();
    
    // 添加随机数字
    return prefix + '-' + Math.floor(10 + Math.random() * 90);
}

/**
 * 初始化侧边栏点击事件
 */
function initSidebarEvents() {
    const sidebarItems = document.querySelectorAll('.sidebar-item:not(.active)');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            const itemName = this.querySelector('span').textContent;
            if (itemName === 'Dashboard') {
                window.location.href = 'dashboard.html';
            } else if (itemName === 'Statement') {
                window.location.href = 'db_platform_prototype.html';
            } else if (itemName === 'Reporting') {
                window.location.href = 'reporting.html';
            } else if (itemName === 'Admin') {
                window.location.href = 'admin.html';
            }
        });
    });
}

/**
 * 显示取消匹配确认弹窗
 * @param {Object} rowData - 行数据
 */
function showUnmatchConfirmation(rowData) {
    console.log('显示取消匹配确认弹窗，数据:', rowData);
    
    // 获取弹窗元素
    const unmatchModal = document.getElementById('unmatchModal');
    if (!unmatchModal) {
        console.error('未找到 unmatchModal 元素');
        return;
    }
    
    try {
        // 直接从 matching details 页面的 DOM 元素中获取数据
        const clientName = document.getElementById('statementClientName')?.textContent || '';
        const policyNumber = document.getElementById('statementPolicyNumber')?.textContent || '';
        const effectiveDate = document.getElementById('statementPolicyEffectiveDate')?.textContent || '';
        const expirationDate = document.getElementById('statementPolicyExpirationDate')?.textContent || '';
        const lob = document.getElementById('statementLOB')?.textContent || '';
        const carrier = document.getElementById('statementCarrier')?.textContent || '';
        
        console.log('从 matching details 获取的数据:');
        console.log('Client Name:', clientName);
        console.log('Policy Number:', policyNumber);
        console.log('Effective Date:', effectiveDate);
        console.log('Expiration Date:', expirationDate);
        console.log('LOB:', lob);
        console.log('Carrier:', carrier);
        
        // 更新客户名称
        const customerNameEl = unmatchModal.querySelector('#customerName');
        if (customerNameEl) {
            customerNameEl.textContent = clientName;
            console.log('更新客户名称:', clientName);
        } else {
            console.error('未找到客户名称元素');
        }
        
        // 安全地设置元素内容的辅助函数
        function safeSetContent(selector, content) {
            const element = unmatchModal.querySelector(selector);
            if (element) {
                element.textContent = content || '';
                console.log(`更新 ${selector}:`, content);
            } else {
                console.warn(`未找到元素: ${selector}`);
            }
        }
        
        // 填充 Statement Data 部分 - 直接使用 matching details 中的数据
        console.log('填充 Statement Data 部分');
        safeSetContent('#statementClientName', clientName);
        safeSetContent('#statementPolicyNumber', policyNumber);
        safeSetContent('#statementEffectiveDate', effectiveDate);
        safeSetContent('#statementExpirationDate', expirationDate);
        safeSetContent('#statementLOB', lob);
        safeSetContent('#statementCarrier', carrier);
        
        // 填充 Suggested AMS Matches 部分 - 稍微修改内容
        console.log('填充 Suggested AMS Matches 部分');
        let modifiedPolicyNumber = '';
        
        if (policyNumber && policyNumber.length > 2) {
            modifiedPolicyNumber = policyNumber.substring(0, policyNumber.length - 2) + 
                                  Math.floor(Math.random() * 90 + 10); // 修改最后两位数字
        } else if (policyNumber) {
            modifiedPolicyNumber = policyNumber + Math.floor(Math.random() * 90 + 10);
        } else {
            modifiedPolicyNumber = "POL" + Math.floor(Math.random() * 900000 + 100000);
        }
        
        safeSetContent('#suggestedPolicyNumber', modifiedPolicyNumber);
        safeSetContent('#suggestedEffectiveDate', effectiveDate);
        safeSetContent('#suggestedExpirationDate', expirationDate);
        safeSetContent('#suggestedCarrier', carrier);
        
        // 初始化搜索框功能
        const searchInput = unmatchModal.querySelector('.search-input');
        if (searchInput) {
            searchInput.value = ''; // 清空搜索框
            
            // 移除之前的事件监听器
            searchInput.removeEventListener('input', searchHandler);
            searchInput.removeEventListener('keydown', keydownHandler);
            searchInput.removeEventListener('click', clickHandler);
            
            // 添加搜索事件
            searchInput.addEventListener('input', searchHandler);
            
            // 防止搜索框的回车键关闭弹窗
            searchInput.addEventListener('keydown', keydownHandler);
            
            // 防止点击搜索框关闭弹窗
            searchInput.addEventListener('click', clickHandler);
        }
        
        // 搜索处理函数
        function searchHandler(e) {
            // 阻止事件冒泡和默认行为
            e.stopPropagation();
            e.preventDefault();
            
            const searchTerm = this.value.toLowerCase();
            console.log('搜索匹配项:', searchTerm);
            
            // 这里可以添加实际的搜索逻辑
            // 例如，根据搜索词过滤匹配项
            
            // 重要：不要关闭弹窗
            return false;
        }
        
        // 键盘事件处理函数
        function keydownHandler(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }
        
        // 点击事件处理函数
        function clickHandler(e) {
            e.stopPropagation();
        }
        
        // 添加匹配项点击事件
        const matchItems = unmatchModal.querySelectorAll('.match-item');
        matchItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // 移除所有匹配项的选中状态
                matchItems.forEach(i => i.classList.remove('selected'));
                
                // 添加当前匹配项的选中状态
                this.classList.add('selected');
                
                console.log('选中匹配项:', this);
            });
        });
        
        // 设置确认按钮事件
        const confirmUnmatch = unmatchModal.querySelector('#confirmUnmatch');
        if (confirmUnmatch) {
            // 移除之前的事件监听器
            const newConfirmUnmatch = confirmUnmatch.cloneNode(true);
            confirmUnmatch.parentNode.replaceChild(newConfirmUnmatch, confirmUnmatch);
            
            // 添加新的事件监听器
            newConfirmUnmatch.addEventListener('click', function() {
                console.log('确认取消匹配按钮被点击');
                
                // 更新状态为 unmatched
                const rowId = parseInt(document.getElementById('matchingPanel')?.dataset?.rowId || '0');
                if (rowId) {
                    updateMatchStatus(rowId, 'unmatched');
                    
                    // 更新匹配面板上的状态
                    const statusBadge = document.getElementById('matchingStatus');
                    if (statusBadge) {
                        statusBadge.className = 'status-badge unmatched';
                        statusBadge.innerHTML = '<i class="fas fa-times-circle"></i><span>Unmatched</span>';
                    }
                    
                    // 关闭弹窗
                    closeUnmatchModal();
                    
                    // 显示成功消息
                    showNotification('Transaction has been unmatched successfully', 'success');
                } else {
                    console.error('无法获取行ID');
                    closeUnmatchModal();
                }
            });
        }
        
        // 设置取消按钮事件
        const cancelUnmatch = unmatchModal.querySelector('#cancelUnmatch');
        if (cancelUnmatch) {
            // 移除之前的事件监听器
            const newCancelUnmatch = cancelUnmatch.cloneNode(true);
            cancelUnmatch.parentNode.replaceChild(newCancelUnmatch, cancelUnmatch);
            
            // 添加新的事件监听器
            newCancelUnmatch.addEventListener('click', closeUnmatchModal);
        }
        
        // 设置关闭按钮事件
        const closeUnmatchModalBtn = unmatchModal.querySelector('#closeUnmatchModal');
        if (closeUnmatchModalBtn) {
            // 移除之前的事件监听器
            const newCloseUnmatchModal = closeUnmatchModalBtn.cloneNode(true);
            closeUnmatchModalBtn.parentNode.replaceChild(newCloseUnmatchModal, closeUnmatchModalBtn);
            
            // 添加新的事件监听器
            newCloseUnmatchModal.addEventListener('click', closeUnmatchModal);
        }
        
        // 添加拖拽功能
        const modalContent = unmatchModal.querySelector('.unmatch-modal-content');
        if (modalContent) {
            // 重置位置
            modalContent.style.top = '50%';
            modalContent.style.left = '50%';
            modalContent.style.transform = 'translate(-50%, -50%)';
            
            // 添加拖拽功能
            makeDraggable(modalContent);
        }
        
        // 显示弹窗
        unmatchModal.style.display = 'flex';
        setTimeout(() => {
            unmatchModal.classList.add('show');
            console.log('Unmatch 弹窗已显示');
        }, 10);
        
        // 点击弹窗外部关闭
        unmatchModal.addEventListener('click', function(event) {
            if (event.target === unmatchModal) {
                closeUnmatchModal();
            }
            
            // 阻止事件冒泡，防止关闭 matching details
            event.stopPropagation();
        });
        
        // 为确认窗口中的所有元素添加阻止事件冒泡的处理
        const allElements = unmatchModal.querySelectorAll('*');
        allElements.forEach(element => {
            element.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        });
    } catch (error) {
        console.error('显示取消匹配确认弹窗时出错:', error);
    }
    
    // 关闭弹窗的函数
    function closeUnmatchModal() {
        console.log('关闭 Unmatch 弹窗');
        if (unmatchModal) {
            unmatchModal.classList.remove('show');
            setTimeout(() => {
                unmatchModal.style.display = 'none';
            }, 300);
        }
    }
    
    // 使元素可拖拽的函数
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        // 获取拖拽的元素，默认为当前元素
        const header = element.querySelector('.unmatch-modal-header') || element;
        
        if (header) {
            header.onmousedown = dragMouseDown;
        }
        
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            e.stopPropagation(); // 阻止事件冒泡，防止关闭 matching details
            
            // 获取鼠标初始位置
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // 添加鼠标移动和释放事件
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
        
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            e.stopPropagation(); // 阻止事件冒泡，防止关闭 matching details
            
            // 计算新位置
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // 设置元素的新位置，但限制在视图范围内
            const newTop = element.offsetTop - pos2;
            const newLeft = element.offsetLeft - pos1;
            
            // 确保不会移出视图
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const elementHeight = element.offsetHeight;
            const elementWidth = element.offsetWidth;
            
            // 限制顶部位置
            if (newTop < 0) {
                element.style.top = '0px';
            } else if (newTop + elementHeight > viewportHeight) {
                element.style.top = (viewportHeight - elementHeight) + 'px';
            } else {
                element.style.top = newTop + 'px';
            }
            
            // 限制左侧位置
            if (newLeft < 0) {
                element.style.left = '0px';
            } else if (newLeft + elementWidth > viewportWidth) {
                element.style.left = (viewportWidth - elementWidth) + 'px';
            } else {
                element.style.left = newLeft + 'px';
            }
            
            // 移除 transform 属性，避免与拖拽冲突
            element.style.transform = 'none';
        }
        
        function closeDragElement(e) {
            if (e) {
                e.stopPropagation(); // 阻止事件冒泡，防止关闭 matching details
            }
            
            // 停止移动
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
} 