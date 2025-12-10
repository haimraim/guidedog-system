/**
 * 메시지 발송 페이지
 * 관리자가 회원들에게 SMS/카카오 알림톡을 발송하는 페이지
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { MessageRecipient, MessageType, User, UserRole } from '../types/types';
import { getUsers, getGuideDogs, getPartners, getActivities } from '../utils/storage';
import { sendSMS, sendAlimtalk, replaceMessageVariables, validatePhoneNumber } from '../services/naverSensService';

export const MessageSendPage = () => {
  const { user: currentUser } = useAuth();
  const [messageType, setMessageType] = useState<MessageType>('sms');
  const [subject, setSubject] = useState(''); // LMS 제목
  const [message, setMessage] = useState('');
  const [templateCode, setTemplateCode] = useState(''); // 카카오 알림톡 템플릿 코드

  // 수신자 선택
  const [selectMode, setSelectMode] = useState<'all' | 'role' | 'custom'>('all');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [allRecipients, setAllRecipients] = useState<MessageRecipient[]>([]);

  // 발송 상태
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<string>('');

  // 미리보기
  const [previewMessage, setPreviewMessage] = useState('');

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadAllRecipients();
    }
  }, [currentUser]);

  // 메시지 미리보기 업데이트
  useEffect(() => {
    if (allRecipients.length > 0 && message) {
      const sampleRecipient = allRecipients[0];
      const preview = replaceMessageVariables(message, {
        name: sampleRecipient.userName,
        dogName: sampleRecipient.dogName || '안내견',
        date: new Date().toLocaleDateString('ko-KR'),
      });
      setPreviewMessage(preview);
    } else {
      setPreviewMessage(message);
    }
  }, [message, allRecipients]);

  /**
   * 모든 수신자 목록 로드
   */
  const loadAllRecipients = () => {
    const recipients: MessageRecipient[] = [];

    // 1. localStorage 사용자
    const users = getUsers();
    users.forEach(user => {
      if (user.password) { // 비밀번호가 있는 사용자만
        recipients.push({
          userId: user.id,
          userName: user.name,
          phone: '', // 연락처 필요
          dogName: user.dogName,
          role: user.role,
        });
      }
    });

    // 2. 안내견 담당자 (파트너, 퍼피티처, 은퇴견홈케어, 부모견홈케어)
    const dogs = getGuideDogs();
    const partners = getPartners();
    const activities = getActivities();

    // 퍼피티처
    dogs.forEach(dog => {
      if (dog.category === '퍼피티칭' && dog.puppyTeacherName && dog.puppyTeacherPhone) {
        recipients.push({
          userId: `puppy_${dog.id}`,
          userName: dog.puppyTeacherName,
          phone: dog.puppyTeacherPhone,
          dogName: dog.name,
          role: 'puppyTeacher',
        });
      }

      // 은퇴견홈케어
      if (dog.category === '은퇴견' && dog.retiredHomeCareName && dog.retiredHomeCarePhone) {
        recipients.push({
          userId: `retired_${dog.id}`,
          userName: dog.retiredHomeCareName,
          phone: dog.retiredHomeCarePhone,
          dogName: dog.name,
          role: 'retiredHomeCare',
        });
      }

      // 부모견홈케어
      if ((dog.category === '부견' || dog.category === '모견') && dog.parentCaregiverName && dog.parentCaregiverPhone) {
        recipients.push({
          userId: `parent_${dog.id}`,
          userName: dog.parentCaregiverName,
          phone: dog.parentCaregiverPhone,
          dogName: dog.name,
          role: 'parentCaregiver',
        });
      }
    });

    // 안내견 파트너
    partners.forEach(partner => {
      if (partner.phone) {
        const activity = activities.find(a => a.partnerId === partner.id);
        if (activity) {
          const dog = dogs.find(d => d.id === activity.guideDogId);
          if (dog?.category === '안내견') {
            recipients.push({
              userId: `partner_${partner.id}`,
              userName: partner.name,
              phone: partner.phone,
              dogName: dog.name,
              role: 'partner',
            });
          }
        }
      }
    });

    // 연락처가 있는 수신자만 필터링 및 중복 제거
    const uniqueRecipients = recipients.filter(r =>
      r.phone && validatePhoneNumber(r.phone)
    );

    setAllRecipients(uniqueRecipients);
  };

  /**
   * 필터링된 수신자 목록 가져오기
   */
  const getFilteredRecipients = (): MessageRecipient[] => {
    if (selectMode === 'all') {
      return allRecipients;
    }

    if (selectMode === 'role' && selectedRole) {
      return allRecipients.filter(r => r.role === selectedRole);
    }

    if (selectMode === 'custom') {
      return allRecipients.filter(r => selectedRecipients.has(r.userId));
    }

    return [];
  };

  /**
   * 수신자 선택/해제
   */
  const toggleRecipient = (userId: string) => {
    const newSelected = new Set(selectedRecipients);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedRecipients(newSelected);
  };

  /**
   * 메시지 발송
   */
  const handleSend = async () => {
    try {
      if (!message.trim()) {
        alert('메시지 내용을 입력해주세요.');
        return;
      }

      const recipients = getFilteredRecipients();

      if (recipients.length === 0) {
        alert('수신자를 선택해주세요.');
        return;
      }

      // 연락처 없는 수신자 확인
      const invalidRecipients = recipients.filter(r => !validatePhoneNumber(r.phone));
      if (invalidRecipients.length > 0) {
        alert(`올바르지 않은 연락처가 있습니다:\n${invalidRecipients.map(r => `${r.userName}: ${r.phone}`).join('\n')}`);
        return;
      }

      if (!confirm(`${recipients.length}명에게 메시지를 발송하시겠습니까?`)) {
        return;
      }

      setIsSending(true);
      setSendResult('');

      // 메시지 발송
      if (messageType === 'kakao') {
        if (!templateCode.trim()) {
          alert('카카오 알림톡 템플릿 코드를 입력해주세요.');
          setIsSending(false);
          return;
        }

        const result = await sendAlimtalk({
          receivers: recipients,
          templateCode,
          content: message,
        });

        setSendResult(`✅ 발송 완료!\n요청 ID: ${result.requestId}\n상태: ${result.statusName}`);
      } else {
        // SMS 또는 LMS
        const result = await sendSMS({
          receivers: recipients,
          message,
          subject: messageType === 'lms' ? subject : undefined,
          msgType: messageType === 'lms' ? 'LMS' : 'SMS',
        });

        setSendResult(`✅ 발송 완료!\n요청 ID: ${result.requestId}\n상태: ${result.statusName}`);
      }

      // 발송 후 초기화
      setMessage('');
      setSubject('');
      setSelectedRecipients(new Set());
    } catch (error: any) {
      console.error('메시지 발송 실패:', error);
      setSendResult(`❌ 발송 실패: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  /**
   * 템플릿 삽입
   */
  const insertTemplate = (template: string) => {
    setMessage(template);
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
          <p className="text-gray-500">관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  const filteredRecipients = getFilteredRecipients();

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">메시지 발송</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 메시지 작성 */}
        <div className="space-y-6">
          {/* 메시지 타입 선택 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">메시지 타입</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setMessageType('sms')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                  messageType === 'sms'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                SMS (단문)
              </button>
              <button
                onClick={() => setMessageType('lms')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                  messageType === 'lms'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                LMS (장문)
              </button>
              <button
                onClick={() => setMessageType('kakao')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                  messageType === 'kakao'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                카카오 알림톡
              </button>
            </div>
          </div>

          {/* 템플릿 선택 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">템플릿</h3>
            <div className="space-y-2">
              <button
                onClick={() => insertTemplate('{name}님, {dogName}의 보딩이 {date}에 시작됩니다. 준비물을 확인해주세요.')}
                className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm"
              >
                보딩 시작 알림
              </button>
              <button
                onClick={() => insertTemplate('{name}님, {dogName}의 보딩이 곧 종료됩니다. {date}에 픽업 가능합니다.')}
                className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm"
              >
                보딩 종료 알림
              </button>
              <button
                onClick={() => insertTemplate('안녕하세요. {date} 일정 안내드립니다. 자세한 내용은 홈페이지를 확인해주세요.')}
                className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm"
              >
                일정 공지
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              사용 가능한 변수: {'{name}'} (이름), {'{dogName}'} (안내견 이름), {'{date}'} (오늘 날짜)
            </p>
          </div>

          {/* 메시지 작성 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">메시지 내용</h3>

            {messageType === 'kakao' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  템플릿 코드
                </label>
                <input
                  type="text"
                  value={templateCode}
                  onChange={(e) => setTemplateCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="알림톡 템플릿 코드 입력"
                />
              </div>
            )}

            {messageType === 'lms' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="메시지 제목"
                  maxLength={40}
                />
              </div>
            )}

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              rows={8}
              placeholder="메시지 내용을 입력하세요..."
              maxLength={messageType === 'sms' ? 90 : 2000}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                {message.length} / {messageType === 'sms' ? '90' : '2000'}자
              </p>
              <p className="text-xs text-gray-500">
                예상 비용: {messageType === 'kakao' ? '약 8원' : messageType === 'lms' ? '약 30원' : '약 9원'} × {filteredRecipients.length}명
              </p>
            </div>
          </div>

          {/* 미리보기 */}
          {previewMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-bold text-blue-800 mb-2">미리보기 (첫 번째 수신자 기준)</h4>
              <p className="text-sm text-blue-900 whitespace-pre-wrap">{previewMessage}</p>
            </div>
          )}

          {/* 발송 버튼 */}
          <button
            onClick={handleSend}
            disabled={isSending || filteredRecipients.length === 0}
            className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-colors ${
              isSending || filteredRecipients.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSending ? '발송 중...' : `${filteredRecipients.length}명에게 발송하기`}
          </button>

          {/* 발송 결과 */}
          {sendResult && (
            <div className={`rounded-lg p-4 ${
              sendResult.includes('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm font-semibold whitespace-pre-wrap ${
                sendResult.includes('✅') ? 'text-green-800' : 'text-red-800'
              }`}>
                {sendResult}
              </p>
            </div>
          )}
        </div>

        {/* 오른쪽: 수신자 선택 */}
        <div className="space-y-6">
          {/* 수신자 선택 모드 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">수신자 선택</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={selectMode === 'all'}
                  onChange={() => setSelectMode('all')}
                  className="w-4 h-4"
                />
                <span className="font-semibold">전체 회원 ({allRecipients.length}명)</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={selectMode === 'role'}
                  onChange={() => setSelectMode('role')}
                  className="w-4 h-4"
                />
                <span className="font-semibold">역할별 선택</span>
              </label>

              {selectMode === 'role' && (
                <div className="ml-7">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">역할 선택</option>
                    <option value="partner">파트너</option>
                    <option value="puppyTeacher">퍼피티처</option>
                    <option value="retiredHomeCare">은퇴견홈케어</option>
                    <option value="parentCaregiver">부모견홈케어</option>
                  </select>
                </div>
              )}

              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={selectMode === 'custom'}
                  onChange={() => setSelectMode('custom')}
                  className="w-4 h-4"
                />
                <span className="font-semibold">개별 선택</span>
              </label>
            </div>
          </div>

          {/* 수신자 목록 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              수신자 목록 ({filteredRecipients.length}명)
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectMode === 'custom' ? (
                allRecipients.map(recipient => (
                  <label
                    key={recipient.userId}
                    className="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipients.has(recipient.userId)}
                      onChange={() => toggleRecipient(recipient.userId)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{recipient.userName}</p>
                      <p className="text-xs text-gray-600">
                        {recipient.dogName && `${recipient.dogName} · `}
                        {getRoleName(recipient.role!)} · {recipient.phone}
                      </p>
                    </div>
                  </label>
                ))
              ) : (
                filteredRecipients.map(recipient => (
                  <div
                    key={recipient.userId}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <p className="font-semibold text-sm">{recipient.userName}</p>
                    <p className="text-xs text-gray-600">
                      {recipient.dogName && `${recipient.dogName} · `}
                      {getRoleName(recipient.role!)} · {recipient.phone}
                    </p>
                  </div>
                ))
              )}
              {filteredRecipients.length === 0 && (
                <p className="text-center text-gray-500 py-8">수신자를 선택해주세요</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
