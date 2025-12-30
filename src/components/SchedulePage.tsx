/**
 * 일정 관리 페이지
 * 파이썬 gdschool-pl 앱의 기능을 웹으로 이식
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { saveSchedule, getSchedules, deleteSchedule } from '../services/firestoreService';
import type { Schedule, ScheduleCategory } from '../types/types';
import { SCHEDULE_SUBCATEGORIES } from '../types/types';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

// 날짜 필터 타입
type DateFilterType = 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'lastYear' | 'custom';

// 초기 폼 데이터
const initialFormData = {
  date: new Date().toISOString().split('T')[0],
  time: '09:00',
  category: '내방' as ScheduleCategory,
  subcategory: '',
  organization: '',
  people: 0,
  manager: '',
  contact: '',
  note: '',
};

export const SchedulePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  // 필터 상태
  const [dateFilter, setDateFilter] = useState<DateFilterType>('thisMonth');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ScheduleCategory | ''>('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 선택 상태
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 데이터 로드
  useEffect(() => {
    loadSchedules();
  }, []);

  // 필터 적용
  useEffect(() => {
    applyFilters();
  }, [schedules, dateFilter, startDate, endDate, categoryFilter, subcategoryFilter, searchKeyword]);

  const loadSchedules = async () => {
    try {
      setIsLoading(true);
      const data = await getSchedules();
      setSchedules(data);
    } catch (err) {
      setError('일정을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...schedules];

    // 날짜 필터
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(s => s.date === today.toISOString().split('T')[0]);
        break;
      case 'thisWeek': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        filtered = filtered.filter(s => {
          const d = new Date(s.date);
          return d >= weekStart && d <= weekEnd;
        });
        break;
      }
      case 'thisMonth': {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        filtered = filtered.filter(s => {
          const d = new Date(s.date);
          return d >= monthStart && d <= monthEnd;
        });
        break;
      }
      case 'thisYear': {
        const yearStart = new Date(today.getFullYear(), 0, 1);
        const yearEnd = new Date(today.getFullYear(), 11, 31);
        filtered = filtered.filter(s => {
          const d = new Date(s.date);
          return d >= yearStart && d <= yearEnd;
        });
        break;
      }
      case 'lastYear': {
        const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
        filtered = filtered.filter(s => {
          const d = new Date(s.date);
          return d >= lastYearStart && d <= lastYearEnd;
        });
        break;
      }
      case 'custom':
        if (startDate && endDate) {
          filtered = filtered.filter(s => s.date >= startDate && s.date <= endDate);
        }
        break;
    }

    // 카테고리 필터
    if (categoryFilter) {
      filtered = filtered.filter(s => s.category === categoryFilter);
    }

    // 서브카테고리 필터
    if (subcategoryFilter) {
      filtered = filtered.filter(s => s.subcategory === subcategoryFilter);
    }

    // 키워드 검색
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(s =>
        s.organization.toLowerCase().includes(keyword) ||
        s.manager.toLowerCase().includes(keyword) ||
        s.note.toLowerCase().includes(keyword)
      );
    }

    // 날짜순 정렬
    filtered.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.time.localeCompare(a.time);
    });

    setFilteredSchedules(filtered);
  };

  // 통계 계산
  const calculateStats = () => {
    const stats = {
      내방: { count: 0, people: 0 },
      외부: { count: 0, people: 0 },
      안내견학교: { count: 0 },
    };

    filteredSchedules.forEach(s => {
      if (s.category === '내방') {
        if (!s.subcategory.includes('기타')) {
          stats.내방.count++;
          stats.내방.people += s.people || 0;
        }
      } else if (s.category === '외부') {
        if (!s.subcategory.includes('기타')) {
          stats.외부.count++;
          stats.외부.people += s.people || 0;
        }
      } else if (s.category === '안내견학교') {
        stats.안내견학교.count++;
      }
    });

    return stats;
  };

  const stats = calculateStats();

  // 폼 핸들러
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // 카테고리 변경 시 서브카테고리 초기화
      if (field === 'category') {
        newData.subcategory = '';
      }
      return newData;
    });
  };

  const handleSubmit = async () => {
    if (!formData.organization.trim()) {
      toast.warning('기관/단체명을 입력해주세요.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const schedule: Schedule = {
        id: editingSchedule?.id || `schedule_${Date.now()}`,
        ...formData,
        people: Number(formData.people) || 0,
        createdAt: editingSchedule?.createdAt || now,
        updatedAt: now,
      };

      await saveSchedule(schedule);
      await loadSchedules();
      closeModal();
      toast.success(editingSchedule ? '일정이 수정되었습니다.' : '일정이 등록되었습니다.');
    } catch (err) {
      toast.error('저장에 실패했습니다.');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;

    try {
      await deleteSchedule(id);
      await loadSchedules();
      toast.success('일정이 삭제되었습니다.');
    } catch (err) {
      toast.error('삭제에 실패했습니다.');
      console.error(err);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      toast.warning('삭제할 일정을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedIds.size}개의 일정을 삭제하시겠습니까?`)) return;

    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteSchedule(id)));
      setSelectedIds(new Set());
      await loadSchedules();
      toast.success(`${selectedIds.size}개의 일정이 삭제되었습니다.`);
    } catch (err) {
      toast.error('삭제에 실패했습니다.');
      console.error(err);
    }
  };

  const handleCopy = (schedule: Schedule) => {
    setFormData({
      date: schedule.date,
      time: schedule.time,
      category: schedule.category,
      subcategory: schedule.subcategory,
      organization: schedule.organization,
      people: schedule.people,
      manager: schedule.manager,
      contact: schedule.contact,
      note: schedule.note,
    });
    setEditingSchedule(null);
    setShowModal(true);
  };

  const openAddModal = () => {
    setFormData(initialFormData);
    setEditingSchedule(null);
    setShowModal(true);
  };

  const openEditModal = (schedule: Schedule) => {
    setFormData({
      date: schedule.date,
      time: schedule.time,
      category: schedule.category,
      subcategory: schedule.subcategory,
      organization: schedule.organization,
      people: schedule.people,
      manager: schedule.manager,
      contact: schedule.contact,
      note: schedule.note,
    });
    setEditingSchedule(schedule);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData(initialFormData);
  };

  // 모달 포커스 트랩
  useEffect(() => {
    if (showModal && modalRef.current) {
      const firstInput = modalRef.current.querySelector('input, select, textarea, button') as HTMLElement;
      firstInput?.focus();

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeModal();
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showModal]);

  // Excel 내보내기
  const handleExportExcel = () => {
    if (filteredSchedules.length === 0) {
      toast.warning('내보낼 데이터가 없습니다.');
      return;
    }

    const excelData = filteredSchedules.map((s) => ({
      '날짜': s.date,
      '구분': s.category,
      '세부구분': s.subcategory,
      '기관명': s.organization,
      '시간': s.time,
      '인원': s.people,
      '담당자': s.manager,
      '연락처': s.contact,
      '기타': s.note,
    }));

    // 통계 추가
    excelData.push({} as any);
    excelData.push({ '날짜': '[통계]' } as any);
    excelData.push({ '날짜': `내방(기타제외): ${stats.내방.count}회 / ${stats.내방.people}명` } as any);
    excelData.push({ '날짜': `외부(기타제외): ${stats.외부.count}회 / ${stats.외부.people}명` } as any);
    excelData.push({ '날짜': `안내견학교: ${stats.안내견학교.count}회` } as any);

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 8 },
      { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 30 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '일정');

    const fileName = `일정_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Word 통계 내보내기
  const handleExportWord = async () => {
    // 카테고리별 상세 통계 계산
    const detailedStats: Record<string, Record<string, { count: number; people: number }>> = {
      '내방': {},
      '외부': {},
      '안내견학교': {},
    };

    filteredSchedules.forEach(s => {
      if (!detailedStats[s.category][s.subcategory]) {
        detailedStats[s.category][s.subcategory] = { count: 0, people: 0 };
      }
      detailedStats[s.category][s.subcategory].count++;
      detailedStats[s.category][s.subcategory].people += s.people || 0;
    });

    // 기간 텍스트
    let periodText = '';
    switch (dateFilter) {
      case 'today': periodText = '오늘'; break;
      case 'thisWeek': periodText = '이번 주'; break;
      case 'thisMonth': periodText = '이번 달'; break;
      case 'thisYear': periodText = '올해'; break;
      case 'lastYear': periodText = '작년'; break;
      case 'custom': periodText = `${startDate} ~ ${endDate}`; break;
      default: periodText = '전체';
    }

    // 테이블 행 생성 함수
    const createTableRow = (cells: string[], isHeader = false) => {
      return new TableRow({
        children: cells.map(text => new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text, bold: isHeader, size: 22 })],
            alignment: AlignmentType.CENTER,
          })],
          width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
        })),
      });
    };

    // 카테고리별 테이블 생성
    const createCategoryTable = (category: string, showPeople: boolean) => {
      const subcats = detailedStats[category];
      const rows = [
        createTableRow(showPeople ? ['세부분류', '건수', '인원'] : ['세부분류', '건수'], true),
      ];

      let totalCount = 0;
      let totalPeople = 0;

      Object.entries(subcats).forEach(([subcat, data]) => {
        rows.push(createTableRow(
          showPeople
            ? [subcat || '(미분류)', String(data.count), String(data.people)]
            : [subcat || '(미분류)', String(data.count)]
        ));
        totalCount += data.count;
        totalPeople += data.people;
      });

      // 합계 (기타 제외)
      let totalCountExcludeEtc = 0;
      let totalPeopleExcludeEtc = 0;
      Object.entries(subcats).forEach(([subcat, data]) => {
        if (!subcat.includes('기타')) {
          totalCountExcludeEtc += data.count;
          totalPeopleExcludeEtc += data.people;
        }
      });

      rows.push(createTableRow(
        showPeople
          ? ['합계', String(totalCount), String(totalPeople)]
          : ['합계', String(totalCount)]
      ));

      if (showPeople) {
        rows.push(createTableRow(['합계(기타제외)', String(totalCountExcludeEtc), String(totalPeopleExcludeEtc)]));
      }

      return new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      });
    };

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [new TextRun({ text: '일정 통계 보고서', bold: true, size: 36 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `기간: ${periodText}`, size: 24 })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `생성일: ${new Date().toLocaleDateString('ko-KR')}`, size: 24 })],
            spacing: { after: 400 },
          }),

          // 요약
          new Paragraph({
            children: [new TextRun({ text: '요약', bold: true, size: 28 })],
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `• 내방: ${stats.내방.count}건 / ${stats.내방.people}명 (기타 제외)`, size: 24 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `• 외부: ${stats.외부.count}건 / ${stats.외부.people}명 (기타 제외)`, size: 24 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `• 안내견학교: ${stats.안내견학교.count}건`, size: 24 })],
            spacing: { after: 400 },
          }),

          // 내방 상세
          new Paragraph({
            children: [new TextRun({ text: '내방 상세', bold: true, size: 28 })],
            spacing: { before: 400, after: 200 },
          }),
          createCategoryTable('내방', true),

          // 외부 상세
          new Paragraph({
            children: [new TextRun({ text: '외부 상세', bold: true, size: 28 })],
            spacing: { before: 400, after: 200 },
          }),
          createCategoryTable('외부', true),

          // 안내견학교 상세
          new Paragraph({
            children: [new TextRun({ text: '안내견학교 상세', bold: true, size: 28 })],
            spacing: { before: 400, after: 200 },
          }),
          createCategoryTable('안내견학교', false),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `일정통계_${new Date().toISOString().split('T')[0]}.docx`);
  };

  // Excel 가져오기
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 확장자 검사
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      toast.error('Excel 파일(.xlsx, .xls)만 가져올 수 있습니다.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const now = new Date().toISOString();
        let imported = 0;

        for (const row of jsonData) {
          // 통계 행이거나 기관명이 없으면 건너뛰기
          const orgName = row['기관명'] || row['기관/단체명'] || '';
          if (!orgName || String(row['날짜']).includes('[통계]')) continue;

          const schedule: Schedule = {
            id: `schedule_${Date.now()}_${imported}`,
            date: String(row['날짜'] || ''),
            time: String(row['시간'] || ''),
            category: (row['구분'] || row['분류'] || '내방') as ScheduleCategory,
            subcategory: String(row['세부구분'] || row['세부분류'] || ''),
            organization: String(orgName),
            people: Number(row['인원']) || 0,
            manager: String(row['담당자'] || ''),
            contact: String(row['연락처'] || ''),
            note: String(row['기타'] || row['비고'] || ''),
            createdAt: now,
            updatedAt: now,
          };

          await saveSchedule(schedule);
          imported++;
        }

        toast.success(`${imported}건의 일정을 가져왔습니다.`);
        await loadSchedules();
      } catch (err) {
        toast.error('엑셀 파일을 읽는 중 오류가 발생했습니다.');
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // 선택 토글
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSchedules.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSchedules.map(s => s.id)));
    }
  };

  // 필터 초기화
  const resetFilters = () => {
    setDateFilter('thisMonth');
    setStartDate('');
    setEndDate('');
    setCategoryFilter('');
    setSubcategoryFilter('');
    setSearchKeyword('');
  };

  // 오늘 날짜 체크
  const isToday = (date: string) => {
    return date === new Date().toISOString().split('T')[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-neutral-600">일정을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-neutral-800">일정 관리</h1>
          <div className="flex gap-2">
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
            >
              + 일정 추가
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 font-semibold"
            >
              Excel 내보내기
            </button>
            <button
              onClick={handleExportWord}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Word 통계
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 font-semibold"
            >
              Excel 가져오기
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="hidden"
              aria-hidden="true"
            />
            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              >
                선택 삭제 ({selectedIds.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-bold text-neutral-800 mb-4">필터</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* 날짜 필터 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">기간</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">전체</option>
              <option value="today">오늘</option>
              <option value="thisWeek">이번 주</option>
              <option value="thisMonth">이번 달</option>
              <option value="thisYear">올해</option>
              <option value="lastYear">작년</option>
              <option value="custom">기간 선택</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">시작일</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">종료일</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </>
          )}

          {/* 카테고리 필터 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">분류</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as ScheduleCategory | '');
                setSubcategoryFilter('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">전체</option>
              <option value="내방">내방</option>
              <option value="외부">외부</option>
              <option value="안내견학교">안내견학교</option>
            </select>
          </div>

          {/* 서브카테고리 필터 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">세부분류</label>
            <select
              value={subcategoryFilter}
              onChange={(e) => setSubcategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              disabled={!categoryFilter}
            >
              <option value="">전체</option>
              {categoryFilter && SCHEDULE_SUBCATEGORIES[categoryFilter].map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* 검색어 */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">검색어</label>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="기관명, 담당자, 비고"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-neutral-500 text-white rounded-lg hover:bg-neutral-600"
          >
            필터 초기화
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-bold text-neutral-800">내방</h3>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {stats.내방.count}건 / {stats.내방.people}명
          </p>
          <p className="text-sm text-neutral-500">(기타 제외)</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-bold text-neutral-800">외부</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {stats.외부.count}건 / {stats.외부.people}명
          </p>
          <p className="text-sm text-neutral-500">(기타 제외)</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-bold text-neutral-800">안내견학교</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {stats.안내견학교.count}건
          </p>
        </div>
      </div>

      {/* 일정 테이블 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b-2 border-gray-300">
          <p className="text-sm text-neutral-600 font-semibold">
            총 {filteredSchedules.length}건 (전체 {schedules.length}건)
          </p>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-primary-600 text-white">
                <th className="px-3 py-3 text-left border-b-2 border-primary-700">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredSchedules.length && filteredSchedules.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4"
                    aria-label="전체 선택"
                  />
                </th>
                <th className="px-3 py-3 text-left border-b-2 border-primary-700 font-bold">번호</th>
                <th className="px-3 py-3 text-left border-b-2 border-primary-700 font-bold">날짜</th>
                <th className="px-3 py-3 text-left border-b-2 border-primary-700 font-bold">시간</th>
                <th className="px-3 py-3 text-left border-b-2 border-primary-700 font-bold">분류</th>
                <th className="px-3 py-3 text-left border-b-2 border-primary-700 font-bold">세부분류</th>
                <th className="px-3 py-3 text-left border-b-2 border-primary-700 font-bold">기관명</th>
                <th className="px-3 py-3 text-left border-b-2 border-primary-700 font-bold">인원</th>
                <th className="px-3 py-3 text-left border-b-2 border-primary-700 font-bold">담당자/연락처</th>
                <th className="px-3 py-3 text-left border-b-2 border-primary-700 font-bold">비고</th>
                <th className="px-3 py-3 text-left border-b-2 border-primary-700 font-bold">액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((schedule, index) => (
                <tr
                  key={schedule.id}
                  className={`
                    ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-100'}
                    ${isToday(schedule.date) ? '!bg-yellow-200' : ''}
                    hover:bg-blue-50 transition-colors
                  `}
                >
                  <td className="px-3 py-3 border-b border-gray-300">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(schedule.id)}
                      onChange={() => toggleSelect(schedule.id)}
                      className="w-4 h-4"
                      aria-label={`${schedule.organization} 선택`}
                    />
                  </td>
                  <td className="px-3 py-3 border-b border-gray-300 text-center font-medium">{index + 1}</td>
                  <td className={`px-3 py-3 border-b border-gray-300 ${isToday(schedule.date) ? 'font-bold text-orange-600' : ''}`}>
                    {schedule.date}
                  </td>
                  <td className="px-3 py-3 border-b border-gray-300">{schedule.time}</td>
                  <td className="px-3 py-3 border-b border-gray-300">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      schedule.category === '내방' ? 'bg-blue-200 text-blue-900 border border-blue-400' :
                      schedule.category === '외부' ? 'bg-green-200 text-green-900 border border-green-400' :
                      'bg-purple-200 text-purple-900 border border-purple-400'
                    }`}>
                      {schedule.category}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-b border-gray-300">
                    <span className="px-2 py-1 bg-amber-100 text-amber-900 rounded font-semibold text-sm border border-amber-300">
                      {schedule.subcategory || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-b border-gray-300 font-bold text-neutral-800">{schedule.organization}</td>
                  <td className="px-3 py-3 border-b border-gray-300 text-center font-semibold">{schedule.people}</td>
                  <td className="px-3 py-3 border-b border-gray-300">
                    <span className="font-semibold">{schedule.manager}</span>
                    {schedule.contact && <span className="text-neutral-500 ml-1">({schedule.contact})</span>}
                  </td>
                  <td className="px-3 py-3 border-b border-gray-300 text-sm text-neutral-600 max-w-[200px] truncate" title={schedule.note}>
                    {schedule.note}
                  </td>
                  <td className="px-3 py-3 border-b border-gray-300">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(schedule)}
                        className="px-2 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 font-semibold"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleCopy(schedule)}
                        className="px-2 py-1 bg-neutral-600 text-white rounded text-sm hover:bg-neutral-700 font-semibold"
                      >
                        복사
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-semibold"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSchedules.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-neutral-500">
                    일정이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 추가/수정 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
        >
          <div
            ref={modalRef}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-neutral-200 p-4 flex justify-between items-center">
              <h2 id="schedule-modal-title" className="text-xl font-bold">
                {editingSchedule ? '일정 수정' : '일정 추가'}
              </h2>
              <button
                onClick={closeModal}
                className="text-2xl text-neutral-500 hover:text-neutral-700"
                aria-label="닫기"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    날짜 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    시간
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    분류 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="내방">내방</option>
                    <option value="외부">외부</option>
                    <option value="안내견학교">안내견학교</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    세부분류
                  </label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">선택</option>
                    {SCHEDULE_SUBCATEGORIES[formData.category].map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">
                  기관/단체명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                  placeholder="기관/단체명을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    인원
                  </label>
                  <input
                    type="number"
                    value={formData.people}
                    onChange={(e) => handleInputChange('people', e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    담당자
                  </label>
                  <input
                    type="text"
                    value={formData.manager}
                    onChange={(e) => handleInputChange('manager', e.target.value)}
                    placeholder="담당자명"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">
                    연락처
                  </label>
                  <input
                    type="text"
                    value={formData.contact}
                    onChange={(e) => handleInputChange('contact', e.target.value)}
                    placeholder="연락처"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">
                  비고
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => handleInputChange('note', e.target.value)}
                  placeholder="메모"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-400"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
                >
                  {editingSchedule ? '수정' : '추가'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
