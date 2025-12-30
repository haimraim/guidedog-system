/**
 * 회원 관리 페이지 컴포넌트
 * 관리자가 회원 정보를 조회, 추가, 수정, 삭제할 수 있는 페이지
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { User, UserRole } from '../types/types';
import { getUsers, saveUser, deleteUser } from '../utils/storage';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// 환경변수에서 기본 비밀번호 가져오기
const DEFAULT_PASSWORD = import.meta.env.VITE_LOCAL_AUTH_PASSWORD || '';

interface PartnerInfo {
  id: string;
  name: string;
  phone: string;
  address: string;
  dogName?: string; // 담당 안내견 이름
  category: '퍼피티처' | '안내견파트너' | '은퇴견홈케어' | '부모견홈케어';
  password: string; // 비밀번호
}

export const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [firebaseUsers, setFirebaseUsers] = useState<User[]>([]);
  const [partners, setPartners] = useState<PartnerInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'firebase' | 'users' | 'partners'>('firebase');
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPartner, setEditingPartner] = useState<PartnerInfo | null>(null);

  // 폼 필드
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('partner');
  const [name, setName] = useState('');
  const [dogName, setDogName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadFirebaseUsers();
      loadUsers();
      loadPartners();
    }
  }, [currentUser]);

  // Firebase 사용자 목록 로드
  const loadFirebaseUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const fbUsers: User[] = usersSnapshot.docs.map(doc => ({
        ...doc.data() as User,
        firebaseUid: doc.id,
      }));
      setFirebaseUsers(fbUsers);
    } catch (error) {
      console.error('Firebase 사용자 목록 로드 실패:', error);
      setFirebaseUsers([]);
    }
  };

  // 로컬 스토리지 사용자 목록 로드
  const loadUsers = () => {
    const localUsers = getUsers();

    // 시스템 계정 추가 (하드코딩된 계정들)
    const systemAccounts: User[] = [
      {
        id: 'guidedog',
        role: 'admin',
        name: '관리자 (시스템)',
        password: DEFAULT_PASSWORD,
      },
      {
        id: '박태진',
        role: 'moderator',
        name: '박태진 (시스템)',
        password: DEFAULT_PASSWORD,
      },
    ];

    // 시스템 계정과 로컬 사용자 합치기
    const allUsers = [...systemAccounts, ...localUsers];
    setUsers(allUsers);
  };

  const initializeSampleUsers = () => {
    if (!confirm('샘플 회원 데이터를 추가하시겠습니까?\n이미 등록된 아이디는 건너뜁니다.')) {
      return;
    }

    const sampleUsers: User[] = [
      {
        id: 'puppy_kim',
        password: DEFAULT_PASSWORD,
        role: 'puppyTeacher',
        name: '김민수',
        dogName: '바둑이',
        category: '퍼피티칭',
      },
      {
        id: 'puppy_lee',
        password: DEFAULT_PASSWORD,
        role: 'puppyTeacher',
        name: '이영희',
        dogName: '초코',
        category: '퍼피티칭',
      },
      {
        id: 'partner_park',
        password: DEFAULT_PASSWORD,
        role: 'partner',
        name: '박철수',
        dogName: '루시',
        category: '안내견',
      },
      {
        id: 'partner_choi',
        password: DEFAULT_PASSWORD,
        role: 'partner',
        name: '최지혜',
        dogName: '해피',
        category: '안내견',
      },
      {
        id: 'retired_jung',
        password: DEFAULT_PASSWORD,
        role: 'retiredHomeCare',
        name: '정수진',
        dogName: '노아',
        category: '은퇴견',
      },
      {
        id: 'retired_kang',
        password: DEFAULT_PASSWORD,
        role: 'retiredHomeCare',
        name: '강동원',
        dogName: '벨라',
        category: '은퇴견',
      },
      {
        id: 'parent_han',
        password: DEFAULT_PASSWORD,
        role: 'parentCaregiver',
        name: '한소희',
        dogName: '맥스',
        category: '부모견',
      },
      {
        id: 'parent_yoon',
        password: DEFAULT_PASSWORD,
        role: 'parentCaregiver',
        name: '윤서준',
        dogName: '모카',
        category: '부모견',
      },
    ];

    let addedCount = 0;
    const existingUsers = getUsers();

    sampleUsers.forEach(user => {
      const exists = existingUsers.find(u => u.id === user.id);
      if (!exists) {
        saveUser(user);
        addedCount++;
      }
    });

    loadUsers();
    alert(`${addedCount}개의 샘플 회원이 추가되었습니다.`);
  };

  const loadPartners = () => {
    try {
      const partnersData = JSON.parse(localStorage.getItem('guidedog_partners') || '[]');
      const guideDogs = JSON.parse(localStorage.getItem('guidedog_guidedogs') || '[]');
      const activities = JSON.parse(localStorage.getItem('guidedog_activities') || '[]');
      const passwords = JSON.parse(localStorage.getItem('guidedog_caregiver_passwords') || '{}');

      const allCaregivers: PartnerInfo[] = [];

      // 1. 안내견 파트너 (activities를 통해 연결된 파트너)
      partnersData.forEach((partner: any) => {
        const activity = activities.find((a: any) => a.partnerId === partner.id);
        if (activity) {
          const guideDog = guideDogs.find((d: any) => d.id === activity.guideDogId);
          if (guideDog?.category === '안내견') {
            const caregiverId = `partner_${partner.id}`;
            allCaregivers.push({
              id: caregiverId,
              name: partner.name,
              phone: partner.phone || '',
              address: partner.address || '',
              dogName: guideDog?.name || '',
              category: '안내견파트너',
              password: passwords[caregiverId] || DEFAULT_PASSWORD, // 기본 비밀번호
            });
          }
        }
      });

      // 2. 퍼피티처, 은퇴견홈케어, 부모견홈케어 (guideDogs에서 직접)
      guideDogs.forEach((dog: any) => {
        // 퍼피티처
        if (dog.category === '퍼피티칭' && dog.puppyTeacherName) {
          const caregiverId = `puppy_${dog.id}`;
          allCaregivers.push({
            id: caregiverId,
            name: dog.puppyTeacherName,
            phone: dog.puppyTeacherPhone || '',
            address: dog.puppyTeacherAddress || '',
            dogName: dog.name,
            category: '퍼피티처',
            password: passwords[caregiverId] || DEFAULT_PASSWORD,
          });
        }

        // 은퇴견홈케어
        if (dog.category === '은퇴견' && dog.retiredHomeCareName) {
          const caregiverId = `retired_${dog.id}`;
          allCaregivers.push({
            id: caregiverId,
            name: dog.retiredHomeCareName,
            phone: dog.retiredHomeCarePhone || '',
            address: dog.retiredHomeCareAddress || '',
            dogName: dog.name,
            category: '은퇴견홈케어',
            password: passwords[caregiverId] || DEFAULT_PASSWORD,
          });
        }

        // 부모견홈케어
        if (dog.category === '부모견' && dog.parentCaregiverName) {
          const caregiverId = `parent_${dog.id}`;
          allCaregivers.push({
            id: caregiverId,
            name: dog.parentCaregiverName,
            phone: dog.parentCaregiverPhone || '',
            address: dog.parentCaregiverAddress || '',
            dogName: dog.name,
            category: '부모견홈케어',
            password: passwords[caregiverId] || DEFAULT_PASSWORD,
          });
        }
      });

      setPartners(allCaregivers);
    } catch (error) {
      console.error('Failed to load partners:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId.trim() || !password.trim() || !name.trim()) {
      alert('아이디, 비밀번호, 이름은 필수 입력 항목입니다.');
      return;
    }

    // 신규 회원인 경우 아이디 중복 체크
    if (!editingUser) {
      const existingUser = users.find(u => u.id === userId.trim());
      if (existingUser) {
        alert('이미 존재하는 아이디입니다.');
        return;
      }
    }

    const userData: User = {
      id: userId.trim(),
      password: password.trim(),
      role,
      name: name.trim(),
      dogName: dogName.trim() || undefined,
      createdAt: editingUser?.createdAt,
      updatedAt: new Date().toISOString(),
    };

    saveUser(userData);
    resetForm();
    loadUsers();
    alert(editingUser ? '회원 정보가 수정되었습니다.' : '회원이 등록되었습니다.');
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setUserId(user.id);
    setPassword(user.password || '');
    setRole(user.role);
    setName(user.name);
    setDogName(user.dogName || '');
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (id === 'guidedog') {
      alert('기본 관리자 계정은 삭제할 수 없습니다.');
      return;
    }

    if (confirm('정말 삭제하시겠습니까?')) {
      deleteUser(id);
      loadUsers();
      alert('회원이 삭제되었습니다.');
    }
  };

  const resetForm = () => {
    setUserId('');
    setPassword('');
    setRole('partner');
    setName('');
    setDogName('');
    setPhone('');
    setAddress('');
    setIsEditing(false);
    setEditingUser(null);
    setEditingPartner(null);
  };

  const handleEditPartner = (partner: PartnerInfo) => {
    setEditingPartner(partner);
    setName(partner.name);
    setPhone(partner.phone);
    setAddress(partner.address);
    setPassword(partner.password);
    setDogName(partner.dogName || '');
    setIsEditing(true);
  };

  const handleSubmitPartner = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !password.trim()) {
      alert('이름과 비밀번호는 필수 입력 항목입니다.');
      return;
    }

    if (!editingPartner) return;

    try {
      const guideDogs = JSON.parse(localStorage.getItem('guidedog_guidedogs') || '[]');
      const partnersData = JSON.parse(localStorage.getItem('guidedog_partners') || '[]');
      const passwords = JSON.parse(localStorage.getItem('guidedog_caregiver_passwords') || '{}');

      // 비밀번호 저장
      passwords[editingPartner.id] = password.trim();
      localStorage.setItem('guidedog_caregiver_passwords', JSON.stringify(passwords));

      // 카테고리에 따라 다른 데이터 업데이트
      if (editingPartner.category === '안내견파트너') {
        const partnerId = editingPartner.id.replace('partner_', '');
        const partnerIndex = partnersData.findIndex((p: any) => p.id === partnerId);
        if (partnerIndex !== -1) {
          partnersData[partnerIndex] = {
            ...partnersData[partnerIndex],
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem('guidedog_partners', JSON.stringify(partnersData));
        }
      } else {
        // 퍼피티처, 은퇴견홈케어, 부모견홈케어는 guideDogs 업데이트
        const dogId = editingPartner.id.replace(/^(puppy|retired|parent)_/, '');
        const dogIndex = guideDogs.findIndex((d: any) => d.id === dogId);

        if (dogIndex !== -1) {
          const dog = guideDogs[dogIndex];
          if (editingPartner.category === '퍼피티처') {
            dog.puppyTeacherName = name.trim();
            dog.puppyTeacherPhone = phone.trim();
            dog.puppyTeacherAddress = address.trim();
          } else if (editingPartner.category === '은퇴견홈케어') {
            dog.retiredHomeCareName = name.trim();
            dog.retiredHomeCarePhone = phone.trim();
            dog.retiredHomeCareAddress = address.trim();
          } else if (editingPartner.category === '부모견홈케어') {
            dog.parentCaregiverName = name.trim();
            dog.parentCaregiverPhone = phone.trim();
            dog.parentCaregiverAddress = address.trim();
          }
          dog.updatedAt = new Date().toISOString();
          localStorage.setItem('guidedog_guidedogs', JSON.stringify(guideDogs));
        }
      }

      resetForm();
      loadPartners();
      alert('담당자 정보가 수정되었습니다.');
    } catch (error) {
      console.error('Failed to update partner:', error);
      alert('담당자 정보 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeletePartner = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?\n담당자 정보는 삭제되지만 안내견 정보는 유지됩니다.')) {
      try {
        const guideDogs = JSON.parse(localStorage.getItem('guidedog_guidedogs') || '[]');
        const partnersData = JSON.parse(localStorage.getItem('guidedog_partners') || '[]');
        const activities = JSON.parse(localStorage.getItem('guidedog_activities') || '[]');
        const passwords = JSON.parse(localStorage.getItem('guidedog_caregiver_passwords') || '{}');

        // 비밀번호 삭제
        delete passwords[id];
        localStorage.setItem('guidedog_caregiver_passwords', JSON.stringify(passwords));

        // 카테고리 확인
        if (id.startsWith('partner_')) {
          // 안내견 파트너 삭제
          const partnerId = id.replace('partner_', '');
          const filtered = partnersData.filter((p: any) => p.id !== partnerId);
          localStorage.setItem('guidedog_partners', JSON.stringify(filtered));

          // 관련 활동 삭제
          const filteredActivities = activities.filter((a: any) => a.partnerId !== partnerId);
          localStorage.setItem('guidedog_activities', JSON.stringify(filteredActivities));
        } else {
          // 퍼피티처, 은퇴견홈케어, 부모견홈케어 - 안내견 데이터에서 담당자 정보만 제거
          const dogId = id.replace(/^(puppy|retired|parent)_/, '');
          const dogIndex = guideDogs.findIndex((d: any) => d.id === dogId);

          if (dogIndex !== -1) {
            const dog = guideDogs[dogIndex];
            if (id.startsWith('puppy_')) {
              dog.puppyTeacherName = '';
              dog.puppyTeacherPhone = '';
              dog.puppyTeacherAddress = '';
            } else if (id.startsWith('retired_')) {
              dog.retiredHomeCareName = '';
              dog.retiredHomeCarePhone = '';
              dog.retiredHomeCareAddress = '';
            } else if (id.startsWith('parent_')) {
              dog.parentCaregiverName = '';
              dog.parentCaregiverPhone = '';
              dog.parentCaregiverAddress = '';
            }
            dog.updatedAt = new Date().toISOString();
            localStorage.setItem('guidedog_guidedogs', JSON.stringify(guideDogs));
          }
        }

        loadPartners();
        alert('담당자 정보가 삭제되었습니다.');
      } catch (error) {
        console.error('Failed to delete partner:', error);
        alert('담당자 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleName = (role: UserRole) => {
    const roleNames = {
      admin: '관리자',
      moderator: '준관리자',
      partner: '파트너',
      puppyTeacher: '퍼피티처',
      trainer: '훈련사',
      retiredHomeCare: '은퇴견홈케어',
      parentCaregiver: '부모견홈케어',
    };
    return roleNames[role] || role;
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-neutral-500">관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  // 파트너 정보 수정 폼
  if (isEditing && editingPartner) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-neutral-800 mb-6">
            담당자 정보 수정 ({editingPartner.category})
          </h2>

          <form onSubmit={handleSubmitPartner} className="space-y-6">
            <div>
              <label htmlFor="partnerName" className="block text-sm font-semibold text-neutral-700 mb-2">
                이름 *
              </label>
              <input
                type="text"
                id="partnerName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="담당자 이름"
                required
              />
            </div>

            <div>
              <label htmlFor="partnerPassword" className="block text-sm font-semibold text-neutral-700 mb-2">
                비밀번호 *
              </label>
              <input
                type="text"
                id="partnerPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="비밀번호"
                required
              />
            </div>

            <div>
              <label htmlFor="partnerPhone" className="block text-sm font-semibold text-neutral-700 mb-2">
                연락처
              </label>
              <input
                type="tel"
                id="partnerPhone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="연락처"
              />
            </div>

            <div>
              <label htmlFor="partnerAddress" className="block text-sm font-semibold text-neutral-700 mb-2">
                주소
              </label>
              <textarea
                id="partnerAddress"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="주소"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="partnerDogName" className="block text-sm font-semibold text-neutral-700 mb-2">
                담당 안내견
              </label>
              <input
                type="text"
                id="partnerDogName"
                value={dogName}
                disabled
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-600 cursor-not-allowed"
                placeholder="안내견 관리에서 연결된 안내견"
              />
              <p className="text-xs text-neutral-500 mt-1">
                * 안내견 정보는 안내견 관리 메뉴에서 수정할 수 있습니다
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                수정 완료
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-neutral-500 hover:bg-neutral-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 회원 추가/수정 폼
  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-neutral-800 mb-6">
            {editingUser ? '회원 정보 수정' : '회원 등록'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="userId"
                className="block text-sm font-semibold text-neutral-700 mb-2"
              >
                아이디 *
              </label>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="로그인 아이디"
                required
                disabled={!!editingUser}
              />
              {editingUser && (
                <p className="text-sm text-neutral-500 mt-1">
                  아이디는 수정할 수 없습니다.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-neutral-700 mb-2"
              >
                비밀번호 *
              </label>
              <input
                type="text"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="비밀번호"
                required
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-semibold text-neutral-700 mb-2"
              >
                권한 *
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                required
              >
                <option value="admin">관리자</option>
                <option value="partner">파트너</option>
                <option value="puppyTeacher">퍼피티처</option>
                <option value="trainer">훈련사</option>
                <option value="retiredHomeCare">은퇴견홈케어</option>
                <option value="parentCaregiver">부모견홈케어</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-neutral-700 mb-2"
              >
                이름 *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="사용자 이름"
                required
              />
            </div>

            <div>
              <label
                htmlFor="dogName"
                className="block text-sm font-semibold text-neutral-700 mb-2"
              >
                안내견 이름
              </label>
              <input
                type="text"
                id="dogName"
                value={dogName}
                onChange={(e) => setDogName(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                placeholder="담당 안내견 이름 (선택사항)"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {editingUser ? '수정 완료' : '등록 완료'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-neutral-500 hover:bg-neutral-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 회원 목록
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">회원 관리</h2>
        {activeTab === 'users' && (
          <div className="flex gap-3">
            <button
              onClick={initializeSampleUsers}
              className="bg-success-600 hover:bg-success-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              📝 샘플 데이터 추가
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              회원 등록
            </button>
          </div>
        )}
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b border-neutral-200">
          <button
            onClick={() => setActiveTab('firebase')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'firebase'
                ? 'bg-success-600 text-white border-b-2 border-success-600'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            🔐 Firebase 가입 회원 ({firebaseUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'users'
                ? 'bg-primary-600 text-white border-b-2 border-primary-600'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            시스템 회원 ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('partners')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'partners'
                ? 'bg-primary-600 text-white border-b-2 border-purple-600'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            안내견 담당자 ({partners.length})
          </button>
        </div>
      </div>

      {/* Firebase 가입 회원 목록 */}
      {activeTab === 'firebase' && (
        <>
          {firebaseUsers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-neutral-500">Firebase로 가입한 회원이 없습니다.</p>
              <p className="text-sm text-neutral-400 mt-2">
                회원가입 페이지에서 가입하면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-success-50 border-b border-success-200 px-6 py-3">
                <p className="text-sm text-success-800">
                  🔐 Firebase Authentication으로 가입한 사용자 목록입니다.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">
                        이메일
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">
                        이름
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">
                        권한
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">
                        안내견 이름
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">
                        Firebase UID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {firebaseUsers.map((user) => (
                      <tr key={user.firebaseUid} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 text-sm text-neutral-800 font-semibold">
                          {user.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-800">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-800">
                          <span className="px-3 py-1 bg-success-100 text-success-800 rounded-full text-xs font-semibold">
                            {getRoleName(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600">
                          {user.dogName || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-400 font-mono text-xs">
                          {user.firebaseUid?.substring(0, 8)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* 시스템 회원 목록 */}
      {activeTab === 'users' && (
        <>
          {users.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-neutral-500">등록된 회원이 없습니다.</p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 text-primary-600 hover:text-primary-800 font-semibold"
              >
                첫 회원 등록하기
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">
                        아이디
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">
                        이름
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">
                        권한
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">
                        안내견 이름
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">
                        등록일
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-700">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => {
                      const isSystemAccount = user.id === 'guidedog' || user.id === '박태진';
                      return (
                        <tr key={user.id} className={`hover:bg-neutral-50 ${isSystemAccount ? 'bg-warning-50' : ''}`}>
                          <td className="px-6 py-4 text-sm text-neutral-800">
                            {user.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-neutral-800">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-neutral-800">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              isSystemAccount
                                ? 'bg-warning-100 text-warning-800'
                                : 'bg-primary-100 text-primary-800'
                            }`}>
                              {getRoleName(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-neutral-600">
                            {user.dogName || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-neutral-600">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isSystemAccount ? (
                              <span className="text-xs text-warning-600 font-semibold">시스템 계정</span>
                            ) : (
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => handleEdit(user)}
                                  className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded transition-colors text-sm"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="bg-error-600 hover:bg-error-700 text-white px-3 py-1 rounded transition-colors text-sm"
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* 안내견 관리 파트너 목록 */}
      {activeTab === 'partners' && (
        <>
          {partners.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-neutral-500">등록된 담당자가 없습니다.</p>
              <p className="text-sm text-neutral-400 mt-2">
                안내견 관리 메뉴에서 담당자를 등록하면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 퍼피티처 */}
              {partners.filter(p => p.category === '퍼피티처').length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-primary-600 text-white px-6 py-3">
                    <h3 className="text-lg font-bold">퍼피티처 ({partners.filter(p => p.category === '퍼피티처').length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">이름</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">비밀번호</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">연락처</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">주소</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">담당 안내견</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-700">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {partners.filter(p => p.category === '퍼피티처').map((partner) => (
                          <tr key={partner.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 text-sm text-neutral-800 font-semibold">{partner.name}</td>
                            <td className="px-6 py-4 text-sm text-neutral-800 font-mono">{partner.password}</td>
                            <td className="px-6 py-4 text-sm text-neutral-600">{partner.phone || '-'}</td>
                            <td className="px-6 py-4 text-sm text-neutral-600">{partner.address || '-'}</td>
                            <td className="px-6 py-4 text-sm text-neutral-600">
                              <span className="px-3 py-1 bg-success-100 text-success-800 rounded-full text-xs font-semibold">
                                {partner.dogName}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => handleEditPartner(partner)}
                                  className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded transition-colors text-sm"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDeletePartner(partner.id)}
                                  className="bg-error-600 hover:bg-error-700 text-white px-3 py-1 rounded transition-colors text-sm"
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

              {/* 안내견 파트너 */}
              {partners.filter(p => p.category === '안내견파트너').length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-primary-600 text-white px-6 py-3">
                    <h3 className="text-lg font-bold">안내견 파트너 ({partners.filter(p => p.category === '안내견파트너').length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">이름</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">비밀번호</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">연락처</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">주소</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">담당 안내견</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-700">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {partners.filter(p => p.category === '안내견파트너').map((partner) => (
                          <tr key={partner.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 text-sm text-neutral-800 font-semibold">{partner.name}</td>
                            <td className="px-6 py-4 text-sm text-neutral-800 font-mono">{partner.password}</td>
                            <td className="px-6 py-4 text-sm text-neutral-600">{partner.phone || '-'}</td>
                            <td className="px-6 py-4 text-sm text-neutral-600">{partner.address || '-'}</td>
                            <td className="px-6 py-4 text-sm text-neutral-600">
                              <span className="px-3 py-1 bg-success-100 text-success-800 rounded-full text-xs font-semibold">
                                {partner.dogName}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => handleEditPartner(partner)}
                                  className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded transition-colors text-sm"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDeletePartner(partner.id)}
                                  className="bg-error-600 hover:bg-error-700 text-white px-3 py-1 rounded transition-colors text-sm"
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

              {/* 은퇴견홈케어 */}
              {partners.filter(p => p.category === '은퇴견홈케어').length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-warning-600 text-white px-6 py-3">
                    <h3 className="text-lg font-bold">은퇴견홈케어 ({partners.filter(p => p.category === '은퇴견홈케어').length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">이름</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">비밀번호</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">연락처</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">주소</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">담당 안내견</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-700">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {partners.filter(p => p.category === '은퇴견홈케어').map((partner) => (
                          <tr key={partner.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 text-sm text-neutral-800 font-semibold">{partner.name}</td>
                            <td className="px-6 py-4 text-sm text-neutral-800 font-mono">{partner.password}</td>
                            <td className="px-6 py-4 text-sm text-neutral-600">{partner.phone || '-'}</td>
                            <td className="px-6 py-4 text-sm text-neutral-600">{partner.address || '-'}</td>
                            <td className="px-6 py-4 text-sm text-neutral-600">
                              <span className="px-3 py-1 bg-success-100 text-success-800 rounded-full text-xs font-semibold">
                                {partner.dogName}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => handleEditPartner(partner)}
                                  className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded transition-colors text-sm"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDeletePartner(partner.id)}
                                  className="bg-error-600 hover:bg-error-700 text-white px-3 py-1 rounded transition-colors text-sm"
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

              {/* 부모견홈케어 */}
              {partners.filter(p => p.category === '부모견홈케어').length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-success-600 text-white px-6 py-3">
                    <h3 className="text-lg font-bold">부모견홈케어 ({partners.filter(p => p.category === '부모견홈케어').length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">이름</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">비밀번호</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">연락처</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">주소</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">담당 안내견</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-700">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {partners.filter(p => p.category === '부모견홈케어').map((partner) => (
                          <tr key={partner.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 text-sm text-neutral-800 font-semibold">{partner.name}</td>
                            <td className="px-6 py-4 text-sm text-neutral-800 font-mono">{partner.password}</td>
                            <td className="px-6 py-4 text-sm text-neutral-600">{partner.phone || '-'}</td>
                            <td className="px-6 py-4 text-sm text-neutral-600">{partner.address || '-'}</td>
                            <td className="px-6 py-4 text-sm text-neutral-600">
                              <span className="px-3 py-1 bg-success-100 text-success-800 rounded-full text-xs font-semibold">
                                {partner.dogName}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => handleEditPartner(partner)}
                                  className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded transition-colors text-sm"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDeletePartner(partner.id)}
                                  className="bg-error-600 hover:bg-error-700 text-white px-3 py-1 rounded transition-colors text-sm"
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

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="text-sm text-primary-800">
                  💡 담당자 정보는 안내견 관리 메뉴의 데이터와 동기화됩니다.
                  담당 안내견 정보는 안내견 관리에서 수정할 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
