/**
 * 진료 기록 페이지 컴포넌트
 * 일반 진료와 백신 접종 기록을 통합 관리
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getGuideDogs } from '../utils/storage';
import type { MedicalRecord, MedicalRecordCategory, VaccineType, GuideDog } from '../types/types';
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
    records.unshift(record);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const deleteMedicalRecord = (id: string): void => {
  const records = getMedicalRecords().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

type AdminView = 'general' | 'vaccine';
type CategoryFilter = '안내견' | '퍼피' | '은퇴견' | '부모견';

export const MedicalRecordPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | null>(null);

  // 관리자 전용 상태
  const [adminView, setAdminView] = useState<AdminView>('general');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('안내견');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // 폼 필드
  const [category, setCategory] = useState<MedicalRecordCategory>('일반 진료');
  const [visitDate, setVisitDate] = useState('');
  const [hospital, setHospital] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [cost, setCost] = useState('');
  const [selectedVaccines, setSelectedVaccines] = useState<VaccineType[]>([]);
  const [notes, setNotes] = useState('');
  const [receiptPhotos, setReceiptPhotos] = useState<string[]>([]);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const allRecords = getMedicalRecords();

    if (user?.role === 'admin') {
      setRecords(allRecords);
      return;
    }

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

  const setTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setVisitDate(`${year}-${month}-${day}`);
  };

  const setYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    setVisitDate(`${year}-${month}-${day}`);
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
    setNotes(record.notes || '');
    setReceiptPhotos(record.receiptPhotos);
    setViewingRecord(null);
    setIsWriting(true);
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
      notes: category === '백신 접종' && notes ? notes : undefined,
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
    setNotes('');
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

  // 카테고리별 안내견 목록 가져오기
  const getDogsByCategory = (category: CategoryFilter): GuideDog[] => {
    const allDogs = getGuideDogs();

    switch (category) {
      case '안내견':
        return allDogs.filter(dog =>
          dog.category === '안내견' ||
          dog.category === '안내견/폐사' ||
          dog.category === '안내견/일반안내견/기타'
        );
      case '퍼피':
        return allDogs.filter(dog => dog.category === '퍼피티칭');
      case '은퇴견':
        return allDogs.filter(dog => dog.category === '은퇴견');
      case '부모견':
        return allDogs.filter(dog => dog.category === '부견' || dog.category === '모견');
      default:
        return [];
    }
  };

  // 백신 접종 현황 테이블 데이터
  const getVaccineTableData = () => {
    const dogs = getDogsByCategory(selectedCategory);
    const vaccineTypes: VaccineType[] = ['DHPPL', '광견병', '켄넬코프', '코로나', '인플루엔자'];

    return dogs.map(dog => {
      const dogRecords = records.filter(r =>
        r.dogName === dog.name &&
        r.category === '백신 접종' &&
        new Date(r.visitDate).getFullYear() === selectedYear
      );

      const vaccineData = vaccineTypes.map(vaccineType => {
        const vaccineRecords = dogRecords.filter(r =>
          r.vaccines?.includes(vaccineType)
        );

        return {
          vaccineType,
          records: vaccineRecords.map(r => ({
            date: formatDate(r.visitDate),
            hospital: r.hospital,
          })),
        };
      });

      return {
        dogName: dog.name,
        vaccines: vaccineData,
      };
    });
  };

  // 기록 작성 폼
  if (isWriting) {
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
                <label className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  category === '일반 진료'
                    ? 'bg-blue-50 border-blue-500'
                    : 'border-gray-300 hover:border-blue-300'
                }`}>
                  <input
                    type="radio"
                    name="category"
                    value="일반 진료"
                    checked={category === '일반 진료'}
                    onChange={(e) => setCategory(e.target.value as MedicalRecordCategory)}
                    className="sr-only"
                  />
                  <div className="font-semibold text-center">일반 진료</div>
                </label>
                <label className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  category === '백신 접종'
                    ? 'bg-green-50 border-green-500'
                    : 'border-gray-300 hover:border-green-300'
                }`}>
                  <input
                    type="radio"
                    name="category"
                    value="백신 접종"
                    checked={category === '백신 접종'}
                    onChange={(e) => setCategory(e.target.value as MedicalRecordCategory)}
                    className="sr-only"
                  />
                  <div className="font-semibold text-center">백신 접종</div>
                </label>
              </div>
            </div>

            {/* 날짜 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {category === '일반 진료' ? '진료 날짜' : '접종 날짜'} *
              </label>
              {category === '백신 접종' && (
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <button
                    type="button"
                    onClick={setTodayDate}
                    className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold rounded-lg transition-colors border-2 border-blue-300"
                  >
                    오늘
                  </button>
                  <button
                    type="button"
                    onClick={setYesterdayDate}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors border-2 border-gray-300"
                  >
                    어제
                  </button>
                </div>
              )}
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            {/* 병원명 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                병원명 *
              </label>
              <input
                type="text"
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="병원 이름을 입력하세요"
                required
              />
            </div>

            {/* 일반 진료 필드 */}
            {category === '일반 진료' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    진단 내용 *
                  </label>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows={4}
                    placeholder="진단 내용을 입력하세요"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    치료 내용 *
                  </label>
                  <textarea
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows={4}
                    placeholder="치료 내용을 입력하세요"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    진료비 *
                  </label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="금액을 입력하세요"
                    required
                  />
                </div>
              </>
            )}

            {/* 백신 접종 필드 */}
            {category === '백신 접종' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    접종한 백신 *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['DHPPL', '광견병', '켄넬코프', '코로나', '인플루엔자'] as VaccineType[]).map(vaccine => (
                      <label
                        key={vaccine}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedVaccines.includes(vaccine)
                            ? 'bg-green-50 border-green-500'
                            : 'border-gray-300 hover:border-green-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedVaccines.includes(vaccine)}
                          onChange={() => handleVaccineToggle(vaccine)}
                          className="sr-only"
                        />
                        <div className="font-semibold text-center">{vaccine}</div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 참고사항 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    참고사항
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="백신 접종과 관련된 추가 정보를 입력하세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  />
                </div>
              </>
            )}

            {/* 영수증 사진 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                영수증 사진
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {receiptPhotos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {receiptPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`영수증 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
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
                {isEditing ? '수정하기' : '저장하기'}
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

            {viewingRecord.category === '백신 접종' && (
              <>
                {viewingRecord.vaccines && (
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
                {viewingRecord.notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">참고사항</p>
                    <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                      {viewingRecord.notes}
                    </p>
                  </div>
                )}
              </>
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
                      className="w-full rounded-lg shadow-md cursor-pointer hover:opacity-90"
                      onClick={() => window.open(photo, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 관리자 화면
  if (user?.role === 'admin') {
    const vaccineTableData = adminView === 'vaccine' ? getVaccineTableData() : [];

    return (
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">진료 기록 관리 (관리자)</h2>

        {/* 하위 메뉴 */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setAdminView('general')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                adminView === 'general'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              일반 진료
            </button>
            <button
              onClick={() => setAdminView('vaccine')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                adminView === 'vaccine'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              백신 접종
            </button>
          </div>
        </div>

        {/* 일반 진료 뷰 */}
        {adminView === 'general' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">일반 진료 기록 목록</h3>
            {records.filter(r => r.category === '일반 진료').length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                진료 기록이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {records
                  .filter(r => r.category === '일반 진료')
                  .map(record => (
                    <div
                      key={record.id}
                      className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setViewingRecord(record)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-bold text-gray-800">
                            {record.dogName} - {record.userName}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(record.visitDate)} | {record.hospital}
                          </p>
                        </div>
                        {record.cost !== undefined && (
                          <span className="text-lg font-semibold text-blue-600">
                            {formatCurrency(record.cost)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* 백신 접종 뷰 */}
        {adminView === 'vaccine' && (
          <>
            {/* 필터 섹션 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">필터</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    카테고리
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as CategoryFilter)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="안내견">안내견</option>
                    <option value="퍼피">퍼피</option>
                    <option value="은퇴견">은퇴견</option>
                    <option value="부모견">부모견</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    년도
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {[2025, 2024, 2023, 2022, 2021].map(year => (
                      <option key={year} value={year}>{year}년</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 백신 접종 현황 테이블 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {selectedCategory} - {selectedYear}년 백신 접종 현황
              </h3>
              {vaccineTableData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  해당 카테고리에 안내견이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800">
                          견명
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800">
                          DHPPL
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800">
                          광견병
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800">
                          켄넬코프
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800">
                          코로나
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800">
                          인플루엔자
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {vaccineTableData.map((row) => (
                        <tr key={row.dogName} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-800">
                            {row.dogName}
                          </td>
                          {row.vaccines.map((vaccine, idx) => (
                            <td
                              key={idx}
                              className={`border border-gray-300 px-4 py-3 text-center ${
                                vaccine.records.length > 0 ? 'bg-green-50' : 'bg-gray-50'
                              }`}
                            >
                              {vaccine.records.length > 0 ? (
                                <div className="space-y-1">
                                  {vaccine.records.map((record, recIdx) => (
                                    <div key={recIdx} className="text-xs">
                                      <div className="font-semibold text-green-600">{record.date}</div>
                                      <div className="text-gray-600">{record.hospital}</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // 일반 사용자 메인 화면
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">진료 기록</h2>
        <button
          onClick={() => setIsWriting(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          기록 작성
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">나의 진료 기록</h3>
        {records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>진료 기록이 없습니다.</p>
            <button
              onClick={() => setIsWriting(true)}
              className="mt-4 text-blue-600 hover:text-blue-800 font-semibold"
            >
              첫 기록 작성하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map(record => (
              <div
                key={record.id}
                className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setViewingRecord(record)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    record.category === '일반 진료'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {record.category}
                  </span>
                  {record.category === '일반 진료' && record.cost !== undefined && (
                    <span className="text-lg font-semibold text-blue-600">
                      {formatCurrency(record.cost)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {formatDate(record.visitDate)} | {record.hospital}
                </p>
                {record.category === '백신 접종' && record.vaccines && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {record.vaccines.map(vaccine => (
                      <span
                        key={vaccine}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold"
                      >
                        {vaccine}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
