/**
 * 데이터 수정 모달 컴포넌트
 * 접근성을 고려한 모달 구현
 */

import { useState, useEffect, useRef } from 'react';
import type {
  CombinedData,
  FormData,
  FormErrors,
  Gender,
  PartnerGender,
  JobCategory,
  DogCategory,
  GuideDog,
  Partner,
  Activity,
} from '../types/types';
import {
  calculateAge,
  saveGuideDog,
  savePartner,
  saveActivity,
} from '../utils/storage';

const categories: DogCategory[] = ['퍼피티칭', '안내견', '은퇴견', '부모견'];

interface DataEditModalProps {
  item: CombinedData;
  onClose: (updated: boolean) => void;
}

export const DataEditModal = ({ item, onClose }: DataEditModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<FormData>({
    dogCategory: item.guideDog.category,
    dogName: item.guideDog.name,
    dogBirthDate: item.guideDog.birthDate,
    dogGender: item.guideDog.gender,
    dogPhoto: item.guideDog.photo,
    puppyTeacherName: item.guideDog.puppyTeacherName || '',
    puppyTeacherPhone: item.guideDog.puppyTeacherPhone || '',
    puppyTeacherAddress: item.guideDog.puppyTeacherAddress || '',
    retiredHomeCareName: item.guideDog.retiredHomeCareName || '',
    retiredHomeCarePhone: item.guideDog.retiredHomeCarePhone || '',
    retiredHomeCareAddress: item.guideDog.retiredHomeCareAddress || '',
    parentCaregiverName: item.guideDog.parentCaregiverName || '',
    parentCaregiverPhone: item.guideDog.parentCaregiverPhone || '',
    parentCaregiverAddress: item.guideDog.parentCaregiverAddress || '',
    partnerName: item.partner.name,
    phone: item.partner.phone,
    address: item.partner.address,
    partnerPhoto: item.partner.photo,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // 모달 포커스 트랩 (마운트 시 한 번만 실행)
  useEffect(() => {
    const firstInput = modalRef.current?.querySelector('input, select, textarea, button') as HTMLElement;
    firstInput?.focus();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 시에만 실행

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'dog' | 'partner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (type === 'dog') {
        setFormData(prev => ({ ...prev, dogPhoto: base64 }));
      } else {
        setFormData(prev => ({ ...prev, partnerPhoto: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    // 필수 항목 검증 제거 - 모든 필드 선택사항
    setErrors({});
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const now = new Date().toISOString();

      // 안내견 업데이트
      const guideDog: GuideDog = {
        ...item.guideDog,
        category: formData.dogCategory as DogCategory,
        name: formData.dogName,
        birthDate: formData.dogBirthDate,
        gender: formData.dogGender as Gender,
        photo: formData.dogPhoto,
        ...(formData.dogCategory === '퍼피티칭' && {
          puppyTeacherName: formData.puppyTeacherName,
          puppyTeacherPhone: formData.puppyTeacherPhone,
          puppyTeacherAddress: formData.puppyTeacherAddress,
        }),
        ...(formData.dogCategory === '은퇴견' && {
          retiredHomeCareName: formData.retiredHomeCareName,
          retiredHomeCarePhone: formData.retiredHomeCarePhone,
          retiredHomeCareAddress: formData.retiredHomeCareAddress,
        }),
        ...(formData.dogCategory === '부모견' && {
          parentCaregiverName: formData.parentCaregiverName,
          parentCaregiverPhone: formData.parentCaregiverPhone,
          parentCaregiverAddress: formData.parentCaregiverAddress,
        }),
        updatedAt: now,
      };
      saveGuideDog(guideDog);

      // 파트너 업데이트
      const partner: Partner = {
        ...item.partner,
        name: formData.partnerName,
        phone: formData.phone,
        address: formData.address,
        photo: formData.partnerPhoto,
        updatedAt: now,
      };
      savePartner(partner);

      // 활동 업데이트
      const activity: Activity = {
        ...item.activity,
        updatedAt: now,
      };
      saveActivity(activity);

      onClose(true);
    } catch (error) {
      console.error('수정 실패:', error);
      alert('데이터 수정에 실패했습니다.');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-neutral-900 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose(false)}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-center">
          <h2 id="modal-title" className="text-2xl font-bold">
            데이터 수정
          </h2>
          <button
            onClick={() => onClose(false)}
            aria-label="닫기"
            className="text-neutral-500 hover:text-neutral-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* 안내견 기본 정보 */}
          <fieldset className="mb-8 border border-neutral-300 p-4 rounded">
            <legend className="text-xl font-semibold px-2">안내견 기본 정보</legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="edit-dogCategory" className="block text-sm font-medium mb-1">
                  분류 <span className="text-error-600">*</span>
                </label>
                <select
                  id="edit-dogCategory"
                  name="dogCategory"
                  value={formData.dogCategory}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={!!errors.dogCategory}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">선택하세요</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.dogCategory && (
                  <p className="text-error-600 text-sm mt-1">{errors.dogCategory}</p>
                )}
              </div>

              <div>
                <label htmlFor="edit-dogName" className="block text-sm font-medium mb-1">
                  견명 <span className="text-error-600">*</span>
                </label>
                <input
                  type="text"
                  id="edit-dogName"
                  name="dogName"
                  value={formData.dogName}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={!!errors.dogName}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                />
                {errors.dogName && (
                  <p className="text-error-600 text-sm mt-1">{errors.dogName}</p>
                )}
              </div>

              <div>
                <label htmlFor="edit-dogBirthDate" className="block text-sm font-medium mb-1">
                  생년월일 <span className="text-error-600">*</span>
                </label>
                <input
                  type="date"
                  id="edit-dogBirthDate"
                  name="dogBirthDate"
                  value={formData.dogBirthDate}
                  onChange={handleChange}
                  aria-required="true"
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="edit-dogGender" className="block text-sm font-medium mb-1">
                  성별 <span className="text-error-600">*</span>
                </label>
                <select
                  id="edit-dogGender"
                  name="dogGender"
                  value={formData.dogGender}
                  onChange={handleChange}
                  aria-required="true"
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">선택하세요</option>
                  <option value="수컷">수컷</option>
                  <option value="암컷">암컷</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="edit-dogPhoto" className="block text-sm font-medium mb-1">
                  견 사진
                </label>
                <input
                  type="file"
                  id="edit-dogPhoto"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'dog')}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                />
                {formData.dogPhoto && (
                  <img
                    src={formData.dogPhoto}
                    alt="견 사진 미리보기"
                    className="mt-2 w-32 h-32 object-cover rounded"
                  />
                )}
              </div>
            </div>
          </fieldset>

          {/* 퍼피티칭 카테고리일 때만 표시 */}
          {formData.dogCategory === '퍼피티칭' && (
            <fieldset className="mb-8 border border-primary-300 p-4 rounded bg-primary-50">
              <legend className="text-xl font-semibold px-2 text-primary-900">퍼피티칭 정보</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="edit-puppyTeacherName" className="block text-sm font-medium mb-1">
                    퍼피티처 이름
                  </label>
                  <input
                    type="text"
                    id="edit-puppyTeacherName"
                    name="puppyTeacherName"
                    value={formData.puppyTeacherName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="edit-puppyTeacherPhone" className="block text-sm font-medium mb-1">
                    퍼피티처 연락처
                  </label>
                  <input
                    type="tel"
                    id="edit-puppyTeacherPhone"
                    name="puppyTeacherPhone"
                    value={formData.puppyTeacherPhone}
                    onChange={handleChange}
                    placeholder="010-1234-5678"
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="edit-puppyTeacherAddress" className="block text-sm font-medium mb-1">
                    퍼피티처 주소
                  </label>
                  <input
                    type="text"
                    id="edit-puppyTeacherAddress"
                    name="puppyTeacherAddress"
                    value={formData.puppyTeacherAddress}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </fieldset>
          )}

          {/* 부모견 카테고리일 때만 표시 */}
          {formData.dogCategory === '부모견' && (
            <fieldset className="mb-8 border border-cyan-300 p-4 rounded bg-cyan-50">
              <legend className="text-xl font-semibold px-2 text-cyan-900">부모견 홈케어 정보</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="edit-parentCaregiverName" className="block text-sm font-medium mb-1">
                    홈케어자 이름
                  </label>
                  <input
                    type="text"
                    id="edit-parentCaregiverName"
                    name="parentCaregiverName"
                    value={formData.parentCaregiverName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="edit-parentCaregiverPhone" className="block text-sm font-medium mb-1">
                    홈케어자 연락처
                  </label>
                  <input
                    type="tel"
                    id="edit-parentCaregiverPhone"
                    name="parentCaregiverPhone"
                    value={formData.parentCaregiverPhone}
                    onChange={handleChange}
                    placeholder="010-1234-5678"
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="edit-parentCaregiverAddress" className="block text-sm font-medium mb-1">
                    홈케어자 주소
                  </label>
                  <input
                    type="text"
                    id="edit-parentCaregiverAddress"
                    name="parentCaregiverAddress"
                    value={formData.parentCaregiverAddress}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </fieldset>
          )}

          {/* 은퇴견 카테고리일 때만 표시 */}
          {formData.dogCategory === '은퇴견' && (
            <fieldset className="mb-8 border border-success-300 p-4 rounded bg-success-50">
              <legend className="text-xl font-semibold px-2 text-success-900">은퇴견 홈케어 정보</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label htmlFor="edit-retiredHomeCareName" className="block text-sm font-medium mb-1">
                    홈케어 이름
                  </label>
                  <input
                    type="text"
                    id="edit-retiredHomeCareName"
                    name="retiredHomeCareName"
                    value={formData.retiredHomeCareName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="edit-retiredHomeCarePhone" className="block text-sm font-medium mb-1">
                    홈케어 연락처
                  </label>
                  <input
                    type="tel"
                    id="edit-retiredHomeCarePhone"
                    name="retiredHomeCarePhone"
                    value={formData.retiredHomeCarePhone}
                    onChange={handleChange}
                    placeholder="010-1234-5678"
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="edit-retiredHomeCareAddress" className="block text-sm font-medium mb-1">
                    홈케어 주소
                  </label>
                  <input
                    type="text"
                    id="edit-retiredHomeCareAddress"
                    name="retiredHomeCareAddress"
                    value={formData.retiredHomeCareAddress}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </fieldset>
          )}

          {/* 안내견 카테고리일 때만: 파트너 정보 */}
          {formData.dogCategory === '안내견' && (
          <fieldset className="mb-8 border border-warning-300 p-4 rounded bg-warning-50">
            <legend className="text-xl font-semibold px-2 text-warning-900">파트너 정보</legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="edit-partnerName" className="block text-sm font-medium mb-1">
                  파트너 성명
                </label>
                <input
                  type="text"
                  id="edit-partnerName"
                  name="partnerName"
                  value={formData.partnerName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="edit-phone" className="block text-sm font-medium mb-1">
                  연락처
                </label>
                <input
                  type="tel"
                  id="edit-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="edit-address" className="block text-sm font-medium mb-1">
                  주소
                </label>
                <input
                  type="text"
                  id="edit-address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="edit-partnerPhoto" className="block text-sm font-medium mb-1">
                  파트너 사진
                </label>
                <input
                  type="file"
                  id="edit-partnerPhoto"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'partner')}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                />
                {formData.partnerPhoto && (
                  <img
                    src={formData.partnerPhoto}
                    alt="파트너 사진 미리보기"
                    className="mt-2 w-32 h-32 object-cover rounded"
                  />
                )}
              </div>
            </div>
          </fieldset>
          )}

          {/* 버튼 */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-6 py-3 bg-neutral-500 text-white font-semibold rounded hover:bg-neutral-600 focus:ring-4 focus:ring-neutral-300"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-primary-600 text-white font-semibold rounded hover:bg-primary-700 focus:ring-4 focus:ring-primary-300"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
