// 備品管理アプリケーション

// データストレージ
const STORAGE_KEY = 'inventory_items';

// 状態管理
let inventory = [];
let deleteTargetId = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
    renderInventory();
    updateSummary();
    setupEventListeners();
});

// イベントリスナーの設定
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', renderInventory);
    document.getElementById('categoryFilter').addEventListener('change', renderInventory);
    document.getElementById('stockFilter').addEventListener('change', renderInventory);

    // モーダル外クリックで閉じる
    document.getElementById('productModal').addEventListener('click', (e) => {
        if (e.target.id === 'productModal') closeModal();
    });
    document.getElementById('stockModal').addEventListener('click', (e) => {
        if (e.target.id === 'stockModal') closeStockModal();
    });
    document.getElementById('deleteModal').addEventListener('click', (e) => {
        if (e.target.id === 'deleteModal') closeDeleteModal();
    });

    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeStockModal();
            closeDeleteModal();
        }
    });
}

// LocalStorageからデータ読み込み
function loadInventory() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        inventory = JSON.parse(data);
    }
}

// LocalStorageにデータ保存
function saveInventory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
}

// 一意のIDを生成
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 在庫状態を判定
function getStockStatus(item) {
    if (item.quantity === 0) {
        return { status: 'out-of-stock', label: '在庫切れ' };
    } else if (item.quantity <= item.minStock) {
        return { status: 'low-stock', label: '要発注' };
    }
    return { status: 'in-stock', label: '在庫あり' };
}

// 金額フォーマット
function formatCurrency(amount) {
    return new Intl.NumberFormat('ja-JP').format(amount) + '円';
}

// カテゴリリストを更新
function updateCategoryList() {
    const categories = [...new Set(inventory.map(item => item.category))].filter(Boolean);

    // カテゴリフィルター更新
    const categoryFilter = document.getElementById('categoryFilter');
    const currentValue = categoryFilter.value;
    categoryFilter.innerHTML = '<option value="">全てのカテゴリ</option>';
    categories.forEach(cat => {
        categoryFilter.innerHTML += `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`;
    });
    categoryFilter.value = currentValue;

    // データリスト更新
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';
    categories.forEach(cat => {
        categoryList.innerHTML += `<option value="${escapeHtml(cat)}">`;
    });
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// サマリー更新
function updateSummary() {
    const totalItems = inventory.length;
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const outOfStock = inventory.filter(item => item.quantity === 0).length;
    const lowStock = inventory.filter(item => item.quantity > 0 && item.quantity <= item.minStock).length;

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalStock').textContent = totalStock;
    document.getElementById('outOfStock').textContent = outOfStock;
    document.getElementById('lowStock').textContent = lowStock;
}

// フィルタリング
function getFilteredInventory() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const stockFilter = document.getElementById('stockFilter').value;

    return inventory.filter(item => {
        // 検索フィルター
        const matchesSearch = !searchTerm ||
            item.name.toLowerCase().includes(searchTerm) ||
            item.sku.toLowerCase().includes(searchTerm);

        // カテゴリフィルター
        const matchesCategory = !categoryFilter || item.category === categoryFilter;

        // 在庫状態フィルター
        let matchesStock = true;
        if (stockFilter) {
            const status = getStockStatus(item).status;
            matchesStock = status === stockFilter;
        }

        return matchesSearch && matchesCategory && matchesStock;
    });
}

