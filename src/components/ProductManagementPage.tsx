/**
 * 물품 재고 관리 페이지 (관리자 전용)
 */

import { useState, useEffect } from 'react';
import type { Product, ProductCategory, ProductOption, ProductOptionValue } from '../types/types';
import { generateId } from '../utils/storage';

const STORAGE_KEY = 'guidedog_products';

const getProducts = (): Product[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveProduct = (product: Product): void => {
  const products = getProducts();
  const existingIndex = products.findIndex(p => p.id === product.id);

  if (existingIndex >= 0) {
    products[existingIndex] = { ...product, updatedAt: new Date().toISOString() };
  } else {
    products.push(product);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

const deleteProduct = (id: string): void => {
  const products = getProducts().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

export const ProductManagementPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');

  // 폼 필드
  const [category, setCategory] = useState<ProductCategory>('사료');
  const [name, setName] = useState('');
  const [stock, setStock] = useState('');
  const [options, setOptions] = useState<ProductOption[]>([]);

  const categories: ProductCategory[] = ['사료', '장난감', '샴푸/린스', '매트', '견옷'];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    setProducts(getProducts());
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !stock) {
      alert('물품명과 재고를 모두 입력해주세요.');
      return;
    }

    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) {
      alert('재고는 0 이상의 숫자여야 합니다.');
      return;
    }

    // 옵션 재고 합계 검증
    if (options.length > 0) {
      const totalOptionStock = options.reduce((total, option) => {
        const optionSum = option.values.reduce((sum, value) => sum + (value.stock || 0), 0);
        return total + optionSum;
      }, 0);

      if (totalOptionStock > stockNum) {
        alert(`옵션 재고 합계(${totalOptionStock})가 기본 재고 수량(${stockNum})을 초과할 수 없습니다.`);
        return;
      }
    }

    const product: Product = {
      id: editingProduct?.id || generateId(),
      category,
      name: name.trim(),
      stock: stockNum,
      options: options.length > 0 ? options : undefined,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveProduct(product);
    resetForm();
    loadProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setCategory(product.category);
    setName(product.name);
    setStock(product.stock.toString());
    setOptions(product.options || []);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteProduct(id);
      loadProducts();
    }
  };

  const resetForm = () => {
    setCategory('사료');
    setName('');
    setStock('');
    setOptions([]);
    setIsAdding(false);
    setEditingProduct(null);
  };

  const addOption = () => {
    setOptions([...options, { name: '', values: [] }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOptionName = (index: number, name: string) => {
    const newOptions = [...options];
    newOptions[index].name = name;
    setOptions(newOptions);
  };

  const addOptionValue = (optionIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].values.push({ value: '', stock: 0 });
    setOptions(newOptions);
  };

  const removeOptionValue = (optionIndex: number, valueIndex: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].values = newOptions[optionIndex].values.filter((_, i) => i !== valueIndex);
    setOptions(newOptions);
  };

  const updateOptionValue = (optionIndex: number, valueIndex: number, value: string) => {
    const newOptions = [...options];
    newOptions[optionIndex].values[valueIndex].value = value;
    setOptions(newOptions);
  };

  const updateOptionValueStock = (optionIndex: number, valueIndex: number, stock: number) => {
    const newOptions = [...options];
    newOptions[optionIndex].values[valueIndex].stock = stock;
    setOptions(newOptions);
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

  // 폼 화면
  if (isAdding) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingProduct ? '물품 수정' : '물품 등록'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                카테고리 *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                물품명 *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="물품명을 입력하세요"
                required
              />
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-semibold text-gray-700 mb-2">
                재고 수량 *
              </label>
              <input
                type="number"
                id="stock"
                value={stock}
                onChange={(e) => {
                  const value = e.target.value;
                  // 숫자만 허용 (빈 문자열 또는 숫자)
                  if (value === '' || /^\d+$/.test(value)) {
                    setStock(value);
                  }
                }}
                onKeyPress={(e) => {
                  // 숫자가 아닌 키 입력 방지
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="재고 수량을 입력하세요 (숫자만)"
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
                  onClick={addOption}
                  className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                >
                  + 옵션 추가
                </button>
              </div>

              {options.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                  옵션이 없습니다. 사이즈나 색상 등의 옵션이 필요하면 '옵션 추가' 버튼을 클릭하세요.
                </p>
              ) : (
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-semibold text-gray-700">옵션 {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="text-sm text-red-600 hover:text-red-800 font-semibold"
                        >
                          삭제
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label htmlFor={`option-name-${index}`} className="block text-xs font-semibold text-gray-600 mb-1">
                            옵션명 (예: 사이즈, 색상)
                          </label>
                          <input
                            type="text"
                            id={`option-name-${index}`}
                            value={option.name}
                            onChange={(e) => updateOptionName(index, e.target.value)}
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
                              onClick={() => addOptionValue(index)}
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
                                    onChange={(e) => updateOptionValue(index, valueIndex, e.target.value)}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="값 (예: S, 빨강)"
                                  />
                                  <input
                                    type="number"
                                    value={optValue.stock}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      // 빈 문자열이거나 숫자인 경우에만 허용
                                      if (value === '' || /^\d+$/.test(value)) {
                                        updateOptionValueStock(index, valueIndex, parseInt(value) || 0);
                                      }
                                    }}
                                    onKeyPress={(e) => {
                                      // 숫자가 아닌 키 입력 방지
                                      if (!/[0-9]/.test(e.key)) {
                                        e.preventDefault();
                                      }
                                    }}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="재고"
                                    min="0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeOptionValue(index, valueIndex)}
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

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {editingProduct ? '수정 완료' : '등록 완료'}
              </button>
              <button
                type="button"
                onClick={resetForm}
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

  // 목록 화면
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">물품 재고 관리</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          물품 등록
        </button>
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
            onClick={() => setIsAdding(true)}
            className="mt-4 text-blue-600 hover:text-blue-800 font-semibold"
          >
            첫 물품 등록하기
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">카테고리</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">물품명</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">재고</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoryBadge(product.category)}`}>
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{product.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-lg font-bold ${product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleEdit(product)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mr-2 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
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
      )}
    </div>
  );
};
