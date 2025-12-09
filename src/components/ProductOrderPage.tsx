/**
 * 물품 신청 페이지 컴포넌트
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Product, ProductOrder, ProductCategory, ProductOption, ProductOptionValue } from '../types/types';
import { generateId } from '../utils/storage';
import { getProducts, saveProduct, deleteProduct, getProductOrders, saveProductOrder, deleteProductOrder } from '../utils/firestoreLectures';
import { ProductExcelImport } from './ProductExcelImport';

export const ProductOrderPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [myOrders, setMyOrders] = useState<ProductOrder[]>([]);
  const [allOrders, setAllOrders] = useState<ProductOrder[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [orderingProduct, setOrderingProduct] = useState<Product | null>(null);
  const [adminView, setAdminView] = useState<'orders' | 'products' | 'register'>('orders');

  // 물품 등록/수정 관련
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [registerCategory, setRegisterCategory] = useState<ProductCategory>('사료');
  const [registerName, setRegisterName] = useState('');
  const [registerStock, setRegisterStock] = useState('');
  const [registerOptions, setRegisterOptions] = useState<ProductOption[]>([]);
  const [registerDescription, setRegisterDescription] = useState('');
  const [registerImage, setRegisterImage] = useState('');
  const [showExcelImport, setShowExcelImport] = useState(false);

  // 물품 상세 보기
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // 사용자 주문 내역 보기
  const [showMyOrders, setShowMyOrders] = useState(false);

  // 관리자용 신청자 이름 필터
  const [filterUserName, setFilterUserName] = useState<string>('');

  // 주문 폼 필드
  const [quantity, setQuantity] = useState('1');
  const [selectedOptions, setSelectedOptions] = useState<{ [optionName: string]: string }>({});
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');

  const categories: ProductCategory[] = ['사료', '장난감', '샴푸/린스', '매트', '견옷'];

  useEffect(() => {
    loadProducts();
    if (user?.role === 'admin') {
      loadAllOrders();
    } else {
      loadMyOrders();
    }

    // 사용자 정보로 자동 입력
    if (user && user.role !== 'admin') {
      setRecipientName(user.name);
      // 담당자의 경우 등록된 주소/전화번호 가져오기
      loadUserInfo();
    }
  }, [user]);

  const loadProducts = async () => {
    const allProducts = await getProducts();
    if (user?.role === 'admin') {
      // 관리자는 모든 물품 표시
      setProducts(allProducts);
    } else {
      // 일반 사용자는 재고가 있는 물품만 표시
      setProducts(allProducts.filter(p => p.stock > 0));
    }
  };

  const loadMyOrders = async () => {
    if (!user) return;
    const allOrders = await getProductOrders();
    const filtered = allOrders.filter(o => o.userId === user.id);
    setMyOrders(filtered);
  };

  const loadAllOrders = async () => {
    const orders = await getProductOrders();
    setAllOrders(orders);
  };

  const handleStatusChange = async (orderId: string, newStatus: 'pending' | 'approved' | 'shipped' | 'delivered') => {
    const allOrders = await getProductOrders();
    const orderIndex = allOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      allOrders[orderIndex].status = newStatus;
      allOrders[orderIndex].updatedAt = new Date().toISOString();
      await saveProductOrder(allOrders[orderIndex]);
      await loadAllOrders();
      alert('주문 상태가 변경되었습니다.');
    }
  };

  const handleStockUpdate = async (productId: string, newStock: number) => {
    const allProducts = await getProducts();
    const productIndex = allProducts.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      allProducts[productIndex].stock = newStock;
      allProducts[productIndex].updatedAt = new Date().toISOString();
      await saveProduct(allProducts[productIndex]);
      await loadProducts();
      alert('재고가 업데이트되었습니다.');
    }
  };

  const handleOrderDelete = async (orderId: string) => {
    if (confirm('정말 이 신청을 삭제하시겠습니까?')) {
      await deleteProductOrder(orderId);
      await loadAllOrders();
      alert('신청이 삭제되었습니다.');
    }
  };

  const handleUserNameClick = (userName: string) => {
    setFilterUserName(userName);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerName.trim() || !registerStock) {
      alert('물품명과 재고를 모두 입력해주세요.');
      return;
    }

    const stockNum = parseInt(registerStock);
    if (isNaN(stockNum) || stockNum < 0) {
      alert('재고는 0 이상의 숫자여야 합니다.');
      return;
    }

    const product: Product = {
      id: editingProduct?.id || generateId(),
      category: registerCategory,
      name: registerName.trim(),
      stock: stockNum,
      options: registerOptions.length > 0 ? registerOptions : undefined,
      description: registerDescription.trim() || undefined,
      imageUrl: registerImage.trim() || undefined,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveProduct(product);
    resetProductForm();
    await loadProducts();
    alert(editingProduct ? '물품이 수정되었습니다.' : '물품이 등록되었습니다.');
  };

  const handleProductEdit = (product: Product) => {
    setEditingProduct(product);
    setRegisterCategory(product.category);
    setRegisterName(product.name);
    setRegisterStock(product.stock.toString());
    setRegisterOptions(product.options || []);
    setRegisterDescription(product.description || '');
    setRegisterImage(product.imageUrl || '');
    setIsAdding(true);
    setAdminView('register');
  };

  const handleProductDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await deleteProduct(id);
      await loadProducts();
      alert('물품이 삭제되었습니다.');
    }
  };

  const resetProductForm = () => {
    setRegisterCategory('사료');
    setRegisterName('');
    setRegisterStock('');
    setRegisterOptions([]);
    setRegisterDescription('');
    setRegisterImage('');
    setIsAdding(false);
    setEditingProduct(null);
  };

  const addRegisterOption = () => {
    setRegisterOptions([...registerOptions, { name: '', values: [] }]);
  };

  const removeRegisterOption = (index: number) => {
    setRegisterOptions(registerOptions.filter((_, i) => i !== index));
  };

  const updateRegisterOptionName = (index: number, name: string) => {
    const newOptions = [...registerOptions];
    newOptions[index].name = name;
    setRegisterOptions(newOptions);
  };

  const addRegisterOptionValue = (optionIndex: number) => {
    const newOptions = [...registerOptions];
    newOptions[optionIndex].values.push({ value: '', stock: 0 });
    setRegisterOptions(newOptions);
  };

  const removeRegisterOptionValue = (optionIndex: number, valueIndex: number) => {
    const newOptions = [...registerOptions];
    newOptions[optionIndex].values = newOptions[optionIndex].values.filter((_, i) => i !== valueIndex);
    setRegisterOptions(newOptions);
  };

  const updateRegisterOptionValue = (optionIndex: number, valueIndex: number, value: string) => {
    const newOptions = [...registerOptions];
    newOptions[optionIndex].values[valueIndex].value = value;
    setRegisterOptions(newOptions);
  };

  const updateRegisterOptionValueStock = (optionIndex: number, valueIndex: number, stock: number) => {
    const newOptions = [...registerOptions];
    newOptions[optionIndex].values[valueIndex].stock = stock;
    setRegisterOptions(newOptions);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setRegisterImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const loadUserInfo = () => {
    if (!user) return;

    try {
      // 파트너 정보에서 사용자 정보 찾기
      const partners = JSON.parse(localStorage.getItem('guidedog_partners') || '[]');
      const userPartner = partners.find((p: any) => p.name === user.name);

      if (userPartner) {
        setRecipientPhone(userPartner.phone || '');
        setRecipientAddress(userPartner.address || '');
        return;
      }

      // 파트너 정보가 없으면 활동 정보에서 찾기
      const activities = JSON.parse(localStorage.getItem('guidedog_activities') || '[]');
      for (const activity of activities) {
        const partner = partners.find((p: any) => p.id === activity.partnerId);
        if (partner && partner.name === user.name) {
          setRecipientPhone(partner.phone || '');
          setRecipientAddress(partner.address || '');
          break;
        }
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const handleOrder = (product: Product) => {
    setOrderingProduct(product);
    setQuantity('1');
    setSelectedOptions({});
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderingProduct || !user) return;

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      alert('수량은 1 이상이어야 합니다.');
      return;
    }

    // 옵션이 있는 경우 선택한 옵션값의 재고 확인
    if (orderingProduct.options && orderingProduct.options.length > 0) {
      for (const option of orderingProduct.options) {
        const selectedValue = selectedOptions[option.name];
        const selectedOptionValue = option.values.find(v => v.value === selectedValue);
        if (selectedOptionValue && quantityNum > selectedOptionValue.stock) {
          alert(`재고가 부족합니다. (${option.name}: ${selectedValue} - 현재 재고: ${selectedOptionValue.stock})`);
          return;
        }
      }
    } else {
      // 옵션이 없는 경우 전체 재고 확인
      if (quantityNum > orderingProduct.stock) {
        alert(`재고가 부족합니다. (현재 재고: ${orderingProduct.stock})`);
        return;
      }
    }

    if (!recipientName.trim() || !recipientPhone.trim() || !recipientAddress.trim()) {
      alert('배송 정보를 모두 입력해주세요.');
      return;
    }

    // 옵션이 있는 경우 모든 옵션이 선택되었는지 확인
    if (orderingProduct.options && orderingProduct.options.length > 0) {
      const missingOptions = orderingProduct.options.filter(opt => !selectedOptions[opt.name]);
      if (missingOptions.length > 0) {
        alert(`다음 옵션을 선택해주세요: ${missingOptions.map(opt => opt.name).join(', ')}`);
        return;
      }
    }

    // 주문 생성
    const order: ProductOrder = {
      id: generateId(),
      userId: user.id,
      userName: user.name,
      productId: orderingProduct.id,
      productName: orderingProduct.name,
      productCategory: orderingProduct.category,
      quantity: quantityNum,
      selectedOptions: orderingProduct.options && orderingProduct.options.length > 0 ? selectedOptions : undefined,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      recipientAddress: recipientAddress.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveProductOrder(order);

    // 재고 차감
    const updatedProduct: Product = {
      ...orderingProduct,
      updatedAt: new Date().toISOString(),
    };

    // 옵션이 있는 경우 선택한 옵션값의 재고 차감
    if (orderingProduct.options && orderingProduct.options.length > 0) {
      updatedProduct.options = orderingProduct.options.map(option => {
        const selectedValue = selectedOptions[option.name];
        return {
          ...option,
          values: option.values.map(optValue => {
            if (optValue.value === selectedValue) {
              return { ...optValue, stock: optValue.stock - quantityNum };
            }
            return optValue;
          })
        };
      });
    } else {
      // 옵션이 없는 경우 기존대로 전체 재고 차감
      updatedProduct.stock = orderingProduct.stock - quantityNum;
    }

    await saveProduct(updatedProduct);

    alert('물품 신청이 완료되었습니다.');
    setOrderingProduct(null);
    await loadProducts();
    await loadMyOrders();
  };

  const getCategoryBadge = (cat: ProductCategory) => {
    const colors = {
      '사료': 'bg-green-100 text-green-800',
      '장난감': 'bg-yellow-100 text-yellow-800',
      '샴푸/린스': 'bg-blue-100 text-blue-800',
      '매트': 'bg-purple-100 text-purple-800',
      '견옷': 'bg-pink-100 text-pink-800',
    };
    return colors[cat] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { text: '대기중', color: 'bg-yellow-100 text-yellow-800' },
      'approved': { text: '승인됨', color: 'bg-blue-100 text-blue-800' },
      'shipped': { text: '배송중', color: 'bg-purple-100 text-purple-800' },
      'delivered': { text: '배송완료', color: 'bg-green-100 text-green-800' },
    };
    const info = statusMap[status as keyof typeof statusMap] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${info.color}`}>{info.text}</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  // 사용자 주문 내역 전체 보기
  if (showMyOrders && user?.role !== 'admin') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">나의 신청 내역</h2>
          <button
            onClick={() => setShowMyOrders(false)}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            물품 목록으로
          </button>
        </div>

        {myOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">신청한 물품이 없습니다.</p>
            <button
              onClick={() => setShowMyOrders(false)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              물품 둘러보기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myOrders.map(order => {
              const product = products.find(p => p.id === order.productId);
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <button
                          onClick={() => {
                            if (product) {
                              setViewingProduct(product);
                              setShowMyOrders(false);
                            }
                          }}
                          disabled={!product}
                          className="text-xl font-bold text-blue-600 hover:text-blue-800 underline focus:ring-2 focus:ring-blue-500 focus:outline-none rounded disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed text-left"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && product) {
                              setViewingProduct(product);
                              setShowMyOrders(false);
                            }
                          }}
                        >
                          {order.productName}
                        </button>
                        {getStatusBadge(order.status)}
                      </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryBadge(order.productCategory)}`}>
                          {order.productCategory}
                        </span>
                      </p>
                      {order.selectedOptions && Object.keys(order.selectedOptions).length > 0 && (
                        <p className="text-sm">
                          <strong>선택 옵션:</strong>{' '}
                          {Object.entries(order.selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ')}
                        </p>
                      )}
                      <p>신청 수량: <strong>{order.quantity}개</strong></p>
                      <p>신청일: {formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">배송 정보</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>받는 사람: {order.recipientName}</p>
                    <p>연락처: {order.recipientPhone}</p>
                    <p>배송 주소: {order.recipientAddress}</p>
                  </div>
                </div>

                {order.status === 'delivered' && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800 font-semibold">✓ 배송이 완료되었습니다</p>
                  </div>
                )}
                {order.status === 'shipped' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-semibold">🚚 배송 중입니다</p>
                  </div>
                )}
                {order.status === 'pending' && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800 font-semibold">⏳ 신청이 접수되었습니다</p>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 물품 상세 보기 (일반 사용자)
  if (viewingProduct && user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{viewingProduct.name}</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 이미지 */}
            <div>
              {viewingProduct.imageUrl ? (
                <img
                  src={viewingProduct.imageUrl}
                  alt={viewingProduct.name}
                  className="w-full rounded-lg border border-gray-300"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">이미지 없음</span>
                </div>
              )}
            </div>

            {/* 정보 */}
            <div className="space-y-4">
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoryBadge(viewingProduct.category)}`}>
                  {viewingProduct.category}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">재고 현황</h3>
                <p className={`text-2xl font-bold ${viewingProduct.stock < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                  {viewingProduct.stock}개 남음
                </p>
              </div>

              {viewingProduct.options && viewingProduct.options.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">옵션</h3>
                  <div className="space-y-3">
                    {viewingProduct.options.map((option, index) => (
                      <div key={index}>
                        <p className="font-semibold text-gray-700 mb-1">{option.name}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {option.values.map((optValue, valueIndex) => (
                            <div key={valueIndex} className="text-sm p-2 bg-gray-50 rounded border border-gray-200">
                              <span className="text-gray-800">{optValue.value}</span>
                              <span className={`ml-2 text-xs ${optValue.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                (재고: {optValue.stock})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingProduct.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">제품 설명</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{viewingProduct.description}</p>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <button
                  onClick={() => {
                    setOrderingProduct(viewingProduct);
                    setViewingProduct(null);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  disabled={viewingProduct.stock === 0}
                >
                  {viewingProduct.stock === 0 ? '재고 없음' : '신청하기'}
                </button>
                <button
                  onClick={() => setViewingProduct(null)}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  목록으로 돌아가기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 주문 폼
  if (orderingProduct) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">물품 신청</h2>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">신청 물품</h3>
            <p className="text-lg font-bold text-blue-600">{orderingProduct.name}</p>
            <p className="text-sm text-gray-600">카테고리: {orderingProduct.category}</p>
            <p className="text-sm text-gray-600">현재 재고: {orderingProduct.stock}개</p>
          </div>

          <form onSubmit={handleSubmitOrder} className="space-y-6">
            <div>
              <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 mb-2">
                신청 수량 *
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    const currentQty = parseInt(quantity) || 1;
                    if (currentQty > 1) {
                      setQuantity(String(currentQty - 1));
                    }
                  }}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 숫자만 허용
                    if (value === '' || /^\d+$/.test(value)) {
                      setQuantity(value);
                    }
                  }}
                  className="flex-1 text-center px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-semibold"
                  min="1"
                  max={orderingProduct.stock}
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    const currentQty = parseInt(quantity) || 1;
                    if (currentQty < orderingProduct.stock) {
                      setQuantity(String(currentQty + 1));
                    }
                  }}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                현재 재고: {orderingProduct.stock}개
              </p>
            </div>

            {/* 옵션 선택 */}
            {orderingProduct.options && orderingProduct.options.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">옵션 선택 *</h3>
                <div className="space-y-4">
                  {orderingProduct.options.map((option, index) => (
                    <div key={index}>
                      <label htmlFor={`option-${index}`} className="block text-sm font-semibold text-gray-700 mb-2">
                        {option.name} *
                      </label>
                      <select
                        id={`option-${index}`}
                        value={selectedOptions[option.name] || ''}
                        onChange={(e) => setSelectedOptions({ ...selectedOptions, [option.name]: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                      >
                        <option value="">선택하세요</option>
                        {option.values.map((optValue, valueIndex) => (
                          <option key={valueIndex} value={optValue.value} disabled={optValue.stock === 0}>
                            {optValue.value} (재고: {optValue.stock})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">배송 정보</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="recipientName" className="block text-sm font-semibold text-gray-700 mb-2">
                    받는 사람 *
                  </label>
                  <input
                    type="text"
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="recipientPhone" className="block text-sm font-semibold text-gray-700 mb-2">
                    연락처 *
                  </label>
                  <input
                    type="tel"
                    id="recipientPhone"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="recipientAddress" className="block text-sm font-semibold text-gray-700 mb-2">
                    배송 주소 *
                  </label>
                  <textarea
                    id="recipientAddress"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows={3}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                신청 완료
              </button>
              <button
                type="button"
                onClick={() => setOrderingProduct(null)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 관리자용 물품 등록/수정 폼
  if (user?.role === 'admin' && adminView === 'register') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingProduct ? '물품 수정' : '물품 등록'}
          </h2>

          <form onSubmit={handleProductSubmit} className="space-y-6">
            <div>
              <label htmlFor="registerCategory" className="block text-sm font-semibold text-gray-700 mb-2">
                카테고리 *
              </label>
              <select
                id="registerCategory"
                value={registerCategory}
                onChange={(e) => setRegisterCategory(e.target.value as ProductCategory)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="registerName" className="block text-sm font-semibold text-gray-700 mb-2">
                물품명 *
              </label>
              <input
                type="text"
                id="registerName"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="물품명을 입력하세요"
                required
              />
            </div>

            <div>
              <label htmlFor="registerStock" className="block text-sm font-semibold text-gray-700 mb-2">
                재고 수량 *
              </label>
              <input
                type="number"
                id="registerStock"
                value={registerStock}
                onChange={(e) => setRegisterStock(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="재고 수량을 입력하세요"
                min="0"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  옵션 (선택사항)
                </label>
                <button
                  type="button"
                  onClick={addRegisterOption}
                  className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                >
                  + 옵션 추가
                </button>
              </div>

              {registerOptions.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                  옵션이 없습니다. 사이즈나 색상 등의 옵션이 필요하면 '옵션 추가' 버튼을 클릭하세요.
                </p>
              ) : (
                <div className="space-y-3">
                  {registerOptions.map((option, index) => (
                    <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-semibold text-gray-700">옵션 {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeRegisterOption(index)}
                          className="text-sm text-red-600 hover:text-red-800 font-semibold"
                        >
                          삭제
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label htmlFor={`register-option-name-${index}`} className="block text-xs font-semibold text-gray-600 mb-1">
                            옵션명 (예: 사이즈, 색상)
                          </label>
                          <input
                            type="text"
                            id={`register-option-name-${index}`}
                            value={option.name}
                            onChange={(e) => updateRegisterOptionName(index, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                            placeholder="예: 사이즈"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-semibold text-gray-600">
                              옵션값 및 재고
                            </label>
                            <button
                              type="button"
                              onClick={() => addRegisterOptionValue(index)}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                            >
                              + 값 추가
                            </button>
                          </div>

                          {option.values.length === 0 ? (
                            <p className="text-xs text-gray-500 p-2 bg-white rounded border border-gray-200">
                              옵션값을 추가하세요
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {option.values.map((optValue, valueIndex) => (
                                <div key={valueIndex} className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={optValue.value}
                                    onChange={(e) => updateRegisterOptionValue(index, valueIndex, e.target.value)}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="값 (예: S, 빨강)"
                                  />
                                  <input
                                    type="number"
                                    value={optValue.stock}
                                    onChange={(e) => updateRegisterOptionValueStock(index, valueIndex, parseInt(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="재고"
                                    min="0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeRegisterOptionValue(index, valueIndex)}
                                    className="text-xs text-red-600 hover:text-red-800 font-semibold px-2"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="registerDescription" className="block text-sm font-semibold text-gray-700 mb-2">
                물품 설명
              </label>
              <textarea
                id="registerDescription"
                value={registerDescription}
                onChange={(e) => setRegisterDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="물품에 대한 설명을 입력하세요"
                rows={4}
              />
            </div>

            <div>
              <label htmlFor="registerImageFile" className="block text-sm font-semibold text-gray-700 mb-2">
                물품 이미지
              </label>
              <input
                type="file"
                id="registerImageFile"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {registerImage && (
                <div className="mt-3">
                  <img
                    src={registerImage}
                    alt="미리보기"
                    className="max-w-xs max-h-64 rounded-lg border border-gray-300"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                * 이미지 파일 크기는 5MB 이하만 가능합니다
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {editingProduct ? '수정 완료' : '등록 완료'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetProductForm();
                  setAdminView('products');
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 관리자용 주문 관리 화면
  if (user?.role === 'admin' && adminView === 'orders') {
    const filteredOrders = filterUserName
      ? allOrders.filter(o => o.userName === filterUserName)
      : allOrders;

    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">물품 신청 현황</h2>
            {filterUserName && (
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  필터: <strong>{filterUserName}</strong>
                </span>
                <button
                  onClick={() => setFilterUserName('')}
                  className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                >
                  필터 해제
                </button>
              </div>
            )}
          </div>
          <div className="space-x-2">
            <button
              onClick={() => setAdminView('products')}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              물품 관리
            </button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">
              {filterUserName ? `${filterUserName}님의 신청 내역이 없습니다.` : '신청 내역이 없습니다.'}
            </p>
            {filterUserName && (
              <button
                onClick={() => setFilterUserName('')}
                className="mt-4 text-blue-600 hover:text-blue-800 font-semibold"
              >
                전체 보기
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">신청일</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">신청자</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">물품명</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">카테고리</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">수량</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">배송정보</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">상태</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleUserNameClick(order.userName)}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline focus:ring-2 focus:ring-blue-500 focus:outline-none rounded"
                        >
                          {order.userName}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800 font-semibold">{order.productName}</div>
                        {order.selectedOptions && Object.keys(order.selectedOptions).length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {Object.entries(order.selectedOptions).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryBadge(order.productCategory)}`}>
                          {order.productCategory}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{order.quantity}개</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="space-y-1">
                          <p className="font-semibold">{order.recipientName}</p>
                          <p>{order.recipientPhone}</p>
                          <p className="text-xs">{order.recipientAddress}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="pending">대기중</option>
                            <option value="approved">승인됨</option>
                            <option value="shipped">배송중</option>
                            <option value="delivered">배송완료</option>
                          </select>
                          <button
                            onClick={() => handleOrderDelete(order.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 관리자용 엑셀 일괄 등록 화면
  if (user?.role === 'admin' && showExcelImport) {
    return (
      <div className="max-w-4xl mx-auto">
        <ProductExcelImport
          onSuccess={() => {
            setShowExcelImport(false);
            setAdminView('products');
            loadProducts();
          }}
        />
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowExcelImport(false)}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  // 관리자용 재고 관리 화면
  if (user?.role === 'admin' && adminView === 'products') {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">물품 관리</h2>
          <div className="space-x-2">
            <button
              onClick={() => {
                resetProductForm();
                setAdminView('register');
              }}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              + 물품 등록
            </button>
            <button
              onClick={() => setShowExcelImport(true)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              📋 엑셀 일괄 등록
            </button>
            <button
              onClick={() => setAdminView('orders')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              신청 현황 보기
            </button>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <label htmlFor="categoryFilter" className="block text-sm font-semibold text-gray-700 mb-2">
            카테고리별 보기
          </label>
          <select
            id="categoryFilter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | 'all')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">전체 ({products.length})</option>
            {categories.map(cat => {
              const count = products.filter(p => p.category === cat).length;
              return (
                <option key={cat} value={cat}>
                  {cat} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">등록된 물품이 없습니다.</p>
            <button
              onClick={() => {
                resetProductForm();
                setAdminView('register');
              }}
              className="mt-4 text-blue-600 hover:text-blue-800 font-semibold"
            >
              첫 물품 등록하기
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">카테고리</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">물품명</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">현재 재고</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoryBadge(product.category)}`}>
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">{product.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-lg font-bold ${product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                          {product.stock}개
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={() => handleProductEdit(product)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleProductDelete(product.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 일반 사용자용 목록 화면
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">물품 신청</h2>
        <button
          onClick={() => setShowMyOrders(true)}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2"
        >
          <span>📦</span>
          <span>주문 내역</span>
          {myOrders.length > 0 && (
            <span className="bg-white text-purple-600 px-2 py-0.5 rounded-full text-xs font-bold">
              {myOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* 내 신청 내역 (최근 3개) */}
      {myOrders.length > 0 && (
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">최근 신청 내역</h3>
            <button
              onClick={() => setShowMyOrders(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
            >
              전체 보기 →
            </button>
          </div>
          <div className="space-y-3">
            {myOrders.slice(0, 5).map(order => {
              const product = products.find(p => p.id === order.productId);
              return (
                <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <button
                      onClick={() => {
                        if (product) {
                          setViewingProduct(product);
                        }
                      }}
                      disabled={!product}
                      className="font-semibold text-blue-600 hover:text-blue-800 underline focus:ring-2 focus:ring-blue-500 focus:outline-none rounded disabled:text-gray-800 disabled:no-underline disabled:cursor-not-allowed text-left"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && product) {
                          setViewingProduct(product);
                        }
                      }}
                    >
                      {order.productName}
                    </button>
                    {order.selectedOptions && Object.keys(order.selectedOptions).length > 0 && (
                      <p className="text-xs text-gray-500">
                        {Object.entries(order.selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">수량: {order.quantity}개 | {formatDate(order.createdAt)}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 카테고리 필터 */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <label htmlFor="categoryFilter" className="block text-sm font-semibold text-gray-700 mb-2">
          카테고리별 보기
        </label>
        <select
          id="categoryFilter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | 'all')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="all">전체 ({products.length})</option>
          {categories.map(cat => {
            const count = products.filter(p => p.category === cat).length;
            return (
              <option key={cat} value={cat}>
                {cat} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {/* 물품 목록 */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500">신청 가능한 물품이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoryBadge(product.category)}`}>
                  {product.category}
                </span>
              </div>
              <button
                onClick={() => setViewingProduct(product)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setViewingProduct(product);
                  }
                }}
                className="text-left w-full mb-2 text-xl font-bold text-blue-600 hover:text-blue-800 underline focus:ring-2 focus:ring-blue-500 outline-none rounded"
              >
                {product.name}
              </button>
              <p className="text-gray-600 mb-4">
                재고: <span className={`font-bold ${product.stock < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                  {product.stock}개
                </span>
              </p>
              <button
                onClick={() => handleOrder(product)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                신청하기
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