// 在庫一覧を描画
function renderInventory() {
    const tbody = document.getElementById('inventoryBody');
    const emptyState = document.getElementById('emptyState');
    const table = tbody.closest('table');
    const filteredItems = getFilteredInventory();

    updateCategoryList();

    if (filteredItems.length === 0) {
        table.classList.add('hidden');
        emptyState.classList.add('show');
        if (inventory.length === 0) {
            emptyState.querySelector('p').textContent = '備品がありません。「新規商品追加」ボタンから備品を追加してください。';
        } else {
            emptyState.querySelector('p').textContent = '条件に一致する備品がありません。';
        }
        return;
    }

    table.classList.remove('hidden');
    emptyState.classList.remove('show');

    tbody.innerHTML = filteredItems.map(item => {
        const stockStatus = getStockStatus(item);
        const orderLink = item.orderUrl
            ? `<a href="${escapeHtml(item.orderUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-order">注文する</a>`
            : '<span class="no-link">-</span>';

        return `
            <tr class="${stockStatus.status === 'out-of-stock' ? 'row-danger' : stockStatus.status === 'low-stock' ? 'row-warning' : ''}">
                <td><strong>${escapeHtml(item.sku)}</strong></td>
                <td>
                    <div class="product-name">${escapeHtml(item.name)}</div>
                    ${item.description ? `<div class="product-desc">${escapeHtml(item.description)}</div>` : ''}
                </td>
                <td>${escapeHtml(item.category)}</td>
                <td class="quantity-cell">
                    <span class="quantity-value">${item.quantity}</span>
                </td>
                <td class="min-stock-cell">${item.minStock}</td>
                <td>${formatCurrency(item.price)}</td>
                <td><span class="status-badge ${stockStatus.status}">${stockStatus.label}</span></td>
                <td>${orderLink}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-icon" onclick="openStockModal('${item.id}')" title="在庫調整">
                            +/-
                        </button>
                        <button class="btn btn-sm btn-icon" onclick="editProduct('${item.id}')" title="編集">
                            編集
                        </button>
                        <button class="btn btn-sm btn-icon btn-icon-danger" onclick="openDeleteModal('${item.id}')" title="削除">
                            削除
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// 商品追加モーダルを開く
function openModal() {
    document.getElementById('modalTitle').textContent = '新規備品追加';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('minStock').value = '5';
    document.getElementById('productModal').classList.add('show');
    document.getElementById('sku').focus();
}

// 商品編集
function editProduct(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    document.getElementById('modalTitle').textContent = '備品編集';
    document.getElementById('productId').value = item.id;
    document.getElementById('sku').value = item.sku;
    document.getElementById('name').value = item.name;
    document.getElementById('category').value = item.category;
    document.getElementById('quantity').value = item.quantity;
    document.getElementById('price').value = item.price;
    document.getElementById('minStock').value = item.minStock;
    document.getElementById('orderUrl').value = item.orderUrl || '';
    document.getElementById('description').value = item.description || '';

    document.getElementById('productModal').classList.add('show');
}

// モーダルを閉じる
function closeModal() {
    document.getElementById('productModal').classList.remove('show');
}

// 商品を保存
function saveProduct(event) {
    event.preventDefault();

    const id = document.getElementById('productId').value;
    const sku = document.getElementById('sku').value.trim();
    const name = document.getElementById('name').value.trim();
    const category = document.getElementById('category').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value, 10);
    const price = parseInt(document.getElementById('price').value, 10);
    const minStock = parseInt(document.getElementById('minStock').value, 10) || 5;
    const orderUrl = document.getElementById('orderUrl').value.trim();
    const description = document.getElementById('description').value.trim();

    // SKU重複チェック
    const existingSku = inventory.find(item => item.sku === sku && item.id !== id);
    if (existingSku) {
        alert('このSKU（商品コード）は既に使用されています。');
        return;
    }

    if (id) {
        // 更新
        const index = inventory.findIndex(item => item.id === id);
        if (index !== -1) {
            inventory[index] = {
                ...inventory[index],
                sku,
                name,
                category,
                quantity,
                price,
                minStock,
                orderUrl,
                description,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // 新規追加
        inventory.push({
            id: generateId(),
            sku,
            name,
            category,
            quantity,
            price,
            minStock,
            orderUrl,
            description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    saveInventory();
    renderInventory();
    updateSummary();
    closeModal();
}

// 在庫調整モーダルを開く
function openStockModal(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    document.getElementById('stockProductId').value = id;
    document.getElementById('stockProductName').textContent = item.name;
    document.getElementById('currentStock').textContent = item.quantity;
    document.getElementById('adjustAmount').value = 1;
    document.querySelector('input[name="adjustType"][value="add"]').checked = true;

    document.getElementById('stockModal').classList.add('show');
}

// 在庫調整モーダルを閉じる
function closeStockModal() {
    document.getElementById('stockModal').classList.remove('show');
}

// 在庫調整を適用
function adjustStock(event) {
    event.preventDefault();

    const id = document.getElementById('stockProductId').value;
    const adjustType = document.querySelector('input[name="adjustType"]:checked').value;
    const amount = parseInt(document.getElementById('adjustAmount').value, 10);

    const item = inventory.find(i => i.id === id);
    if (!item) return;

    switch (adjustType) {
        case 'add':
            item.quantity += amount;
            break;
        case 'subtract':
            item.quantity = Math.max(0, item.quantity - amount);
            break;
        case 'set':
            item.quantity = amount;
            break;
    }

    item.updatedAt = new Date().toISOString();

    saveInventory();
    renderInventory();
    updateSummary();
    closeStockModal();
}

// 削除確認モーダルを開く
function openDeleteModal(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    deleteTargetId = id;
    document.getElementById('deleteProductName').textContent = `${item.name} (${item.sku})`;
    document.getElementById('deleteModal').classList.add('show');
}

// 削除確認モーダルを閉じる
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
    deleteTargetId = null;
}

// 削除を実行
function confirmDelete() {
    if (!deleteTargetId) return;

    inventory = inventory.filter(item => item.id !== deleteTargetId);

    saveInventory();
    renderInventory();
    updateSummary();
    closeDeleteModal();
}
