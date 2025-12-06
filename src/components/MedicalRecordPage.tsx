/**
 * 진료 기록 페이지 컴포넌트
 * 일반 진료와 백신 접종 기록을 통합 관리
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { MedicalRecord, MedicalRecordCategory, VaccineType } from '../types/types';
import { generateId } from '../utils/storage';

const STORAGE_KEY = 'guidedog_medical';

const getMedicalRecords = (): MedicalRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveMedicalRecord = (record: MedicalRecord): void => {
  const records = getMedicalRecords();
  const existingIndex = records.findIndex(r => r.id === record.id);

  if (existingIndex >= 0) {
    records[existingIndex] = { ...record, updatedAt: new Date().toISOString() };
  } else {
    records.unshift(record); // 최신 기록이 위로
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const deleteMedicalRecord = (id: string): void => {
  const records = getMedicalRecords().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const MedicalRecordPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | null>(null);

  // 폼 필드
  const [category, setCategory] = useState<MedicalRecordCategory>('일반 진료');
  const [visitDate, setVisitDate] = useState('');
  const [hospital, setHospital] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [cost, setCost] = useState('');
  const [selectedVaccines, setSelectedVaccines] = useState<VaccineType[]>([]);
  const [receiptPhotos, setReceiptPhotos] = useState<string[]>([]);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const allRecords = getMedicalRecords();

    // 관리자는 모든 기록 표시
    if (user?.role === 'admin') {
      setRecords(allRecords);
      return;
    }

    // 일반 담당자는 자신이 작성한 기록만 표시
    const filteredRecords = allRecords.filter(r => r.userId === user?.id);
    setRecords(filteredRecords);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setReceiptPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVaccineToggle = (vaccine: VaccineType) => {
    setSelectedVaccines(prev =>
      prev.includes(vaccine)
        ? prev.filter(v => v !== vaccine)
        : [...prev, vaccine]
    );
  };

  const handleEdit = (record: MedicalRecord) => {
    setEditingRecord(record);
    setIsEditing(true);
    setCategory(record.category);
    setVisitDate(record.visitDate);
    setHospital(record.hospital);
    setDiagnosis(record.diagnosis || '');
    setTreatment(record.treatment || '');
    setCost(record.cost?.toString() || '');
    setSelectedVaccines(record.vaccines || []);
    setReceiptPhotos(record.receiptPhotos);
    setViewingRecord(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!visitDate || !hospital) {
      alert('날짜와 병원명은 필수입니다.');
      return;
    }

    if (category === '일반 진료') {
      if (!diagnosis || !treatment || !cost) {
        alert('일반 진료는 진단 내용, 치료 내용, 진료비가 필수입니다.');
        return;
      }
    } else if (category === '백신 접종') {
      if (selectedVaccines.length === 0) {
        alert('백신을 하나 이상 선택해주세요.');
        return;
      }
    }

    if (!user?.dogName) {
      alert('안내견 정보가 없습니다.');
      return;
    }

    const record: MedicalRecord = {
      id: isEditing && editingRecord ? editingRecord.id : generateId(),
      userId: user.id,
      userName: user.name,
      dogName: user.dogName,
      category,
      visitDate,
      hospital,
      diagnosis: category === '일반 진료' ? diagnosis : undefined,
      treatment: category === '일반 진료' ? treatment : undefined,
      cost: category === '일반 진료' && cost ? parseFloat(cost) : undefined,
      vaccines: category === '백신 접종' ? selectedVaccines : undefined,
      receiptPhotos,
      createdAt: isEditing && editingRecord ? editingRecord.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveMedicalRecord(record);
    resetForm();
    loadRecords();
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteMedicalRecord(id);
      loadRecords();
      setViewingRecord(null);
    }
  };

  const resetForm = () => {
    setCategory('일반 진료');
    setVisitDate('');
    setHospital('');
    setDiagnosis('');
    setTreatment('');
    setCost('');
    setSelectedVaccines([]);
    setReceiptPhotos([]);
    setIsWriting(false);
    setIsEditing(false);
    setEditingRecord(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  // 기록 상세보기
  if (viewingRecord) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <button
              onClick={() => setViewingRecord(null)}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              ← 목록으로
            </button>
            {viewingRecord.userId === user?.id && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(viewingRecord)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(viewingRecord.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          <div className="mb-4">
            <span className={`inline-block px-4 py-2 rounded-lg font-semibold ${
              viewingRecord.category === '일반 진료'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {viewingRecord.category}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            {viewingRecord.category === '일반 진료' ? '진료 기록' : '백신 접종 기록'}
          </h1>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {viewingRecord.category === '일반 진료' ? '진료 날짜' : '접종 날짜'}
                </p>
                <p className="text-lg font-semibold">{formatDate(viewingRecord.visitDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">병원명</p>
                <p className="text-lg font-semibold">{viewingRecord.hospital}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">안내견</p>
                <p className="text-lg font-semibold">{viewingRecord.dogName}</p>
              </div>
              {viewingRecord.category === '일반 진료' && viewingRecord.cost !== undefined && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">진료비</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(viewingRecord.cost)}
                  </p>
                </div>
              )}
            </div>

            {viewingRecord.category === '일반 진료' && (
              <>
                {viewingRecord.diagnosis && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">진단 내용</p>
                    <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {viewingRecord.diagnosis}
                    </p>
                  </div>
                )}

                {viewingRecord.treatment && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">치료 내용</p>
                    <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {viewingRecord.treatment}
                    </p>
                  </div>
                )}
              </>
            )}

            {viewingRecord.category === '백신 접종' && viewingRecord.vaccines && (
              <div>
                <p className="text-sm text-gray-600 mb-2">접종한 백신</p>
                <div className="flex flex-wrap gap-3">
                  {viewingRecord.vaccines.map((vaccine) => (
                    <span
                      key={vaccine}
                      className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-base font-semibold"
                    >
                      {vaccine}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {viewingRecord.receiptPhotos.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">영수증 사진</p>
                <div className="grid grid-cols-2 gap-4">
                  {viewingRecord.receiptPhotos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`영수증 ${index + 1}`}
                      className="w-full rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500 pt-4 border-t">
              <p>작성자: {viewingRecord.userName}</p>
              <p>작성일: {formatDate(viewingRecord.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 기록 작성/수정 폼
  if (isWriting || isEditing) {
    const vaccineTypes: VaccineType[] = ['DHPPL', '광견병', '켄넬코프', '코로나'];

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {isEditing ? '진료 기록 수정' : '진료 기록 작성'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                카테고리 *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`flex items-center justify-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    category === '일반 진료'
                      ? 'bg-blue-50 border-blue-500'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    checked={category === '일반 진료'}
                    onChange={() => setCategory('일반 진료')}
                    className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-base font-semibold text-gray-800">일반 진료</span>
                </label>
                <label
                  className={`flex items-center justify-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    category === '백신 접종'
                      ? 'bg-green-50 border-green-500'
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    checked={category === '백신 접종'}
                    onChange={() => setCategory('백신 접종')}
                    className="w-5 h-5 text-green-600 focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-base font-semibold text-gray-800">백신 접종</span>
                </label>
              </div>
            </div>

            {/* 공통 필드 */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="visitDate"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  {category === '일반 진료' ? '진료 날짜' : '접종 날짜'} *
                </label>
                <input
                  type="date"
                  id="visitDate"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="hospital"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  병원명 *
                </label>
                <input
                  type="text"
                  id="hospital"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="병원 이름을 입력하세요"
                  required
                />
              </div>
            </div>

            {/* 일반 진료 필드 */}
            {category === '일반 진료' && (
              <>
                <div>
                  <label
                    htmlFor="diagnosis"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    진단 내용 *
                  </label>
                  <textarea
                    id="diagnosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows={4}
                    placeholder="진단받은 내용을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="treatment"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    치료 내용 *
                  </label>
                  <textarea
                    id="treatment"
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows={4}
                    placeholder="받은 치료 내용을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="cost"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    진료비 *
                  </label>
                  <input
                    type="number"
                    id="cost"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="진료비를 입력하세요"
                    min="0"
                    step="1"
                    required
                  />
                </div>
              </>
            )}

            {/* 백신 접종 필드 */}
            {category === '백신 접종' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  접종한 백신 * (복수 선택 가능)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {vaccineTypes.map((vaccine) => (
                    <label
                      key={vaccine}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedVaccines.includes(vaccine)
                          ? 'bg-green-50 border-green-500'
                          : 'border-gray-300 hover:border-green-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedVaccines.includes(vaccine)}
                        onChange={() => handleVaccineToggle(vaccine)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                      />
                      <span className="text-base font-semibold text-gray-800">{vaccine}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 영수증 사진 */}
            <div>
              <label
                htmlFor="photos"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                영수증 사진
              </label>
              <input
                type="file"
                id="photos"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                여러 장의 사진을 업로드할 수 있습니다
              </p>

              {receiptPhotos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {receiptPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`영수증 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                      >
                        ×
                      </button>
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
                작성 완료
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

  // 목록 보기
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">진료 기록</h2>
        {user?.role !== 'admin' && (
          <button
            onClick={() => setIsWriting(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            기록 작성
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500">작성된 기록이 없습니다.</p>
          {user?.role !== 'admin' && (
            <button
              onClick={() => setIsWriting(true)}
              className="mt-4 text-blue-600 hover:text-blue-800 font-semibold"
            >
              첫 기록 작성하기
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <button
                    onClick={() => setViewingRecord(record)}
                    className="text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  >
                    <div className="text-lg font-semibold text-gray-800 mb-2">
                      <span className={`inline-block px-2 py-1 rounded text-sm mr-2 ${
                        record.category === '일반 진료'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {record.category}
                      </span>
                      <span className="text-blue-600 hover:text-blue-800 underline">
                        {record.hospital}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {record.dogName} | {formatDate(record.visitDate)}
                    </p>

                    {record.category === '백신 접종' && record.vaccines && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {record.vaccines.map((vaccine) => (
                          <span
                            key={vaccine}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold"
                          >
                            {vaccine}
                          </span>
                        ))}
                      </div>
                    )}

                    {record.category === '일반 진료' && record.diagnosis && (
                      <p className="text-gray-700 line-clamp-2 mt-2">
                        {record.diagnosis}
                      </p>
                    )}

                    {record.receiptPhotos.length > 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        영수증 사진 {record.receiptPhotos.length}장
                      </p>
                    )}
                  </button>
                </div>
                {record.category === '일반 진료' && record.cost !== undefined && (
                  <p className="text-lg font-semibold text-blue-600 ml-4">
                    {formatCurrency(record.cost)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
