/**
 * 데이터 작성 폼 컴포넌트
 * NVDA 스크린리더 접근성을 최우선으로 고려
 */

import { useState, useEffect } from 'react';
import type {
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
  generateId,
  calculateAge,
  saveGuideDog,
  savePartner,
  saveActivity,
} from '../utils/storage';

const initialFormData: FormData = {
  // 안내견 정보
  dogCategory: '',
  dogName: '',
  dogBirthDate: '',
  dogGender: '',
  dogPhoto: '',

  // 퍼피티칭 카테고리일 때만 사용
  puppyTeacherName: '',
  puppyTeacherPhone: '',
  puppyTeacherAddress: '',

  // 은퇴견 카테고리일 때만 사용
  retiredHomeCareName: '',
  retiredHomeCarePhone: '',
  retiredHomeCareAddress: '',

  // 부모견 카테고리일 때만 사용
  parentCaregiverName: '',
  parentCaregiverPhone: '',
  parentCaregiverAddress: '',

  // 파트너 정보
  partnerName: '',
  phone: '',
  address: '',
  partnerPhoto: '',
};

const dogCategories: DogCategory[] = ['퍼피티칭', '안내견', '은퇴견', '부모견'];

interface DataFormProps {
  onSuccess?: () => void;
}

export const DataForm: React.FC<DataFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 에러 제거
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    // 필수 항목 검증 제거 - 모든 필드 선택사항
    setErrors({});
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      setSubmitStatus('error');
      // 첫 번째 에러 필드로 포커스 이동
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      element?.focus();
      return;
    }

    try {
      const now = new Date().toISOString();

      // 안내견 저장
      const guideDog: GuideDog = {
        id: generateId(),
        category: (formData.dogCategory as DogCategory) || '안내견',
        name: formData.dogName,
        birthDate: formData.dogBirthDate,
        gender: (formData.dogGender as Gender) || '수컷',
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
        createdAt: now,
        updatedAt: now,
      };
      saveGuideDog(guideDog);

      // 안내견 카테고리일 때만 파트너와 활동 저장
      if (formData.dogCategory === '안내견') {
        // 파트너 저장
        const partner: Partner = {
          id: generateId(),
          name: formData.partnerName,
          phone: formData.phone,
          address: formData.address || '',
          photo: formData.partnerPhoto,
          createdAt: now,
          updatedAt: now,
        };
        savePartner(partner);

        // 활동 저장
        const activity: Activity = {
          id: generateId(),
          guideDogId: guideDog.id,
          partnerId: partner.id,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          createdAt: now,
          updatedAt: now,
        };
        saveActivity(activity);
      } else {
        // 안내견이 아닌 경우 더미 파트너와 활동 생성 (테이블 조회를 위해)
        const dummyPartner: Partner = {
          id: generateId(),
          name: '-',
          phone: '-',
          address: '-',
          photo: '',
          createdAt: now,
          updatedAt: now,
        };
        savePartner(dummyPartner);

        const dummyActivity: Activity = {
          id: generateId(),
          guideDogId: guideDog.id,
          partnerId: dummyPartner.id,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          createdAt: now,
          updatedAt: now,
        };
        saveActivity(dummyActivity);
      }

      setSubmitStatus('success');
      setFormData(initialFormData);
      setCalculatedAge(null);

      // 성공 콜백 호출
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        // 성공 메시지 안내 후 폼 초기화
        setTimeout(() => {
          setSubmitStatus('idle');
        }, 3000);
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('데이터 저장 실패:', error);
    }
  };

  return (
    <section
      className="bg-white p-6 rounded-lg shadow-md"
      aria-labelledby="form-heading"
    >
      <h2 id="form-heading" className="text-2xl font-bold mb-6">
        데이터 작성
      </h2>

      {/* 제출 상태 메시지 */}
      {submitStatus === 'success' && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 p-4 bg-success-100 border border-success-400 text-success-700 rounded"
        >
          데이터가 성공적으로 저장되었습니다.
        </div>
      )}

      {submitStatus === 'error' && Object.keys(errors).length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 p-4 bg-error-100 border border-error-400 text-error-700 rounded"
        >
          <p className="font-bold mb-2">입력 오류가 있습니다:</p>
          <ul className="list-disc list-inside">
            {Object.values(errors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* 안내견 기본 정보 */}
        <fieldset className="mb-8 border border-neutral-300 p-4 rounded">
          <legend className="text-xl font-semibold px-2">안내견 기본 정보</legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* 분류 */}
            <div>
              <label htmlFor="dogCategory" className="block text-sm font-medium mb-1">
                분류 <span className="text-error-600" aria-label="필수">*</span>
              </label>
              <select
                id="dogCategory"
                name="dogCategory"
                value={formData.dogCategory}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={!!errors.dogCategory}
                aria-describedby={errors.dogCategory ? 'dogCategory-error' : undefined}
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
              >
                <option value="">선택하세요</option>
                {dogCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.dogCategory && (
                <p id="dogCategory-error" className="text-error-600 text-sm mt-1" role="alert">
                  {errors.dogCategory}
                </p>
              )}
            </div>

            {/* 견명 */}
            <div>
              <label htmlFor="dogName" className="block text-sm font-medium mb-1">
                견명 <span className="text-error-600" aria-label="필수">*</span>
              </label>
              <input
                type="text"
                id="dogName"
                name="dogName"
                value={formData.dogName}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={!!errors.dogName}
                aria-describedby={errors.dogName ? 'dogName-error' : undefined}
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
              />
              {errors.dogName && (
                <p id="dogName-error" className="text-error-600 text-sm mt-1" role="alert">
                  {errors.dogName}
                </p>
              )}
            </div>

            {/* 생년월일 */}
            <div>
              <label htmlFor="dogBirthDate" className="block text-sm font-medium mb-1">
                생년월일 <span className="text-error-600" aria-label="필수">*</span>
              </label>
              <input
                type="date"
                id="dogBirthDate"
                name="dogBirthDate"
                value={formData.dogBirthDate}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={!!errors.dogBirthDate}
                aria-describedby={errors.dogBirthDate ? 'dogBirthDate-error' : undefined}
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
              />
              {errors.dogBirthDate && (
                <p id="dogBirthDate-error" className="text-error-600 text-sm mt-1" role="alert">
                  {errors.dogBirthDate}
                </p>
              )}
            </div>

            {/* 성별 */}
            <div>
              <label htmlFor="dogGender" className="block text-sm font-medium mb-1">
                성별
              </label>
              <select
                id="dogGender"
                name="dogGender"
                value={formData.dogGender}
                onChange={handleChange}
                aria-invalid={!!errors.dogGender}
                aria-describedby={errors.dogGender ? 'dogGender-error' : undefined}
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
              >
                <option value="">선택하세요 (기본값: 수컷)</option>
                <option value="수컷">수컷</option>
                <option value="암컷">암컷</option>
              </select>
              {errors.dogGender && (
                <p id="dogGender-error" className="text-error-600 text-sm mt-1" role="alert">
                  {errors.dogGender}
                </p>
              )}
            </div>

            {/* 견 사진 */}
            <div className="md:col-span-2">
              <label htmlFor="dogPhoto" className="block text-sm font-medium mb-1">
                견 사진 (URL)
              </label>
              <input
                type="text"
                id="dogPhoto"
                name="dogPhoto"
                value={formData.dogPhoto}
                onChange={handleChange}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </fieldset>

        {/* 퍼피티칭 카테고리일 때만 표시 */}
        {formData.dogCategory === '퍼피티칭' && (
          <fieldset className="mb-8 border border-primary-300 p-4 rounded bg-primary-50">
            <legend className="text-xl font-semibold px-2 text-primary-900">퍼피티칭 정보</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="puppyTeacherName" className="block text-sm font-medium mb-1">
                  퍼피티처 이름
                </label>
                <input
                  type="text"
                  id="puppyTeacherName"
                  name="puppyTeacherName"
                  value={formData.puppyTeacherName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="puppyTeacherPhone" className="block text-sm font-medium mb-1">
                  퍼피티처 연락처
                </label>
                <input
                  type="tel"
                  id="puppyTeacherPhone"
                  name="puppyTeacherPhone"
                  value={formData.puppyTeacherPhone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="puppyTeacherAddress" className="block text-sm font-medium mb-1">
                  퍼피티처 주소
                </label>
                <input
                  type="text"
                  id="puppyTeacherAddress"
                  name="puppyTeacherAddress"
                  value={formData.puppyTeacherAddress}
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
                <label htmlFor="retiredHomeCareName" className="block text-sm font-medium mb-1">
                  홈케어 이름
                </label>
                <input
                  type="text"
                  id="retiredHomeCareName"
                  name="retiredHomeCareName"
                  value={formData.retiredHomeCareName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="retiredHomeCarePhone" className="block text-sm font-medium mb-1">
                  홈케어 연락처
                </label>
                <input
                  type="tel"
                  id="retiredHomeCarePhone"
                  name="retiredHomeCarePhone"
                  value={formData.retiredHomeCarePhone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="retiredHomeCareAddress" className="block text-sm font-medium mb-1">
                  홈케어 주소
                </label>
                <input
                  type="text"
                  id="retiredHomeCareAddress"
                  name="retiredHomeCareAddress"
                  value={formData.retiredHomeCareAddress}
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
                <label htmlFor="parentCaregiverName" className="block text-sm font-medium mb-1">
                  홈케어자 이름
                </label>
                <input
                  type="text"
                  id="parentCaregiverName"
                  name="parentCaregiverName"
                  value={formData.parentCaregiverName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="parentCaregiverPhone" className="block text-sm font-medium mb-1">
                  홈케어자 연락처
                </label>
                <input
                  type="tel"
                  id="parentCaregiverPhone"
                  name="parentCaregiverPhone"
                  value={formData.parentCaregiverPhone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="parentCaregiverAddress" className="block text-sm font-medium mb-1">
                  홈케어자 주소
                </label>
                <input
                  type="text"
                  id="parentCaregiverAddress"
                  name="parentCaregiverAddress"
                  value={formData.parentCaregiverAddress}
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
            {/* 파트너 성명 */}
            <div>
              <label htmlFor="partnerName" className="block text-sm font-medium mb-1">
                파트너 성명
              </label>
              <input
                type="text"
                id="partnerName"
                name="partnerName"
                value={formData.partnerName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* 연락처 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                연락처
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="010-1234-5678"
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* 주소 */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium mb-1">
                주소
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* 파트너 사진 */}
            <div className="md:col-span-2">
              <label htmlFor="partnerPhoto" className="block text-sm font-medium mb-1">
                파트너 사진 (URL)
              </label>
              <input
                type="text"
                id="partnerPhoto"
                name="partnerPhoto"
                value={formData.partnerPhoto}
                onChange={handleChange}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </fieldset>
        )}

        {/* 제출 버튼 */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-primary-600 text-white font-semibold rounded hover:bg-primary-700 focus:ring-4 focus:ring-primary-300"
            aria-label="데이터 저장"
          >
            저장
          </button>
        </div>
      </form>
    </section>
  );
};
